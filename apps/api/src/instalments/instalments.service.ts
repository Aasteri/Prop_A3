import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InstalmentLineStatus,
  InstalmentPlanStatus,
  NotificationType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateInstalmentPlanDto,
  RecordInstalmentPaymentDto,
} from './dto/instalment.dto';

/** Sheet 2 default payment schedule (% of contract price). */
export const DEFAULT_INSTALMENT_PCTS = [20, 15, 15, 15, 15, 20];

const include = {
  client: {
    select: { id: true, clientRef: true, firstName: true, lastName: true },
  },
  project: { select: { id: true, name: true } },
  lines: { orderBy: { monthIndex: 'asc' as const } },
};

@Injectable()
export class InstalmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll(user: AuthUser, projectId?: string) {
    this.assertCanView(user);
    return this.prisma.purchaserInstalmentPlan
      .findMany({
        where: projectId ? { projectId } : undefined,
        include,
        orderBy: { createdAt: 'desc' },
      })
      .then((rows) => rows.map((r) => this.serialize(r)));
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.purchaserInstalmentPlan.findUnique({
      where: { id },
      include,
    });
    if (!row) throw new NotFoundException('Instalment plan not found');
    return this.serialize(row);
  }

  async summary(user: AuthUser) {
    this.assertCanView(user);
    const plans = await this.prisma.purchaserInstalmentPlan.findMany({
      include: { lines: true },
    });
    let contractTotal = 0;
    let collectedTotal = 0;
    const monthlyInflow = [0, 0, 0, 0, 0, 0];
    for (const p of plans) {
      contractTotal += Number(p.contractPrice);
      for (const l of p.lines) {
        const collected = Number(l.amountCollected);
        collectedTotal += collected;
        if (l.monthIndex >= 1 && l.monthIndex <= 6) {
          monthlyInflow[l.monthIndex - 1] += collected;
        }
      }
    }
    return {
      planCount: plans.length,
      contractTotal: Math.round(contractTotal * 100) / 100,
      collectedTotal: Math.round(collectedTotal * 100) / 100,
      outstandingTotal: Math.round((contractTotal - collectedTotal) * 100) / 100,
      monthlyInflow: monthlyInflow.map((n) => Math.round(n * 100) / 100),
      defaultSchedulePcts: DEFAULT_INSTALMENT_PCTS,
    };
  }

  async create(dto: CreateInstalmentPlanDto, user: AuthUser) {
    this.assertCanManage(user);
    if (dto.clientId) {
      const c = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
      if (!c) throw new NotFoundException('Client not found');
    }
    if (dto.projectId) {
      const p = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
      if (!p) throw new NotFoundException('Project not found');
    }

    const pcts = (dto.schedulePcts?.map((s) => s.pct) ?? DEFAULT_INSTALMENT_PCTS).slice(0, 6);
    while (pcts.length < 6) pcts.push(0);
    const pctSum = pcts.reduce((s, p) => s + p, 0);
    if (Math.abs(pctSum - 100) > 0.05) {
      throw new BadRequestException(`Schedule percentages must total 100% (got ${pctSum}%)`);
    }

    const start = dto.startDate ? new Date(dto.startDate) : new Date();
    const year = start.getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    const price = dto.contractPrice;

    const lines = pcts.map((pct, i) => {
      const due = new Date(start);
      due.setMonth(due.getMonth() + i);
      const amountDue = Math.round(price * (pct / 100) * 100) / 100;
      return {
        monthIndex: i + 1,
        pctDue: pct,
        amountDue,
        amountCollected: 0,
        dueDate: due,
        status: InstalmentLineStatus.PENDING,
      };
    });

    const row = await this.prisma.purchaserInstalmentPlan.create({
      data: {
        number: `INS-${year}-${stamp}`,
        purchaserName: dto.purchaserName,
        unitPlotNo: dto.unitPlotNo,
        contractPrice: price,
        clientId: dto.clientId,
        projectId: dto.projectId,
        notes: dto.notes,
        status: InstalmentPlanStatus.ACTIVE,
        lines: { create: lines },
      },
      include,
    });

    const recipients = [
      ...(await this.notifications.financeUserIds()),
      ...(await this.notifications.salesUserIds()),
    ].filter((id) => id !== user.id);
    if (recipients.length) {
      await this.notifications.notifyUsers(recipients, {
        type: NotificationType.PURCHASER_INSTALMENT,
        title: `Instalment plan created — ${row.number}`,
        body: `${row.purchaserName} · ${row.unitPlotNo} · NGN ${price.toLocaleString()}`,
        linkUrl: '/instalments',
      });
    }

    return this.serialize(row);
  }

  async recordPayment(
    lineId: string,
    dto: RecordInstalmentPaymentDto,
    user: AuthUser,
  ) {
    this.assertCanManage(user);
    const line = await this.prisma.purchaserInstalmentLine.findUnique({
      where: { id: lineId },
      include: { plan: true },
    });
    if (!line) throw new NotFoundException('Instalment line not found');
    if (line.plan.status === InstalmentPlanStatus.COMPLETED) {
      throw new BadRequestException('Plan already completed');
    }

    const nextCollected =
      Math.round((Number(line.amountCollected) + dto.amount) * 100) / 100;
    const due = Number(line.amountDue);
    if (nextCollected > due + 0.01) {
      throw new BadRequestException('Collected amount exceeds amount due for this month');
    }

    const status =
      nextCollected >= due - 0.01
        ? InstalmentLineStatus.PAID
        : nextCollected > 0
          ? InstalmentLineStatus.PARTIAL
          : InstalmentLineStatus.PENDING;

    await this.prisma.purchaserInstalmentLine.update({
      where: { id: lineId },
      data: {
        amountCollected: nextCollected,
        status,
        paymentRef: dto.paymentRef ?? line.paymentRef,
        paidAt:
          status === InstalmentLineStatus.PAID
            ? dto.paidAt
              ? new Date(dto.paidAt)
              : new Date()
            : line.paidAt,
      },
    });

    const plan = await this.findOne(line.planId, user);
    const allPaid = plan.lines.every((l) => l.status === 'PAID');
    if (allPaid) {
      await this.prisma.purchaserInstalmentPlan.update({
        where: { id: line.planId },
        data: { status: InstalmentPlanStatus.COMPLETED },
      });
      return this.findOne(line.planId, user);
    }
    return plan;
  }

  /** Flag overdue unpaid months as MISSED and notify Sales + Finance. */
  async flagMissed(user: AuthUser) {
    this.assertCanManage(user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = await this.prisma.purchaserInstalmentLine.findMany({
      where: {
        status: { in: [InstalmentLineStatus.PENDING, InstalmentLineStatus.PARTIAL] },
        dueDate: { lt: today },
        plan: { status: InstalmentPlanStatus.ACTIVE },
      },
      include: { plan: true },
    });

    let flagged = 0;
    for (const line of overdue) {
      if (line.status === InstalmentLineStatus.MISSED) continue;
      await this.prisma.purchaserInstalmentLine.update({
        where: { id: line.id },
        data: { status: InstalmentLineStatus.MISSED },
      });
      flagged += 1;

      const recipients = [
        ...(await this.notifications.financeUserIds()),
        ...(await this.notifications.salesUserIds()),
      ];
      if (line.plan.clientId) {
        const client = await this.prisma.client.findUnique({
          where: { id: line.plan.clientId },
          select: { portalUserId: true },
        });
        if (client?.portalUserId) recipients.push(client.portalUserId);
      }
      if (recipients.length) {
        await this.notifications.notifyUsers(recipients, {
          type: NotificationType.PURCHASER_INSTALMENT,
          title: `Missed instalment — ${line.plan.number} M${line.monthIndex}`,
          body: `${line.plan.purchaserName} · due NGN ${Number(line.amountDue).toLocaleString()} · collected NGN ${Number(line.amountCollected).toLocaleString()}`,
          linkUrl: '/instalments',
        });
      }
    }

    return { flagged, checked: overdue.length };
  }

  async findForClient(clientId: string) {
    return this.prisma.purchaserInstalmentPlan
      .findMany({
        where: { clientId },
        include,
        orderBy: { createdAt: 'desc' },
      })
      .then((rows) => rows.map((r) => this.serialize(r)));
  }

  private serialize<T extends { contractPrice: unknown; lines: Array<Record<string, unknown>> }>(
    row: T,
  ) {
    const lines = row.lines.map((l) => ({
      ...l,
      pctDue: Number(l.pctDue),
      amountDue: Number(l.amountDue),
      amountCollected: Number(l.amountCollected),
    }));
    const totalCollected = lines.reduce((s, l) => s + Number(l.amountCollected), 0);
    const contractPrice = Number(row.contractPrice);
    return {
      ...row,
      contractPrice,
      lines,
      totalCollected: Math.round(totalCollected * 100) / 100,
      balanceOutstanding: Math.round((contractPrice - totalCollected) * 100) / 100,
    };
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.FINANCE,
      UserRole.SALES,
      UserRole.CEO,
      UserRole.ADMIN,
      UserRole.PROJECT_MANAGER,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }

  private assertCanManage(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.FINANCE,
      UserRole.SALES,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }
}
