import { Injectable } from '@nestjs/common';
import { HseIncidentStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class HseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createDraftFromLog(log: {
    id: string;
    siteId: string;
    projectId: string;
    refCode: string;
    projectName: string;
    issueOther: string | null;
    submittedById: string | null;
  }) {
    const existing = await this.prisma.hseIncident.findUnique({
      where: { dailyLogId: log.id },
    });
    if (existing) return existing;

    const description = [
      `Auto-draft from daily log ${log.refCode} (${log.projectName}).`,
      'Safety incident or near-miss flagged on site tracker.',
      log.issueOther ? `Notes: ${log.issueOther}` : null,
    ]
      .filter(Boolean)
      .join(' ');

    const incident = await this.prisma.hseIncident.create({
      data: {
        siteId: log.siteId,
        projectId: log.projectId,
        dailyLogId: log.id,
        status: HseIncidentStatus.DRAFT,
        description,
        reportedById: log.submittedById,
      },
      include: { site: true, project: true },
    });

    const managerIds = await this.notifications.siteManagerIds(log.siteId);
    await this.notifications.notifyUsers(managerIds, {
      type: NotificationType.HSE_INCIDENT_DRAFT,
      title: 'HSE incident draft created',
      body: `${log.refCode} — review and open investigation.`,
      linkUrl: `/site-tracker/${log.id}`,
    });

    return incident;
  }

  async findAll(userSiteIds: string[], isCeo: boolean) {
    const where = isCeo ? {} : { siteId: { in: userSiteIds } };
    return this.prisma.hseIncident.findMany({
      where,
      include: {
        site: { select: { code: true, name: true } },
        project: { select: { name: true } },
        dailyLog: { select: { refCode: true } },
      },
      orderBy: { reportedAt: 'desc' },
      take: 50,
    });
  }
}
