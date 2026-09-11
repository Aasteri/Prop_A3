import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType, UserRole } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

export type NotifyPayload = {
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private appUrl(): string {
    const web = this.config.get<string>('WEB_URL')?.split(',')[0]?.trim();
    return web ?? this.config.get<string>('API_URL') ?? 'https://propa3.com';
  }

  private async sendEmails(userIds: string[], payload: NotifyPayload) {
    if (!this.mail.isConfigured()) return;

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, isActive: true },
      select: { email: true, firstName: true },
    });

    const link = payload.linkUrl
      ? `${this.appUrl()}${payload.linkUrl.startsWith('/') ? payload.linkUrl : `/${payload.linkUrl}`}`
      : `${this.appUrl()}/dashboard`;

    for (const user of users) {
      try {
        await this.mail.send({
          to: user.email,
          subject: `[Propa3] ${payload.title}`,
          text: `Hi ${user.firstName},\n\n${payload.body}\n\nOpen: ${link}`,
          html: `<p>Hi ${user.firstName},</p><p>${payload.body.replace(/\n/g, '<br>')}</p><p><a href="${link}">Open in Propa3</a></p>`,
        });
      } catch (err) {
        this.logger.warn(`Email to ${user.email} failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  async notifyUser(userId: string, payload: NotifyPayload) {
    const row = await this.prisma.notification.create({
      data: { userId, ...payload },
    });
    void this.sendEmails([userId], payload);
    return row;
  }

  async notifyUsers(userIds: string[], payload: NotifyPayload) {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (!unique.length) return [];
    const result = await this.prisma.notification.createMany({
      data: unique.map((userId) => ({ userId, ...payload })),
    });
    void this.sendEmails(unique, payload);
    return result;
  }

  async findForUser(userId: string, limit = 30) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /** PMs for a site + CEO */
  async siteManagerIds(siteId: string): Promise<string[]> {
    const [pms, ceo] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          role: UserRole.PROJECT_MANAGER,
          OR: [
            { primarySiteId: siteId },
            { siteAssignments: { some: { siteId } } },
          ],
        },
        select: { id: true },
      }),
      this.prisma.user.findMany({
        where: { role: UserRole.CEO },
        select: { id: true },
      }),
    ]);
    return [...pms, ...ceo].map((u) => u.id);
  }

  async projectManagerId(projectId: string): Promise<string | null> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { projectManagerId: true },
    });
    return project?.projectManagerId ?? null;
  }

  async foremenForSite(siteId: string): Promise<string[]> {
    const foremen = await this.prisma.user.findMany({
      where: {
        role: UserRole.FOREMAN,
        OR: [
          { primarySiteId: siteId },
          { siteAssignments: { some: { siteId } } },
        ],
      },
      select: { id: true },
    });
    return foremen.map((f) => f.id);
  }

  async storeManagersForSite(siteId: string): Promise<string[]> {
    const stores = await this.prisma.user.findMany({
      where: {
        role: UserRole.STORE_MANAGER,
        OR: [
          { primarySiteId: siteId },
          { siteAssignments: { some: { siteId } } },
        ],
      },
      select: { id: true },
    });
    return stores.map((s) => s.id);
  }

  async salesUserIds(): Promise<string[]> {
    const sales = await this.prisma.user.findMany({
      where: { role: UserRole.SALES, isActive: true },
      select: { id: true },
    });
    return sales.map((s) => s.id);
  }

  async ceoUserIds(): Promise<string[]> {
    const ceos = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.CEO, UserRole.ADMIN] }, isActive: true },
      select: { id: true },
    });
    return ceos.map((c) => c.id);
  }

  async financeUserIds(): Promise<string[]> {
    const finance = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.FINANCE, UserRole.CEO, UserRole.ADMIN] },
        isActive: true,
      },
      select: { id: true },
    });
    return finance.map((f) => f.id);
  }

  async pmUserIds(): Promise<string[]> {
    const pms = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.PROJECT_MANAGER, UserRole.CEO, UserRole.ADMIN] },
        isActive: true,
      },
      select: { id: true },
    });
    return pms.map((p) => p.id);
  }
}
