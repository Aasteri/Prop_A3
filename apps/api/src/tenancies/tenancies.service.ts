import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType, RenewalNoticeKind, TenancyStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateTenancyDto,
  ListTenanciesQueryDto,
  UpdateTenancyDto,
} from './dto/tenancy.dto';

const include = {
  property: { select: { id: true, name: true, code: true, address: true } },
  unit: { select: { id: true, unitCode: true, unitType: true } },
  renewalNotices: true,
  _count: { select: { inventories: true } },
};

@Injectable()
export class TenanciesService {
  private readonly logger = new Logger(TenanciesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll(user: AuthUser, query: ListTenanciesQueryDto) {
    this.assertCanView(user);
    return this.prisma.tenancy.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.propertyId ? { propertyId: query.propertyId } : {}),
        ...(query.search
          ? {
              OR: [
                { tenantName: { contains: query.search } },
                { agreementNo: { contains: query.search } },
                { tenantPhone: { contains: query.search } },
              ],
            }
          : {}),
      },
      include,
      orderBy: { endDate: 'asc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.tenancy.findUnique({ where: { id }, include });
    if (!row) throw new NotFoundException('Tenancy not found');
    return row;
  }

  async create(dto: CreateTenancyDto, user: AuthUser) {
    this.assertCanManage(user);
    const property = await this.prisma.propertyAsset.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    return this.prisma.tenancy.create({
      data: {
        propertyId: dto.propertyId,
        unitId: dto.unitId,
        agreementNo: dto.agreementNo,
        tenantName: dto.tenantName,
        tenantPhone: dto.tenantPhone,
        tenantEmail: dto.tenantEmail,
        applicationId: dto.applicationId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        rentAnnual: dto.rentAnnual,
        cautionAmount: dto.cautionAmount,
        serviceCharge: dto.serviceCharge,
        status: dto.status ?? 'ACTIVE',
      },
      include,
    });
  }

  async update(id: string, dto: UpdateTenancyDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.findOne(id, user);
    return this.prisma.tenancy.update({
      where: { id },
      data: {
        tenantName: dto.tenantName,
        tenantPhone: dto.tenantPhone,
        tenantEmail: dto.tenantEmail,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        rentAnnual: dto.rentAnnual,
        cautionAmount: dto.cautionAmount,
        serviceCharge: dto.serviceCharge,
        status: dto.status,
      },
      include,
    });
  }

  listRenewalDue(user: AuthUser) {
    this.assertCanView(user);
    const now = new Date();
    const in95 = new Date(now);
    in95.setDate(in95.getDate() + 95);
    return this.prisma.tenancy.findMany({
      where: {
        status: { in: [TenancyStatus.ACTIVE, TenancyStatus.RENEWAL_PENDING] },
        endDate: { lte: in95, gte: now },
      },
      include,
      orderBy: { endDate: 'asc' },
    });
  }

  /** Idempotent 3-month / 1-month renewal reminders (BRD G.13). */
  async processRenewalReminders() {
    const now = new Date();
    const active = await this.prisma.tenancy.findMany({
      where: {
        status: { in: [TenancyStatus.ACTIVE, TenancyStatus.RENEWAL_PENDING] },
        endDate: { gte: now },
      },
      include: { renewalNotices: true, property: { select: { name: true } } },
    });

    const staff = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: [UserRole.PROJECT_MANAGER, UserRole.FINANCE, UserRole.CEO, UserRole.ADMIN] },
      },
      select: { id: true },
    });
    const staffIds = staff.map((u) => u.id);

    let created = 0;
    for (const t of active) {
      const end = new Date(t.endDate);
      const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      const checks: { kind: RenewalNoticeKind; maxDays: number; minDays: number; label: string }[] =
        [
          { kind: RenewalNoticeKind.THREE_MONTH, maxDays: 95, minDays: 85, label: '3-month' },
          { kind: RenewalNoticeKind.ONE_MONTH, maxDays: 35, minDays: 25, label: '1-month' },
        ];

      for (const check of checks) {
        if (daysLeft > check.maxDays || daysLeft < check.minDays) continue;
        const existing = t.renewalNotices.find((n) => n.kind === check.kind);
        if (existing?.sentAt) continue;

        const dueDate = new Date(end);
        dueDate.setDate(dueDate.getDate() - (check.kind === 'THREE_MONTH' ? 90 : 30));

        await this.prisma.tenancyRenewalNotice.upsert({
          where: { tenancyId_kind: { tenancyId: t.id, kind: check.kind } },
          create: {
            tenancyId: t.id,
            kind: check.kind,
            dueDate,
            sentAt: new Date(),
            channel: 'in_app',
            notes: `${check.label} renewal reminder`,
          },
          update: { sentAt: new Date() },
        });

        if (t.status === TenancyStatus.ACTIVE) {
          await this.prisma.tenancy.update({
            where: { id: t.id },
            data: { status: TenancyStatus.RENEWAL_PENDING },
          });
        }

        if (staffIds.length) {
          await this.notifications.notifyUsers(staffIds, {
            type: NotificationType.TENANCY_RENEWAL,
            title: `Tenancy renewal · ${t.tenantName}`,
            body: `${t.property.name} expires ${end.toISOString().slice(0, 10)} (${daysLeft}d). ${check.label} reminder.`,
            linkUrl: '/tenancies',
          });
        }
        created += 1;
      }
    }

    this.logger.log(`Renewal reminders processed: ${created}`);
    return { created };
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.SALES,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }

  private assertCanManage(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) {
      throw new ForbiddenException('Only PM, Finance, or Admin can manage tenancies');
    }
  }
}
