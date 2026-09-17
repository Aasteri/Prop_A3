import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, PlanningCycleKind, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreatePlanningCycleDto,
  UpdatePlanningCycleDto,
} from './dto/planning-cycle.dto';
import {
  defaultChecklistFor,
  PLANNING_CYCLE_TEMPLATES,
} from './planning-cycle.templates';

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

const KIND_PREFIX: Record<PlanningCycleKind, string> = {
  DAILY: 'PLN-D',
  WEEKLY: 'PLN-W',
  MONTHLY: 'PLN-M',
};

@Injectable()
export class PlanningCyclesService {
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
    if (!ok) throw new ForbiddenException('Not allowed to view planning cycles');
  }

  private assertCanManage(user: AuthUser) {
    const ok = (
      [UserRole.PROJECT_MANAGER, UserRole.CEO, UserRole.ADMIN] as UserRole[]
    ).includes(user.role);
    if (!ok) throw new ForbiddenException('Not allowed to manage planning cycles');
  }

  getTemplates(user: AuthUser) {
    this.assertCanView(user);
    return Object.values(PLANNING_CYCLE_TEMPLATES);
  }

  findAll(user: AuthUser, projectId?: string, kind?: PlanningCycleKind) {
    this.assertCanView(user);
    return this.prisma.planningCycle.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(kind ? { kind } : {}),
      },
      include,
      orderBy: { periodStart: 'desc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.planningCycle.findUnique({
      where: { id },
      include,
    });
    if (!row) throw new NotFoundException('Planning cycle not found');
    return row;
  }

  async create(dto: CreatePlanningCycleDto, user: AuthUser) {
    this.assertCanManage(user);
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    const checklist = dto.checklist?.length
      ? dto.checklist.map((c) => ({
          item: c.item,
          done: c.done ?? false,
          notes: c.notes ?? '',
        }))
      : defaultChecklistFor(dto.kind);

    return this.prisma.planningCycle.create({
      data: {
        number: `${KIND_PREFIX[dto.kind]}-${year}-${stamp}`,
        projectId: dto.projectId,
        kind: dto.kind,
        periodStart: new Date(dto.periodStart),
        periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : null,
        checklistJson: checklist as unknown as Prisma.InputJsonValue,
        targets: dto.targets,
        resourcesNote: dto.resourcesNote,
        risksNote: dto.risksNote,
        lookaheadNote: dto.lookaheadNote,
        cashflowNote: dto.cashflowNote,
        preparedBy: dto.preparedBy ?? `${user.firstName} ${user.lastName}`.trim(),
        status: 'DRAFT',
      },
      include,
    });
  }

  async update(id: string, dto: UpdatePlanningCycleDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status === 'COMPLETE') {
      throw new BadRequestException('Completed planning cycles cannot be edited');
    }
    return this.prisma.planningCycle.update({
      where: { id },
      data: {
        periodStart:
          dto.periodStart === undefined ? undefined : new Date(dto.periodStart),
        periodEnd:
          dto.periodEnd === undefined
            ? undefined
            : dto.periodEnd
              ? new Date(dto.periodEnd)
              : null,
        checklistJson:
          dto.checklist === undefined
            ? undefined
            : (dto.checklist.map((c) => ({
                item: c.item,
                done: c.done ?? false,
                notes: c.notes ?? '',
              })) as unknown as Prisma.InputJsonValue),
        targets: dto.targets,
        resourcesNote: dto.resourcesNote,
        risksNote: dto.risksNote,
        lookaheadNote: dto.lookaheadNote,
        cashflowNote: dto.cashflowNote,
        preparedBy: dto.preparedBy,
      },
      include,
    });
  }

  async complete(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Only draft planning cycles can be completed');
    }

    const updated = await this.prisma.planningCycle.update({
      where: { id },
      data: {
        status: 'COMPLETE',
        completedAt: new Date(),
      },
      include,
    });

    const recipients = [
      ...(await this.notifications.ceoUserIds()),
      ...(await this.notifications.pmUserIds()),
    ].filter((uid) => uid !== user.id);
    if (recipients.length) {
      await this.notifications.notifyUsers(recipients, {
        type: NotificationType.PLANNING_CYCLE,
        title: `${updated.kind} planning complete — ${updated.number}`,
        body: `${updated.project.name} · ${updated.periodStart.toLocaleDateString('en-NG')}`,
        linkUrl: '/planning-cycles',
      });
    }
    return this.findOne(id, user);
  }
}
