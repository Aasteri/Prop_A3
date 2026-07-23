import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DailyLogStatus, NotificationType, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SiteTrackerCronService {
  private readonly logger = new Logger(SiteTrackerCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** 18:00 West Africa Time (UTC+1) = 17:00 UTC — Charter rule #3 */
  @Cron('0 17 * * 1-6')
  async alertMissingDailyLogs() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const activeProjects = await this.prisma.project.findMany({
      where: { status: ProjectStatus.ACTIVE },
      include: { site: true },
    });

    for (const project of activeProjects) {
      const log = await this.prisma.dailySiteLog.findFirst({
        where: {
          projectId: project.id,
          date: today,
          status: { in: [DailyLogStatus.SUBMITTED, DailyLogStatus.APPROVED] },
        },
      });

      if (log) continue;

      const pmId = project.projectManagerId;
      const foremen = await this.notifications.foremenForSite(project.siteId);
      const recipients = [...foremen, ...(pmId ? [pmId] : [])];
      const unique = [...new Set(recipients)];

      await this.notifications.notifyUsers(unique, {
        type: NotificationType.DAILY_LOG_MISSING,
        title: 'Daily site log missing',
        body: `No submitted log for ${project.name} (${project.site.code}) today.`,
        linkUrl: '/site-tracker/new',
      });

      this.logger.log(
        `Missing log alert: ${project.site.code} / ${project.name} → ${unique.length} users`,
      );
    }
  }
}
