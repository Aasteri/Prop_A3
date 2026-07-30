import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UserRole } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

@Injectable()
export class WeeklyReportCronService {
  private readonly logger = new Logger(WeeklyReportCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboard: DashboardService,
    private readonly mail: MailService,
  ) {}

  /** Monday 08:00 WAT (07:00 UTC) — Charter weekly PM report */
  @Cron('0 7 * * 1')
  async emailWeeklyReports() {
    if (!this.mail.isConfigured()) {
      this.logger.warn('SMTP not configured — skipping weekly report emails');
      return;
    }

    const recipients = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: [UserRole.PROJECT_MANAGER, UserRole.CEO, UserRole.ADMIN] },
      },
      include: { siteAssignments: { select: { siteId: true } } },
    });

    for (const user of recipients) {
      try {
        const siteIds = new Set<string>();
        if (user.primarySiteId) siteIds.add(user.primarySiteId);
        for (const a of user.siteAssignments) siteIds.add(a.siteId);

        const report = await this.dashboard.getWeeklyPmReport({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          primarySiteId: user.primarySiteId,
          siteIds: [...siteIds],
        });

        const siteLines = report.bySite
          .map(
            (s) =>
              `  ${s.siteCode}: ${s.approvedLogs} approved log(s), ${s.openIssues} with issues`,
          )
          .join('\n');

        const text = [
          `Hi ${user.firstName},`,
          '',
          report.narrative,
          '',
          'By site:',
          siteLines || '  (no site data)',
          '',
          `Pending log approvals: ${report.summary.pendingLogApprovals}`,
          `Pending material requests: ${report.summary.pendingMaterialRequests}`,
          '',
          'Open dashboard: https://propa3.com/dashboard',
        ].join('\n');

        await this.mail.send({
          to: user.email,
          subject: `[Propa3] Weekly site report ${report.period.from} – ${report.period.to}`,
          text,
        });
      } catch (err) {
        this.logger.warn(
          `Weekly report email failed for ${user.email}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    this.logger.log(`Weekly report emails sent to ${recipients.length} recipient(s)`);
  }
}
