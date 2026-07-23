import { Injectable } from '@nestjs/common';
import { NotificationType, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type NotifyPayload = {
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async notifyUser(userId: string, payload: NotifyPayload) {
    return this.prisma.notification.create({
      data: { userId, ...payload },
    });
  }

  async notifyUsers(userIds: string[], payload: NotifyPayload) {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (!unique.length) return [];
    return this.prisma.notification.createMany({
      data: unique.map((userId) => ({ userId, ...payload })),
    });
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
}
