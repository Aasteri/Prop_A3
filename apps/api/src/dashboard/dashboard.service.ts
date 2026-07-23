import { Injectable } from '@nestjs/common';
import {
  DailyLogStatus,
  MaterialRequestStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

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
      pendingLogCount: pendingLogs.length,
      pendingLogs,
      pendingMaterialCount: pendingMaterials.length,
      pendingMaterials,
      openHseCount: openHse,
      todaysIssues,
      unreadNotifications: unreadCount,
      activeProjects,
    };
  }
}
