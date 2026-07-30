import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LicenceType, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const ALERT_THRESHOLDS_DAYS = [90, 30, 7];

@Injectable()
export class ComplianceCronService {
  private readonly logger = new Logger(ComplianceCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** 08:00 WAT (07:00 UTC) — COREN licence expiry alerts */
  @Cron('0 7 * * *')
  async alertExpiringLicences() {
    const licences = await this.prisma.professionalLicence.findMany({
      where: { isActive: true, licenceType: LicenceType.COREN },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!licences.length) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const ceoIds = await this.notifications.ceoUserIds();

    for (const licence of licences) {
      const expires = new Date(licence.expiresAt);
      expires.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (!ALERT_THRESHOLDS_DAYS.includes(daysRemaining) && daysRemaining > 0) continue;
      if (daysRemaining < 0) continue;

      const holder =
        licence.holderName ?? `${licence.user.firstName} ${licence.user.lastName}`;
      const title =
        daysRemaining === 0
          ? `COREN licence expired — ${holder}`
          : `COREN licence expires in ${daysRemaining} days`;

      await this.notifications.notifyUsers([licence.userId, ...ceoIds], {
        type: NotificationType.COREN_LICENCE_EXPIRING,
        title,
        body: `${holder} (${licence.licenceNumber}) expires ${expires.toISOString().slice(0, 10)}. Renew before practising engineering work.`,
        linkUrl: '/dashboard',
      });

      this.logger.log(`COREN alert: ${licence.licenceNumber} — ${daysRemaining} days`);
    }
  }
}
