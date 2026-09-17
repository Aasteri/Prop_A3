import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateProgressReportDto,
  UpdateProgressReportDto,
} from './dto/progress-report.dto';

const include = {
  project: {
    select: {
      id: true,
      name: true,
      location: true,
      status: true,
      site: { select: { code: true, name: true } },
    },
  },
};

@Injectable()
export class ProgressReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private assertCanView(user: AuthUser) {
    const ok = (
      [
        UserRole.PROJECT_MANAGER,
        UserRole.CEO,
        UserRole.ADMIN,
        UserRole.FOREMAN,
        UserRole.FINANCE,
      ] as UserRole[]
    ).includes(user.role);
    if (!ok) throw new ForbiddenException('Not allowed to view progress reports');
  }

  private assertCanManage(user: AuthUser) {
    const ok = (
      [UserRole.PROJECT_MANAGER, UserRole.CEO, UserRole.ADMIN] as UserRole[]
    ).includes(user.role);
    if (!ok) throw new ForbiddenException('Not allowed to manage progress reports');
  }

  findAll(user: AuthUser, projectId?: string) {
    this.assertCanView(user);
    return this.prisma.progressReport.findMany({
      where: projectId ? { projectId } : undefined,
      include,
      orderBy: { reportDate: 'desc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.progressReport.findUnique({
      where: { id },
      include,
    });
    if (!row) throw new NotFoundException('Progress report not found');
    return row;
  }

  async create(dto: CreateProgressReportDto, user: AuthUser) {
    this.assertCanManage(user);
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    return this.prisma.progressReport.create({
      data: {
        number: `PRG-${year}-${stamp}`,
        projectId: dto.projectId,
        reportDate: new Date(dto.reportDate),
        preparedBy: dto.preparedBy ?? `${user.firstName} ${user.lastName}`.trim(),
        summary: dto.summary,
        teamJson: (dto.team ?? []) as unknown as Prisma.InputJsonValue,
        completedJson: (dto.completed ?? []) as unknown as Prisma.InputJsonValue,
        upcomingJson: (dto.upcoming ?? []) as unknown as Prisma.InputJsonValue,
        risksJson: (dto.risks ?? []) as unknown as Prisma.InputJsonValue,
        notes: dto.notes,
        status: 'DRAFT',
      },
      include,
    });
  }

  async update(id: string, dto: UpdateProgressReportDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status === 'PUBLISHED') {
      throw new BadRequestException('Published progress reports cannot be edited');
    }
    return this.prisma.progressReport.update({
      where: { id },
      data: {
        reportDate:
          dto.reportDate === undefined ? undefined : new Date(dto.reportDate),
        summary: dto.summary,
        preparedBy: dto.preparedBy,
        notes: dto.notes,
        teamJson:
          dto.team === undefined
            ? undefined
            : (dto.team as unknown as Prisma.InputJsonValue),
        completedJson:
          dto.completed === undefined
            ? undefined
            : (dto.completed as unknown as Prisma.InputJsonValue),
        upcomingJson:
          dto.upcoming === undefined
            ? undefined
            : (dto.upcoming as unknown as Prisma.InputJsonValue),
        risksJson:
          dto.risks === undefined
            ? undefined
            : (dto.risks as unknown as Prisma.InputJsonValue),
      },
      include,
    });
  }

  async publish(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Only draft progress reports can be published');
    }
    if (!existing.summary?.trim()) {
      throw new BadRequestException('Summary is required before publishing');
    }

    const updated = await this.prisma.progressReport.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      include,
    });

    const recipients = [
      ...(await this.notifications.ceoUserIds()),
      ...(await this.notifications.pmUserIds()),
    ].filter((uid) => uid !== user.id);
    if (recipients.length) {
      await this.notifications.notifyUsers(recipients, {
        type: NotificationType.PROGRESS_REPORT,
        title: `Progress report published — ${updated.number}`,
        body: `${updated.project.name} · ${updated.reportDate.toLocaleDateString('en-NG')}`,
        linkUrl: '/progress-reports',
      });
    }
    return this.findOne(id, user);
  }

  async buildPdf(id: string, user: AuthUser) {
    const row = await this.findOne(id, user);
    const { buildProgressReportPdf } = await import('./progress-report.pdf');
    return buildProgressReportPdf({
      number: row.number,
      projectName: row.project.name,
      reportDate: row.reportDate,
      preparedBy: row.preparedBy,
      summary: row.summary,
      team: (row.teamJson as { role: string; name: string }[]) ?? [],
      completed:
        (row.completedJson as {
          description: string;
          date?: string;
          status?: string;
          owner?: string;
          comments?: string;
        }[]) ?? [],
      upcoming:
        (row.upcomingJson as {
          description: string;
          date?: string;
          status?: string;
          owner?: string;
          comments?: string;
        }[]) ?? [],
      risks:
        (row.risksJson as {
          issue: string;
          impact?: string;
          action?: string;
          owner?: string;
        }[]) ?? [],
      status: row.status,
      notes: row.notes,
    });
  }
}
