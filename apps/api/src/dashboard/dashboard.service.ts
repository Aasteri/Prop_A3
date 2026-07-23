import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  ChangeImpactLevel,
  ChangeLogStatus,
  DailyLogStatus,
  LeadStage,
  MaterialRequestStatus,
  MilestoneStage,
  ProjectStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

/** Demo COREN expiry for engineer dashboard widget until licence module ships. */
const DEMO_COREN_EXPIRY = new Date('2026-08-22');

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getCeoSummary(user: AuthUser) {
    if (user.role !== UserRole.CEO && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('CEO dashboard access only');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      sites,
      invoiceAgg,
      leadsByStage,
      highImpactChanges,
      engineers,
      fcdaProjects,
      terrierAgg,
      openHse,
      pendingLogs,
      pendingLogsBySite,
    ] = await Promise.all([
      this.prisma.site.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
        include: {
          projects: {
            where: { status: ProjectStatus.ACTIVE },
            select: {
              id: true,
              name: true,
              fcdaPermitUrl: true,
              milestones: {
                where: { stage: MilestoneStage.FOUNDATION },
                select: { progressPct: true },
              },
            },
          },
          dailyLogs: {
            where: { date: { gte: today, lt: tomorrow } },
            select: { id: true, status: true, projectId: true },
          },
          hseIncidents: {
            where: { status: { in: ['DRAFT', 'OPEN', 'INVESTIGATING'] } },
            select: { id: true },
          },
        },
      }),
      this.prisma.invoice.aggregate({
        _sum: { paidTotal: true, outstanding: true, revisedTotal: true },
        _count: true,
        where: { status: { not: 'CANCELLED' } },
      }),
      this.prisma.lead.groupBy({
        by: ['stage'],
        _count: true,
      }),
      this.prisma.projectChangeLog.findMany({
        where: {
          impactLevel: ChangeImpactLevel.HIGH,
          status: { in: [ChangeLogStatus.DRAFT, ChangeLogStatus.IN_REVIEW] },
        },
        include: {
          project: { select: { name: true } },
          site: { select: { code: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.user.findMany({
        where: { role: UserRole.ENGINEER, isActive: true },
        select: { id: true, firstName: true, lastName: true, email: true },
      }),
      this.prisma.project.findMany({
        where: { status: ProjectStatus.ACTIVE },
        include: {
          site: { select: { code: true, name: true } },
          milestones: {
            where: { stage: MilestoneStage.FOUNDATION },
            select: { progressPct: true },
          },
        },
      }),
      this.prisma.estateTerrierRow.aggregate({
        _sum: { netRentalIncome: true, rentAmountNgn: true, expenseAmount: true },
        _count: true,
      }),
      this.prisma.hseIncident.count({
        where: { status: { in: ['DRAFT', 'OPEN', 'INVESTIGATING'] } },
      }),
      this.prisma.dailySiteLog.count({
        where: { status: DailyLogStatus.SUBMITTED },
      }),
      this.prisma.dailySiteLog.groupBy({
        by: ['siteId'],
        where: { status: DailyLogStatus.SUBMITTED },
        _count: true,
      }),
    ]);

    const pendingBySiteId = Object.fromEntries(
      pendingLogsBySite.map((g) => [g.siteId, g._count]),
    );

    const siteHealth = sites.map((site) => {
      const activeProjects = site.projects.length;
      const logsToday = site.dailyLogs.filter(
        (l) => l.status !== DailyLogStatus.DRAFT,
      ).length;
      const projectsWithLogIds = new Set(
        site.dailyLogs
          .filter((l) => l.status !== DailyLogStatus.DRAFT)
          .map((l) => l.projectId),
      );
      const missingLogs = site.projects.filter((p) => !projectsWithLogIds.has(p.id)).length;

      return {
        siteCode: site.code,
        siteName: site.name,
        activeProjects,
        logsToday,
        logSubmissionRate:
          activeProjects > 0
            ? Math.round((projectsWithLogIds.size / activeProjects) * 100)
            : 0,
        missingLogsToday: missingLogs,
        openHseCount: site.hseIncidents.length,
        pendingLogApprovals: pendingBySiteId[site.id] ?? 0,
      };
    });

    const leadCounts = Object.fromEntries(
      leadsByStage.map((g) => [g.stage, g._count]),
    ) as Partial<Record<LeadStage, number>>;
    const won = leadCounts.WON ?? 0;
    const lost = leadCounts.LOST ?? 0;
    const closed = won + lost;
    const activeLeadStages: LeadStage[] = [
      LeadStage.INQUIRY,
      LeadStage.CONTACTED,
      LeadStage.VIEWING,
      LeadStage.NEGOTIATION,
      LeadStage.RESERVED,
    ];
    const activeLeads = activeLeadStages.reduce((s, st) => s + (leadCounts[st] ?? 0), 0);

    const fcdaMissing = fcdaProjects
      .filter((p) => {
        const foundation = p.milestones[0];
        const foundationPct = foundation ? Number(foundation.progressPct) : 0;
        return foundationPct >= 99 && !p.fcdaPermitUrl;
      })
      .map((p) => ({
        id: p.id,
        name: p.name,
        siteCode: p.site.code,
        siteName: p.site.name,
      }));

    const now = new Date();
    const corenLicences = engineers.map((e) => {
      const daysRemaining = Math.ceil(
        (DEMO_COREN_EXPIRY.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        engineer: e,
        licenceNumber: 'COREN/R/DEMO-001',
        expiresAt: DEMO_COREN_EXPIRY,
        daysRemaining,
        status: daysRemaining <= 0 ? 'EXPIRED' : daysRemaining <= 30 ? 'EXPIRING' : 'OK',
      };
    });

    return {
      siteHealth,
      revenue: {
        invoiceCount: invoiceAgg._count,
        totalBilled: Number(invoiceAgg._sum.revisedTotal ?? 0),
        totalCollected: Number(invoiceAgg._sum.paidTotal ?? 0),
        totalOutstanding: Number(invoiceAgg._sum.outstanding ?? 0),
      },
      leads: {
        active: activeLeads,
        won,
        lost,
        conversionRate: closed > 0 ? Math.round((won / closed) * 100) : 0,
        byStage: leadCounts,
      },
      highImpactChanges,
      corenLicences,
      fcdaMissing,
      rental: {
        unitCount: terrierAgg._count,
        totalRent: Number(terrierAgg._sum.rentAmountNgn ?? 0),
        totalExpenses: Number(terrierAgg._sum.expenseAmount ?? 0),
        netIncome: Number(terrierAgg._sum.netRentalIncome ?? 0),
      },
      compliance: {
        openHseCount: openHse,
        pendingLogApprovals: pendingLogs,
        fcdaMissingCount: fcdaMissing.length,
        highImpactChangeCount: highImpactChanges.length,
        expiringCorenCount: corenLicences.filter((l) => l.status === 'EXPIRING').length,
      },
    };
  }

  async getPmSummary(user: AuthUser) {
    const siteFilter =
      user.role === UserRole.CEO || user.role === UserRole.ADMIN || !user.siteIds.length
        ? {}
        : { siteId: { in: user.siteIds } };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      pendingLogCount,
      pendingLogs,
      pendingMaterialCount,
      pendingMaterials,
      openHse,
      todaysIssues,
      unreadCount,
      activeProjects,
    ] = await Promise.all([
      this.prisma.dailySiteLog.count({
        where: { ...siteFilter, status: DailyLogStatus.SUBMITTED },
      }),
      this.prisma.dailySiteLog.findMany({
        where: { ...siteFilter, status: DailyLogStatus.SUBMITTED },
        include: {
          site: { select: { code: true, name: true } },
          submittedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { submittedAt: 'desc' },
        take: 10,
      }),
      this.prisma.materialRequest.count({
        where: { ...siteFilter, status: MaterialRequestStatus.PENDING_APPROVAL },
      }),
      this.prisma.materialRequest.findMany({
        where: { ...siteFilter, status: MaterialRequestStatus.PENDING_APPROVAL },
        include: { site: { select: { code: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.hseIncident.count({
        where: {
          ...siteFilter,
          status: { in: ['DRAFT', 'OPEN', 'INVESTIGATING'] },
        },
      }),
      this.prisma.dailySiteLog.findMany({
        where: {
          ...siteFilter,
          date: { gte: today, lt: tomorrow },
          OR: [
            { issueMaterialShortage: true },
            { issueEquipmentBreakdown: true },
            { issueWeatherDelay: true },
            { safetyIncidentsNearMisses: true },
          ],
        },
        select: {
          id: true,
          refCode: true,
          projectName: true,
          issueMaterialShortage: true,
          issueEquipmentBreakdown: true,
          issueWeatherDelay: true,
          safetyIncidentsNearMisses: true,
          site: { select: { code: true } },
        },
        take: 10,
      }),
      this.prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
      this.prisma.project.count({
        where: {
          ...siteFilter,
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      pendingLogCount,
      pendingLogs,
      pendingMaterialCount,
      pendingMaterials,
      openHseCount: openHse,
      todaysIssues,
      unreadNotifications: unreadCount,
      activeProjects,
    };
  }
}
