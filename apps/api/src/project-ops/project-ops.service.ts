import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { buildFinancePdf } from './finance.pdf';
import { buildAnalysisPdf } from './analysis.pdf';

const SITE_DEFAULTS: Record<string, { lat: number; lng: number }> = {
  JKW: { lat: 9.009, lng: 7.58 },
  MPP: { lat: 9.12, lng: 7.495 },
  GZ2: { lat: 9.017, lng: 7.51 },
  GZ3: { lat: 9.025, lng: 7.515 },
};

@Injectable()
export class ProjectOpsService {
  constructor(private readonly prisma: PrismaService) {}

  private projectWhere(user: AuthUser, id?: string) {
    const siteFilter =
      user.role === UserRole.CEO ||
      user.role === UserRole.ADMIN ||
      !user.siteIds.length
        ? {}
        : { siteId: { in: user.siteIds } };
    return id ? { id, ...siteFilter } : siteFilter;
  }

  private async requireProject(id: string, user: AuthUser) {
    const project = await this.prisma.project.findFirst({
      where: this.projectWhere(user, id),
      include: { site: true, charter: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  private assertStaff(user: AuthUser) {
    if (
      user.role === UserRole.CLIENT ||
      user.role === UserRole.ARTISAN ||
      user.role === UserRole.MARKETPLACE_SEEKER
    ) {
      throw new ForbiddenException('Staff only');
    }
  }

  async getTrackers(projectId: string, user: AuthUser) {
    this.assertStaff(user);
    await this.requireProject(projectId, user);

    const [mrs, workforce, contracts, labour] = await Promise.all([
      this.prisma.materialRequest.findMany({
        where: { projectId },
        include: { lines: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.workforceEntry.findMany({
        where: { projectId },
        orderBy: { workDate: 'desc' },
      }),
      this.prisma.worksContract.findMany({
        where: { projectId },
        include: { ivcs: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.labourSchedule.findMany({
        where: { projectId },
        include: { lines: true },
      }),
    ]);

    const materials = mrs.flatMap((r) =>
      r.lines.map((l) => {
        const qty = Number(l.quantityIssued || l.quantityApproved || l.quantityRequested);
        const unitCost = l.unitCost != null ? Number(l.unitCost) : null;
        const amount =
          l.amount != null
            ? Number(l.amount)
            : unitCost != null
              ? qty * unitCost
              : null;
        return {
          requestRef: r.requestRef,
          status: r.status,
          material: l.material,
          unit: l.unit,
          quantityIssued: Number(l.quantityIssued),
          quantityRequested: Number(l.quantityRequested),
          unitCost,
          amount,
        };
      }),
    );
    const materialsTotal = materials.reduce((s, m) => s + (m.amount ?? 0), 0);

    const workforceTotal = workforce.reduce((s, w) => s + Number(w.amountPaid), 0);

    const subcontractors = contracts.map((c) => {
      const paid = c.ivcs.reduce((sum, ivc) => {
        const stages = (ivc.stagesJson as { amountPaid?: number }[] | null) ?? [];
        return (
          sum +
          stages.reduce((a, st) => a + Number(st.amountPaid ?? 0), 0)
        );
      }, 0);
      return {
        id: c.id,
        number: c.number,
        subcontractorName: c.subcontractorName,
        contractSum: Number(c.contractSum),
        retentionPct: Number(c.retentionPct),
        platformFeeAmount: Number(c.platformFeeAmount),
        status: c.status,
        paidToDate: paid,
        balance: Number(c.contractSum) - paid,
        ivcCount: c.ivcs.length,
      };
    });
    const subcontractorsPaid = subcontractors.reduce((s, c) => s + c.paidToDate, 0);

    const labourPlanned = labour.reduce(
      (s, sch) =>
        s + sch.lines.reduce((a, line) => a + Number(line.totalAmount ?? 0), 0),
      0,
    );

    return {
      materials: { rows: materials, totalCost: materialsTotal },
      workforce: { rows: workforce, totalPaid: workforceTotal },
      subcontractors: { rows: subcontractors, totalPaid: subcontractorsPaid },
      labourPlannedTotal: labourPlanned,
      combinedTotal: materialsTotal + workforceTotal + subcontractorsPaid,
    };
  }

  async listWorkforce(projectId: string, user: AuthUser) {
    this.assertStaff(user);
    await this.requireProject(projectId, user);
    return this.prisma.workforceEntry.findMany({
      where: { projectId },
      orderBy: { workDate: 'desc' },
    });
  }

  async createWorkforce(
    projectId: string,
    body: {
      workDate: string;
      workerName: string;
      trade?: string;
      hoursWorked: number;
      ratePerHour: number;
      amountPaid?: number;
      paymentRef?: string;
      notes?: string;
    },
    user: AuthUser,
  ) {
    this.assertStaff(user);
    await this.requireProject(projectId, user);
    const hours = Number(body.hoursWorked);
    const rate = Number(body.ratePerHour);
    if (!body.workerName?.trim() || !body.workDate || !(hours > 0) || !(rate >= 0)) {
      throw new BadRequestException('workerName, workDate, hoursWorked, ratePerHour required');
    }
    const amountPaid = body.amountPaid != null ? Number(body.amountPaid) : hours * rate;
    return this.prisma.workforceEntry.create({
      data: {
        projectId,
        workDate: new Date(body.workDate),
        workerName: body.workerName.trim(),
        trade: body.trade?.trim() || null,
        hoursWorked: hours,
        ratePerHour: rate,
        amountPaid,
        paymentRef: body.paymentRef?.trim() || null,
        notes: body.notes?.trim() || null,
        createdById: user.id,
      },
    });
  }

  async deleteWorkforce(entryId: string, user: AuthUser) {
    this.assertStaff(user);
    const entry = await this.prisma.workforceEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Entry not found');
    await this.requireProject(entry.projectId, user);
    await this.prisma.workforceEntry.delete({ where: { id: entryId } });
    return { ok: true };
  }

  async getFinance(projectId: string, user: AuthUser) {
    this.assertStaff(user);
    const project = await this.requireProject(projectId, user);
    const trackers = await this.getTrackers(projectId, user);
    const invoices = await this.prisma.invoice.findMany({
      where: { projectId },
      include: { payments: true },
    });

    const invoiceBilled = invoices.reduce((s, i) => s + Number(i.revisedTotal), 0);
    const invoicePaid = invoices.reduce((s, i) => s + Number(i.paidTotal ?? 0), 0);

    const budget = project.budgetAmount != null ? Number(project.budgetAmount) : null;
    const spend =
      trackers.materials.totalCost +
      trackers.workforce.totalPaid +
      trackers.subcontractors.totalPaid;
    const sections = [
      { key: 'materials', label: 'Materials', amount: trackers.materials.totalCost },
      { key: 'workforce', label: 'Workforce', amount: trackers.workforce.totalPaid },
      {
        key: 'subcontractors',
        label: 'Subcontractors (IVC paid)',
        amount: trackers.subcontractors.totalPaid,
      },
      { key: 'labour_planned', label: 'Labour schedules (planned)', amount: trackers.labourPlannedTotal },
      { key: 'invoices_billed', label: 'Client invoices billed', amount: invoiceBilled },
      { key: 'invoices_paid', label: 'Client invoices paid', amount: invoicePaid },
    ];

    return {
      project: {
        id: project.id,
        name: project.name,
        budgetAmount: budget,
        budgetRange: project.charter?.budgetRange ?? null,
        processGroup: project.processGroup,
        status: project.status,
        site: project.site,
      },
      sections,
      spendTotal: spend,
      budgetRemaining: budget != null ? budget - spend : null,
      invoiceBilled,
      invoicePaid,
    };
  }

  async getFinancePdf(projectId: string, user: AuthUser) {
    const data = await this.getFinance(projectId, user);
    return buildFinancePdf(data);
  }

  async getFinanceCsv(projectId: string, user: AuthUser) {
    const data = await this.getFinance(projectId, user);
    const lines = [
      'section,amount',
      ...data.sections.map((s) => `"${s.label}",${s.amount.toFixed(2)}`),
      `"Spend total",${data.spendTotal.toFixed(2)}`,
      `"Budget",${data.project.budgetAmount ?? ''}`,
      `"Budget remaining",${data.budgetRemaining ?? ''}`,
    ];
    return lines.join('\n');
  }

  async getAnalysis(projectId: string, user: AuthUser) {
    this.assertStaff(user);
    const project = await this.requireProject(projectId, user);
    const [milestones, changes, logs, inspections, qcPlans, progress, finance] =
      await Promise.all([
        this.prisma.milestone.findMany({
          where: { projectId },
          orderBy: { stage: 'asc' },
        }),
        this.prisma.projectChangeLog.findMany({
          where: { projectId },
          orderBy: { revisionDate: 'desc' },
          take: 20,
        }),
        this.prisma.dailySiteLog.count({ where: { projectId } }),
        this.prisma.projectInspection.findMany({
          where: { projectId },
          orderBy: { inspectedAt: 'desc' },
          take: 20,
        }),
        this.prisma.qcPlan.findMany({
          where: { projectId },
          include: { items: true },
        }),
        this.prisma.progressReport.findMany({
          where: { projectId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        this.getFinance(projectId, user),
      ]);

    return {
      project: {
        id: project.id,
        name: project.name,
        processGroup: project.processGroup,
        status: project.status,
        site: project.site,
      },
      milestones: milestones.map((m) => ({
        stage: m.stage,
        progressPct: Number(m.progressPct),
        certifiedAt: m.certifiedAt,
      })),
      dailyLogCount: logs,
      openChanges: changes.filter((c) => !['APPROVED', 'REJECTED'].includes(c.status)).length,
      recentChanges: changes.map((c) => ({
        changeId: c.changeId,
        status: c.status,
        impactLevel: c.impactLevel,
        description: c.description.slice(0, 120),
      })),
      inspections: {
        total: inspections.length,
        fail: inspections.filter((i) => i.result === 'FAIL').length,
        recent: inspections.map((i) => ({
          number: i.number,
          category: i.category,
          result: i.result,
          inspectedAt: i.inspectedAt,
        })),
      },
      qcPlans: qcPlans.map((p) => ({
        number: p.number,
        title: p.title,
        status: p.status,
        itemCount: p.items.length,
      })),
      progressReports: progress.map((p) => ({
        number: p.number,
        status: p.status,
        createdAt: p.createdAt,
      })),
      finance,
    };
  }

  async getAnalysisPdf(projectId: string, user: AuthUser) {
    const data = await this.getAnalysis(projectId, user);
    return buildAnalysisPdf(data);
  }

  async setBudget(projectId: string, budgetAmount: number | null, user: AuthUser) {
    if (
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.PROJECT_MANAGER &&
      user.role !== UserRole.FINANCE
    ) {
      throw new ForbiddenException('Not allowed to set budget');
    }
    await this.requireProject(projectId, user);
    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        budgetAmount:
          budgetAmount == null || Number.isNaN(budgetAmount)
            ? null
            : new Prisma.Decimal(budgetAmount),
      },
    });
  }

  // ─── QC Plans ─────────────────────────────────────────────────────────────

  async listQcPlans(user: AuthUser, projectId?: string) {
    this.assertStaff(user);
    return this.prisma.qcPlan.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        project: this.projectWhere(user),
      },
      include: { items: { orderBy: { sortOrder: 'asc' } }, project: { include: { site: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createQcPlan(
    body: {
      projectId: string;
      title: string;
      preparedBy?: string;
      notes?: string;
      items?: {
        activity: string;
        inspectionPoint: string;
        acceptanceCriteria?: string;
        method?: string;
        responsible?: string;
        plannedDate?: string;
        linkedSection?: string;
      }[];
    },
    user: AuthUser,
  ) {
    this.assertStaff(user);
    await this.requireProject(body.projectId, user);
    const count = await this.prisma.qcPlan.count({ where: { projectId: body.projectId } });
    const number = `QCP-${String(count + 1).padStart(3, '0')}`;
    return this.prisma.qcPlan.create({
      data: {
        number,
        projectId: body.projectId,
        title: body.title.trim(),
        preparedBy: body.preparedBy?.trim() || `${user.firstName} ${user.lastName}`,
        notes: body.notes?.trim() || null,
        items: body.items?.length
          ? {
              create: body.items.map((it, i) => ({
                sortOrder: i,
                activity: it.activity,
                inspectionPoint: it.inspectionPoint,
                acceptanceCriteria: it.acceptanceCriteria || null,
                method: it.method || null,
                responsible: it.responsible || null,
                plannedDate: it.plannedDate ? new Date(it.plannedDate) : null,
                linkedSection: it.linkedSection || null,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });
  }

  async updateQcPlanStatus(id: string, status: 'DRAFT' | 'ACTIVE' | 'COMPLETE', user: AuthUser) {
    this.assertStaff(user);
    const plan = await this.prisma.qcPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('QC plan not found');
    await this.requireProject(plan.projectId, user);
    return this.prisma.qcPlan.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
  }

  // ─── Field map ────────────────────────────────────────────────────────────

  async getFieldMap(user: AuthUser) {
    this.assertStaff(user);
    const sites = await this.prisma.site.findMany({
      where: { isActive: true },
      include: {
        projects: {
          where: { status: { in: ['PLANNING', 'ACTIVE'] } },
          select: { id: true, name: true },
        },
      },
    });

    const artisans = await this.prisma.artisanProfile.findMany({
      where: { status: 'APPROVED' },
      take: 200,
    });

    const inspections = await this.prisma.projectInspection.findMany({
      where: {
        OR: [{ latitude: { not: null } }, { longitude: { not: null } }],
        project: this.projectWhere(user),
      },
      include: { project: { include: { site: true } } },
      orderBy: { inspectedAt: 'desc' },
      take: 100,
    });

    return {
      sites: sites.map((s) => {
        const def = SITE_DEFAULTS[s.code];
        return {
          type: 'site' as const,
          id: s.id,
          label: `${s.code} — ${s.name}`,
          lat: s.latitude != null ? Number(s.latitude) : def?.lat ?? 9.05,
          lng: s.longitude != null ? Number(s.longitude) : def?.lng ?? 7.49,
          meta: s.location,
          projectNames: s.projects.map((p) => p.name),
        };
      }),
      artisans: artisans
        .filter((a) => a.latitude != null && a.longitude != null)
        .map((a) => ({
          type: 'artisan' as const,
          id: a.id,
          label: a.fullName,
          lat: Number(a.latitude),
          lng: Number(a.longitude),
          meta: a.phone,
        })),
      inspections: inspections
        .filter((i) => i.latitude != null && i.longitude != null)
        .map((i) => ({
          type: 'inspection' as const,
          id: i.id,
          label: `${i.number} · ${i.category}`,
          lat: Number(i.latitude),
          lng: Number(i.longitude),
          meta: i.project.name,
        })),
    };
  }

  async updateSiteCoords(
    siteId: string,
    body: { latitude: number; longitude: number },
    user: AuthUser,
  ) {
    if (user.role !== UserRole.CEO && user.role !== UserRole.ADMIN && user.role !== UserRole.PROJECT_MANAGER) {
      throw new ForbiddenException();
    }
    return this.prisma.site.update({
      where: { id: siteId },
      data: {
        latitude: body.latitude,
        longitude: body.longitude,
      },
    });
  }
}
