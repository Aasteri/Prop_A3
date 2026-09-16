import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CharterStatus,
  KickoffStatus,
  NotificationType,
  Prisma,
  ProjectStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateCharterDto,
  CreateKickoffDto,
  SignCharterDto,
  UpdateCharterDto,
} from './dto/charter.dto';

const DEFAULT_AGENDA = [
  { item: 'Introduction', notes: '', remark: '' },
  { item: 'Background of the project: project designs and doc', notes: '', remark: '' },
  { item: 'Site condition', notes: '', remark: '' },
  { item: 'Setting out', notes: '', remark: '' },
  { item: 'Temp. store on site', notes: '', remark: '' },
  { item: 'Clearance and excavation work', notes: '', remark: '' },
  { item: 'Start date', notes: '', remark: '' },
  { item: 'Key milestone schedules', notes: '', remark: '' },
  { item: 'Completion date', notes: '', remark: '' },
  { item: 'Other Observation', notes: '', remark: '' },
];

const charterInclude = {
  project: { select: { id: true, name: true, location: true, status: true } },
};

const kickoffInclude = {
  project: { select: { id: true, name: true, location: true, status: true } },
};

@Injectable()
export class ChartersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  findCharters(user: AuthUser, projectId?: string) {
    this.assertCanView(user);
    return this.prisma.projectCharter.findMany({
      where: projectId ? { projectId } : undefined,
      include: charterInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCharter(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.projectCharter.findUnique({
      where: { id },
      include: charterInclude,
    });
    if (!row) throw new NotFoundException('Charter not found');
    return row;
  }

  async createCharter(dto: CreateCharterDto, user: AuthUser) {
    this.assertCanManage(user);
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Project not found');
    const existing = await this.prisma.projectCharter.findUnique({
      where: { projectId: dto.projectId },
    });
    if (existing) throw new BadRequestException('Project already has a charter');

    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    return this.prisma.projectCharter.create({
      data: {
        number: `CHR-${year}-${stamp}`,
        projectId: dto.projectId,
        title: dto.title,
        executiveSummary: dto.executiveSummary,
        goalsJson: dto.goals,
        deliverablesJson: dto.deliverables,
        businessCase: dto.businessCase,
        benefits: dto.benefits,
        costs: dto.costs,
        budgetRange: dto.budgetRange,
        timeline: dto.timeline,
        risksJson: dto.risks ?? [],
        scopeInJson: dto.scopeIn ?? [],
        scopeOutJson: dto.scopeOut ?? [],
        teamJson: dto.team ?? [],
        successCriteriaJson: dto.successCriteria ?? [],
        preparedBy: dto.preparedBy ?? `${user.firstName} ${user.lastName}`.trim(),
        notes: dto.notes,
        status: CharterStatus.DRAFT,
      },
      include: charterInclude,
    });
  }

  async updateCharter(id: string, dto: UpdateCharterDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findCharter(id, user);
    if (existing.status === CharterStatus.APPROVED) {
      throw new BadRequestException('Approved charters cannot be edited');
    }
    return this.prisma.projectCharter.update({
      where: { id },
      data: {
        title: dto.title,
        executiveSummary: dto.executiveSummary,
        goalsJson: dto.goals,
        deliverablesJson: dto.deliverables,
        businessCase: dto.businessCase,
        benefits: dto.benefits,
        costs: dto.costs,
        budgetRange: dto.budgetRange,
        timeline: dto.timeline,
        risksJson: dto.risks,
        scopeInJson: dto.scopeIn,
        scopeOutJson: dto.scopeOut,
        teamJson: dto.team,
        successCriteriaJson: dto.successCriteria,
        preparedBy: dto.preparedBy,
        notes: dto.notes,
      },
      include: charterInclude,
    });
  }

  async submitForReview(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findCharter(id, user);
    if (existing.status !== CharterStatus.DRAFT) {
      throw new BadRequestException('Only draft charters can be submitted for review');
    }
    const updated = await this.prisma.projectCharter.update({
      where: { id },
      data: { status: CharterStatus.IN_REVIEW },
      include: charterInclude,
    });
    const recipients = (await this.notifications.ceoUserIds()).filter((uid) => uid !== user.id);
    if (recipients.length) {
      await this.notifications.notifyUsers(recipients, {
        type: NotificationType.PROJECT_CHARTER,
        title: `Charter ready for review — ${updated.number}`,
        body: `${updated.project.name} · ${updated.title}`,
        linkUrl: '/charters',
      });
    }
    return updated;
  }

  async signCompany(id: string, dto: SignCharterDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findCharter(id, user);
    if (existing.status === CharterStatus.DRAFT) {
      throw new BadRequestException('Submit charter for review before company sign-off');
    }
    if (existing.companySignedAt) {
      throw new BadRequestException('Company already signed');
    }
    await this.prisma.projectCharter.update({
      where: { id },
      data: {
        companySignedAt: new Date(),
        companySignedBy: dto.signedBy ?? `${user.firstName} ${user.lastName}`.trim(),
        status: CharterStatus.IN_REVIEW,
      },
    });
    return this.finalizeIfDualSigned(id, user);
  }

  async signClient(id: string, dto: SignCharterDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findCharter(id, user);
    if (existing.status === CharterStatus.DRAFT) {
      throw new BadRequestException('Submit charter for review before client sign-off');
    }
    if (existing.clientSignedAt) {
      throw new BadRequestException('Client already signed');
    }
    await this.prisma.projectCharter.update({
      where: { id },
      data: {
        clientSignedAt: new Date(),
        clientSignedBy: dto.signedBy ?? existing.project.name,
        status: CharterStatus.IN_REVIEW,
      },
    });
    return this.finalizeIfDualSigned(id, user);
  }

  private async finalizeIfDualSigned(id: string, user: AuthUser) {
    const row = await this.findCharter(id, user);
    if (row.companySignedAt && row.clientSignedAt && row.status !== CharterStatus.APPROVED) {
      const approved = await this.prisma.projectCharter.update({
        where: { id },
        data: {
          status: CharterStatus.APPROVED,
          approvedAt: new Date(),
        },
        include: charterInclude,
      });
      if (approved.project.status === ProjectStatus.PLANNING) {
        await this.prisma.project.update({
          where: { id: approved.projectId },
          data: { status: ProjectStatus.ACTIVE },
        });
      }
      const recipients = [
        ...(await this.notifications.ceoUserIds()),
        ...(await this.notifications.pmUserIds()),
      ].filter((uid) => uid !== user.id);
      if (recipients.length) {
        await this.notifications.notifyUsers(recipients, {
          type: NotificationType.PROJECT_CHARTER,
          title: `Charter approved — ${approved.number}`,
          body: `${approved.project.name} · dual sign-off complete · kick-off may be published`,
          linkUrl: '/charters',
        });
      }
      return this.findCharter(id, user);
    }
    return row;
  }

  async buildCharterPdf(id: string, user: AuthUser) {
    const row = await this.findCharter(id, user);
    const { buildCharterPdf } = await import('./charter.pdf');
    return buildCharterPdf({
      number: row.number,
      title: row.title,
      projectName: row.project.name,
      executiveSummary: row.executiveSummary,
      goals: (row.goalsJson as string[]) ?? [],
      deliverables: (row.deliverablesJson as string[]) ?? [],
      businessCase: row.businessCase,
      benefits: row.benefits,
      costs: row.costs,
      budgetRange: row.budgetRange,
      timeline: row.timeline,
      risks: (row.risksJson as string[]) ?? [],
      scopeIn: (row.scopeInJson as string[]) ?? [],
      scopeOut: (row.scopeOutJson as string[]) ?? [],
      team: (row.teamJson as string[]) ?? [],
      successCriteria: (row.successCriteriaJson as string[]) ?? [],
      status: row.status,
      companySignedBy: row.companySignedBy,
      companySignedAt: row.companySignedAt,
      clientSignedBy: row.clientSignedBy,
      clientSignedAt: row.clientSignedAt,
      preparedBy: row.preparedBy,
      createdAt: row.createdAt,
    });
  }

  defaultAgenda() {
    return DEFAULT_AGENDA;
  }

  findKickoffs(user: AuthUser, projectId?: string) {
    this.assertCanView(user);
    return this.prisma.projectKickoff.findMany({
      where: projectId ? { projectId } : undefined,
      include: kickoffInclude,
      orderBy: { meetingAt: 'desc' },
    });
  }

  async findKickoff(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.projectKickoff.findUnique({
      where: { id },
      include: kickoffInclude,
    });
    if (!row) throw new NotFoundException('Kick-off meeting not found');
    return row;
  }

  async createKickoff(dto: CreateKickoffDto, user: AuthUser) {
    this.assertCanManage(user);
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    return this.prisma.projectKickoff.create({
      data: {
        number: `KOF-${year}-${stamp}`,
        projectId: dto.projectId,
        meetingAt: new Date(dto.meetingAt),
        location: dto.location,
        projectManagerName:
          dto.projectManagerName ?? `${user.firstName} ${user.lastName}`.trim(),
        preparedBy: dto.preparedBy ?? `${user.firstName} ${user.lastName}`.trim(),
        attendeesJson: (dto.attendees ?? []) as unknown as Prisma.InputJsonValue,
        agendaJson: (dto.agenda?.length
          ? dto.agenda
          : DEFAULT_AGENDA) as unknown as Prisma.InputJsonValue,
        actionsJson: (dto.actions ?? []) as unknown as Prisma.InputJsonValue,
        notes: dto.notes,
        status: KickoffStatus.DRAFT,
      },
      include: kickoffInclude,
    });
  }

  async publishKickoff(id: string, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findKickoff(id, user);
    if (existing.status !== KickoffStatus.DRAFT) {
      throw new BadRequestException('Only draft minutes can be published');
    }
    const charter = await this.prisma.projectCharter.findUnique({
      where: { projectId: existing.projectId },
    });
    if (!charter || charter.status !== CharterStatus.APPROVED) {
      throw new BadRequestException(
        'Charter must be dual-signed (APPROVED) before publishing kick-off minutes (US-INIT-12)',
      );
    }

    const updated = await this.prisma.projectKickoff.update({
      where: { id },
      data: { status: KickoffStatus.PUBLISHED, publishedAt: new Date() },
      include: kickoffInclude,
    });

    const recipients = (await this.notifications.pmUserIds()).filter((uid) => uid !== user.id);
    if (recipients.length) {
      await this.notifications.notifyUsers(recipients, {
        type: NotificationType.PROJECT_KICKOFF,
        title: `Kick-off published — ${updated.number}`,
        body: `${updated.project.name} · ${updated.meetingAt.toLocaleDateString('en-NG')}`,
        linkUrl: '/charters',
      });
    }
    return updated;
  }

  async buildKickoffPdf(id: string, user: AuthUser) {
    const row = await this.findKickoff(id, user);
    const { buildKickoffPdf } = await import('./charter.pdf');
    return buildKickoffPdf({
      number: row.number,
      projectName: row.project.name,
      meetingAt: row.meetingAt,
      location: row.location,
      projectManagerName: row.projectManagerName,
      preparedBy: row.preparedBy,
      attendees: (row.attendeesJson as { name: string; role?: string; email?: string; phone?: string }[]) ?? [],
      agenda: (row.agendaJson as { item: string; notes?: string; remark?: string }[]) ?? [],
      actions: (row.actionsJson as { action: string; actionedBy?: string; dueDate?: string }[]) ?? [],
      status: row.status,
    });
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.CEO,
      UserRole.ADMIN,
      UserRole.SALES,
      UserRole.FINANCE,
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
