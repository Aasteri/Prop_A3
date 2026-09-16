import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, ProjectCloseoutStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AcknowledgeCloseoutDto,
  CloseoutZoneDto,
  CreateCloseoutDto,
  UpdateCloseoutDto,
} from './dto/closeout.dto';

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

const DEFAULT_ZONES: CloseoutZoneDto[] = [
  { zone: 'Basement', items: [] },
  { zone: 'Ground Floor', items: [] },
  { zone: 'First Floor', items: [] },
  { zone: 'Pent Floor', items: [] },
  { zone: 'Additional Facilities', items: [] },
];

@Injectable()
export class CloseoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll(user: AuthUser, projectId?: string) {
    this.assertCanView(user);
    return this.prisma.projectCloseout.findMany({
      where: projectId ? { projectId } : undefined,
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.projectCloseout.findUnique({ where: { id }, include });
    if (!row) throw new NotFoundException('Closeout report not found');
    return row;
  }

  templateZones() {
    return DEFAULT_ZONES;
  }

  async create(dto: CreateCloseoutDto, user: AuthUser) {
    this.assertCanManage(user);
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    const zones = dto.accomplishments?.length ? dto.accomplishments : DEFAULT_ZONES;

    return this.prisma.projectCloseout.create({
      data: {
        number: `CLO-${year}-${stamp}`,
        projectId: dto.projectId,
        developerName: dto.developerName,
        clientName: dto.clientName,
        durationStart: dto.durationStart ? new Date(dto.durationStart) : undefined,
        durationEnd: dto.durationEnd ? new Date(dto.durationEnd) : undefined,
        executiveSummary: dto.executiveSummary,
        accomplishmentsJson: zones as never,
        openItems: dto.openItems,
        overBudget: dto.overBudget ?? false,
        onSchedule: dto.onSchedule ?? true,
        preparedBy: dto.preparedBy ?? `${user.firstName} ${user.lastName}`.trim(),
        notes: dto.notes,
        status: ProjectCloseoutStatus.DRAFT,
      },
      include,
    });
  }

  async update(id: string, dto: UpdateCloseoutDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== ProjectCloseoutStatus.DRAFT) {
      throw new BadRequestException('Only draft closeouts can be edited');
    }
    return this.prisma.projectCloseout.update({
      where: { id },
      data: {
        developerName: dto.developerName,
        clientName: dto.clientName,
        durationStart: dto.durationStart ? new Date(dto.durationStart) : undefined,
        durationEnd: dto.durationEnd ? new Date(dto.durationEnd) : undefined,
        executiveSummary: dto.executiveSummary,
        accomplishmentsJson: dto.accomplishments
          ? (dto.accomplishments as never)
          : undefined,
        openItems: dto.openItems,
        overBudget: dto.overBudget,
        onSchedule: dto.onSchedule,
        preparedBy: dto.preparedBy,
        notes: dto.notes,
      },
      include,
    });
  }

  async issue(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== ProjectCloseoutStatus.DRAFT) {
      throw new BadRequestException('Only draft closeouts can be issued');
    }
    if (!existing.executiveSummary?.trim()) {
      throw new BadRequestException('Executive summary is required before issue');
    }

    const updated = await this.prisma.projectCloseout.update({
      where: { id },
      data: {
        status: ProjectCloseoutStatus.ISSUED,
        issuedAt: new Date(),
      },
      include,
    });

    const recipients = [
      ...(await this.notifications.ceoUserIds()),
      ...(await this.notifications.pmUserIds()),
    ].filter((uid) => uid !== user.id);
    if (recipients.length) {
      await this.notifications.notifyUsers(recipients, {
        type: NotificationType.PROJECT_CLOSEOUT,
        title: `Closeout issued — ${updated.number}`,
        body: `${updated.project.name} · client ${updated.clientName}`,
        linkUrl: '/closeouts',
      });
    }

    return updated;
  }

  async acknowledge(id: string, dto: AcknowledgeCloseoutDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (existing.status !== ProjectCloseoutStatus.ISSUED) {
      throw new BadRequestException('Only issued closeouts can be acknowledged');
    }

    const updated = await this.prisma.projectCloseout.update({
      where: { id },
      data: {
        status: ProjectCloseoutStatus.ACKNOWLEDGED,
        clientAcknowledgedAt: new Date(),
        clientAcknowledgedBy:
          dto.clientAcknowledgedBy ?? existing.clientName,
      },
      include,
    });

    // Mark project complete when client acknowledges closeout
    if (updated.project.status !== 'COMPLETE') {
      await this.prisma.project.update({
        where: { id: updated.projectId },
        data: { status: 'COMPLETE' },
      });
    }

    const recipients = (await this.notifications.ceoUserIds()).filter((uid) => uid !== user.id);
    if (recipients.length) {
      await this.notifications.notifyUsers(recipients, {
        type: NotificationType.PROJECT_CLOSEOUT,
        title: `Closeout acknowledged — ${updated.number}`,
        body: `${updated.project.name} · ${updated.clientAcknowledgedBy}`,
        linkUrl: '/closeouts',
      });
    }

    return this.findOne(id, user);
  }

  async buildPdf(id: string, user: AuthUser) {
    const row = await this.findOne(id, user);
    const { buildCloseoutPdf } = await import('./closeout.pdf');
    return buildCloseoutPdf({
      number: row.number,
      projectName: row.project.name,
      projectLocation: row.project.location,
      developerName: row.developerName,
      clientName: row.clientName,
      durationStart: row.durationStart,
      durationEnd: row.durationEnd,
      executiveSummary: row.executiveSummary,
      accomplishments: (row.accomplishmentsJson as { zone: string; items: string[] }[]) ?? [],
      openItems: row.openItems,
      overBudget: row.overBudget,
      onSchedule: row.onSchedule,
      preparedBy: row.preparedBy,
      status: row.status,
      issuedAt: row.issuedAt,
      clientAcknowledgedAt: row.clientAcknowledgedAt,
      clientAcknowledgedBy: row.clientAcknowledgedBy,
      createdAt: row.createdAt,
    });
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.CEO,
      UserRole.ADMIN,
      UserRole.FINANCE,
      UserRole.SALES,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }

  private assertCanManage(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }
}
