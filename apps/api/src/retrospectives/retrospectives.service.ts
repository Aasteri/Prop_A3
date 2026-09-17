import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  Prisma,
  ProjectStatus,
  RetrospectiveStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ClientFeedbackDto,
  CreateRetrospectiveDto,
  UpdateRetrospectiveDto,
} from './dto/retrospective.dto';

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
export class RetrospectivesService {
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
        UserRole.FINANCE,
        UserRole.SALES,
      ] as UserRole[]
    ).includes(user.role);
    if (!ok) throw new ForbiddenException('Not allowed to view retrospectives');
  }

  private assertCanManage(user: AuthUser) {
    const ok = (
      [UserRole.PROJECT_MANAGER, UserRole.CEO, UserRole.ADMIN] as UserRole[]
    ).includes(user.role);
    if (!ok) throw new ForbiddenException('Not allowed to manage retrospectives');
  }

  findAll(user: AuthUser, projectId?: string) {
    this.assertCanView(user);
    return this.prisma.projectRetrospective.findMany({
      where: projectId ? { projectId } : undefined,
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.projectRetrospective.findUnique({
      where: { id },
      include,
    });
    if (!row) throw new NotFoundException('Retrospective not found');
    return row;
  }

  async create(dto: CreateRetrospectiveDto, user: AuthUser) {
    this.assertCanManage(user);
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    return this.prisma.projectRetrospective.create({
      data: {
        number: `RET-${year}-${stamp}`,
        projectId: dto.projectId,
        heldAt: dto.heldAt ? new Date(dto.heldAt) : undefined,
        ownerName: dto.ownerName ?? `${user.firstName} ${user.lastName}`.trim(),
        collaborators: dto.collaborators,
        projectSummary: dto.projectSummary,
        projectStatusNote: dto.projectStatusNote,
        goalsObjectives: dto.goalsObjectives,
        durationNote: dto.durationNote,
        teamNote: dto.teamNote,
        docsLink: dto.docsLink,
        methodology: dto.methodology,
        resources: dto.resources,
        wentWellJson: (dto.wentWell ?? []) as unknown as Prisma.InputJsonValue,
        improvementsJson: (dto.improvements ?? []) as unknown as Prisma.InputJsonValue,
        luckyJson: (dto.lucky ?? []) as unknown as Prisma.InputJsonValue,
        actionsJson: (dto.actions ?? []) as unknown as Prisma.InputJsonValue,
        nextSteps: dto.nextSteps,
        timelineJson: (dto.timeline ?? []) as unknown as Prisma.InputJsonValue,
        clientTestimonial: dto.clientTestimonial,
        preparedBy: dto.preparedBy ?? `${user.firstName} ${user.lastName}`.trim(),
        notes: dto.notes,
        status: RetrospectiveStatus.DRAFT,
      },
      include,
    });
  }

  async update(id: string, dto: UpdateRetrospectiveDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status === RetrospectiveStatus.PUBLISHED) {
      throw new BadRequestException('Published retrospectives cannot be edited');
    }
    return this.prisma.projectRetrospective.update({
      where: { id },
      data: {
        heldAt: dto.heldAt === undefined ? undefined : dto.heldAt ? new Date(dto.heldAt) : null,
        ownerName: dto.ownerName,
        collaborators: dto.collaborators,
        projectSummary: dto.projectSummary,
        projectStatusNote: dto.projectStatusNote,
        goalsObjectives: dto.goalsObjectives,
        durationNote: dto.durationNote,
        teamNote: dto.teamNote,
        docsLink: dto.docsLink,
        methodology: dto.methodology,
        resources: dto.resources,
        wentWellJson:
          dto.wentWell === undefined
            ? undefined
            : (dto.wentWell as unknown as Prisma.InputJsonValue),
        improvementsJson:
          dto.improvements === undefined
            ? undefined
            : (dto.improvements as unknown as Prisma.InputJsonValue),
        luckyJson:
          dto.lucky === undefined ? undefined : (dto.lucky as unknown as Prisma.InputJsonValue),
        actionsJson:
          dto.actions === undefined
            ? undefined
            : (dto.actions as unknown as Prisma.InputJsonValue),
        nextSteps: dto.nextSteps,
        timelineJson:
          dto.timeline === undefined
            ? undefined
            : (dto.timeline as unknown as Prisma.InputJsonValue),
        clientTestimonial: dto.clientTestimonial,
        preparedBy: dto.preparedBy,
        notes: dto.notes,
      },
      include,
    });
  }

  async publish(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== RetrospectiveStatus.DRAFT) {
      throw new BadRequestException('Only draft retrospectives can be published');
    }
    const wentWell = (existing.wentWellJson as string[]) ?? [];
    const improvements = (existing.improvementsJson as string[]) ?? [];
    if (!wentWell.length && !improvements.length) {
      throw new BadRequestException(
        'Add at least one “went well” or “improvement” lesson before publishing (US-CLOSE-07)',
      );
    }

    const updated = await this.prisma.projectRetrospective.update({
      where: { id },
      data: {
        status: RetrospectiveStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include,
    });

    if (
      updated.project.status === ProjectStatus.ACTIVE ||
      updated.project.status === ProjectStatus.ON_HOLD
    ) {
      await this.prisma.project.update({
        where: { id: updated.projectId },
        data: { status: ProjectStatus.COMPLETE },
      });
    }

    const recipients = [
      ...(await this.notifications.ceoUserIds()),
      ...(await this.notifications.pmUserIds()),
    ].filter((uid) => uid !== user.id);
    if (recipients.length) {
      await this.notifications.notifyUsers(recipients, {
        type: NotificationType.PROJECT_RETROSPECTIVE,
        title: `Retrospective published — ${updated.number}`,
        body: `${updated.project.name} · lessons archived`,
        linkUrl: '/retrospectives',
      });
    }
    return this.findOne(id, user);
  }

  async addClientFeedback(id: string, dto: ClientFeedbackDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.findOne(id, user);
    return this.prisma.projectRetrospective.update({
      where: { id },
      data: {
        clientTestimonial: dto.testimonial,
        clientFeedbackAt: new Date(),
        clientFeedbackBy: dto.feedbackBy ?? `${user.firstName} ${user.lastName}`.trim(),
      },
      include,
    });
  }

  async buildPdf(id: string, user: AuthUser) {
    const row = await this.findOne(id, user);
    const { buildRetrospectivePdf } = await import('./retrospective.pdf');
    return buildRetrospectivePdf({
      number: row.number,
      projectName: row.project.name,
      heldAt: row.heldAt,
      ownerName: row.ownerName,
      collaborators: row.collaborators,
      projectSummary: row.projectSummary,
      projectStatusNote: row.projectStatusNote,
      goalsObjectives: row.goalsObjectives,
      durationNote: row.durationNote,
      teamNote: row.teamNote,
      docsLink: row.docsLink,
      methodology: row.methodology,
      resources: row.resources,
      wentWell: (row.wentWellJson as string[]) ?? [],
      improvements: (row.improvementsJson as string[]) ?? [],
      lucky: (row.luckyJson as string[]) ?? [],
      actions:
        (row.actionsJson as {
          action: string;
          type?: string;
          owner?: string;
          links?: string;
        }[]) ?? [],
      nextSteps: row.nextSteps,
      timeline:
        (row.timelineJson as { dateAchieved: string; milestone: string }[]) ?? [],
      clientTestimonial: row.clientTestimonial,
      clientFeedbackBy: row.clientFeedbackBy,
      status: row.status,
      preparedBy: row.preparedBy,
      publishedAt: row.publishedAt,
      createdAt: row.createdAt,
    });
  }
}
