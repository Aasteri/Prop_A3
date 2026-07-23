import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChangeLogStatus, DailyLogStatus, PaymentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { DocumentsService } from '../documents/documents.service';

@Injectable()
export class ClientPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
  ) {}

  async dashboard(user: AuthUser) {
    const client = await this.requireClient(user);
    const assignments = await this.prisma.clientProject.findMany({
      where: { clientId: client.id },
      include: {
        project: {
          include: {
            site: true,
            projectManager: {
              select: { firstName: true, lastName: true, email: true, phone: true },
            },
            milestones: { orderBy: { stage: 'asc' } },
          },
        },
      },
    });

    const invoices = await this.prisma.invoice.findMany({
      where: { clientId: client.id },
      orderBy: [{ issueDate: 'desc' }],
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        issueDate: true,
        outstanding: true,
        revisedTotal: true,
        paidTotal: true,
      },
    });

    const nextPayment = invoices.find((i) => Number(i.outstanding) > 0);

    return {
      client: {
        id: client.id,
        clientRef: client.clientRef,
        firstName: client.firstName,
        lastName: client.lastName,
      },
      projects: assignments.map((a) => ({
        id: a.project.id,
        name: a.project.name,
        location: a.project.location,
        plotRef: a.plotRef,
        site: a.project.site,
        projectManager: a.project.projectManager,
        milestones: a.project.milestones.map((m) => ({
          stage: m.stage,
          progressPct: Number(m.progressPct),
        })),
      })),
      nextPayment: nextPayment
        ? {
            invoiceId: nextPayment.id,
            invoiceNumber: nextPayment.invoiceNumber,
            outstanding: Number(nextPayment.outstanding),
            dueDate: nextPayment.issueDate,
          }
        : null,
      invoiceSummary: {
        total: invoices.length,
        outstanding: invoices.reduce((s, i) => s + Number(i.outstanding), 0),
      },
    };
  }

  async projectProgress(projectId: string, user: AuthUser) {
    const client = await this.requireClient(user);
    await this.requireProjectAccess(client.id, projectId);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        milestones: { orderBy: { stage: 'asc' } },
        projectManager: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
      },
    });
    if (!project) throw new NotFoundException('Project not found');

    const logs = await this.prisma.dailySiteLog.findMany({
      where: { projectId, status: DailyLogStatus.APPROVED },
      orderBy: [{ date: 'desc' }],
      take: 20,
      select: {
        id: true,
        refCode: true,
        date: true,
        projectLocation: true,
        activities: {
          select: {
            activity: true,
            status: true,
            progressPercent: true,
          },
        },
        photos: {
          select: { id: true, url: true, caption: true, section: true },
          take: 12,
        },
      },
    });

    return {
      project: {
        id: project.id,
        name: project.name,
        location: project.location,
        projectManager: project.projectManager,
        milestones: project.milestones.map((m) => ({
          stage: m.stage,
          progressPct: Number(m.progressPct),
        })),
      },
      logs: logs.map((log) => ({
        id: log.id,
        refCode: log.refCode,
        date: log.date,
        location: log.projectLocation,
        activities: log.activities,
        photos: log.photos,
      })),
    };
  }

  async invoices(user: AuthUser) {
    const client = await this.requireClient(user);
    return this.prisma.invoice.findMany({
      where: { clientId: client.id },
      include: {
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            receiptNumber: true,
            verifiedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ issueDate: 'desc' }],
    }).then((rows) =>
      rows.map((i) => ({
        ...i,
        baseTotal: Number(i.baseTotal),
        revisedTotal: Number(i.revisedTotal),
        paidTotal: Number(i.paidTotal),
        outstanding: Number(i.outstanding),
        payments: i.payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
      })),
    );
  }

  async changeOrders(user: AuthUser) {
    const client = await this.requireClient(user);
    const projectIds = (
      await this.prisma.clientProject.findMany({
        where: { clientId: client.id },
        select: { projectId: true },
      })
    ).map((p) => p.projectId);

    return this.prisma.projectChangeLog.findMany({
      where: {
        projectId: { in: projectIds },
        status: ChangeLogStatus.APPROVED,
      },
      include: {
        project: { select: { name: true } },
      },
      orderBy: [{ approvedAt: 'desc' }],
    });
  }

  documents(user: AuthUser) {
    return this.documentsService.clientDocuments(user);
  }

  private async requireClient(user: AuthUser) {
    if (user.role !== UserRole.CLIENT && user.role !== UserRole.CEO && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Client portal access only');
    }

    const client =
      user.role === UserRole.CLIENT
        ? await this.prisma.client.findUnique({ where: { portalUserId: user.id } })
        : await this.prisma.client.findFirst({ orderBy: { createdAt: 'asc' } });

    if (!client) throw new ForbiddenException('No client profile linked to this account');
    return client;
  }

  private async requireProjectAccess(clientId: string, projectId: string) {
    const link = await this.prisma.clientProject.findUnique({
      where: { clientId_projectId: { clientId, projectId } },
    });
    if (!link) throw new ForbiddenException('Project not assigned to your account');
  }
}
