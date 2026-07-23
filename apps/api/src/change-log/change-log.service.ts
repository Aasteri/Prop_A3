import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChangeImpactLevel,
  ChangeLogStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateChangeLogDto,
  RejectChangeLogDto,
  UpdateChangeLogDto,
} from './dto/change-log.dto';
import { canAccessSite, generateChangeId } from './change-log.utils';

const include = {
  project: { include: { site: true } },
  site: true,
  originator: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  revisedBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  approvedBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
};

@Injectable()
export class ChangeLogService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser, projectId?: string) {
    const allSites =
      user.role === UserRole.CEO ||
      user.role === UserRole.ADMIN ||
      !user.siteIds.length;

    return this.prisma.projectChangeLog.findMany({
      where: {
        ...(allSites ? {} : { siteId: { in: user.siteIds } }),
        ...(projectId ? { projectId } : {}),
      },
      include,
      orderBy: [{ revisionDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, user: AuthUser) {
    const entry = await this.prisma.projectChangeLog.findUnique({
      where: { id },
      include,
    });
    if (!entry) throw new NotFoundException('Change log entry not found');
    if (!canAccessSite(user.siteIds, entry.siteId, user.role)) {
      throw new ForbiddenException();
    }
    return entry;
  }

  async create(dto: CreateChangeLogDto, user: AuthUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      include: { site: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (!canAccessSite(user.siteIds, project.siteId, user.role)) {
      throw new ForbiddenException();
    }

    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    const defaultOriginator = dbUser
      ? `${dbUser.firstName} ${dbUser.lastName}`
      : user.email;

    return this.prisma.$transaction(async (tx) => {
      const changeId = await generateChangeId(tx, project.site.code);
      return tx.projectChangeLog.create({
        data: {
          projectId: project.id,
          siteId: project.siteId,
          changeId,
          revisionDate: new Date(dto.revisionDate),
          originatorId: user.id,
          originatorName: dto.originatorName?.trim() || defaultOriginator,
          description: dto.description,
          justification: dto.justification,
          impactLevel: dto.impactLevel,
        },
        include,
      });
    });
  }

  async update(id: string, dto: UpdateChangeLogDto, user: AuthUser) {
    const existing = await this.getEditable(id, user);

    if (dto.projectId && dto.projectId !== existing.projectId) {
      throw new BadRequestException('Cannot change project on existing entry');
    }

    return this.prisma.projectChangeLog.update({
      where: { id },
      data: {
        revisionDate: new Date(dto.revisionDate),
        description: dto.description,
        justification: dto.justification,
        impactLevel: dto.impactLevel,
        ...(dto.originatorName ? { originatorName: dto.originatorName } : {}),
      },
      include,
    });
  }

  async submitForReview(id: string, user: AuthUser) {
    const existing = await this.getEditable(id, user);

    return this.prisma.projectChangeLog.update({
      where: { id },
      data: {
        status: ChangeLogStatus.IN_REVIEW,
        revisedById: user.id,
      },
      include,
    });
  }

  async approve(id: string, user: AuthUser) {
    if (
      user.role !== UserRole.PROJECT_MANAGER &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only PM or CEO can approve changes');
    }

    const entry = await this.prisma.projectChangeLog.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Change log entry not found');
    if (!canAccessSite(user.siteIds, entry.siteId, user.role)) {
      throw new ForbiddenException();
    }
    if (entry.status !== ChangeLogStatus.IN_REVIEW) {
      throw new BadRequestException('Only in-review entries can be approved');
    }

    if (
      entry.impactLevel === ChangeImpactLevel.HIGH &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('High impact changes require CEO approval');
    }

    return this.prisma.projectChangeLog.update({
      where: { id },
      data: {
        status: ChangeLogStatus.APPROVED,
        approvedById: user.id,
        approvedAt: new Date(),
      },
      include,
    });
  }

  async reject(id: string, dto: RejectChangeLogDto, user: AuthUser) {
    if (
      user.role !== UserRole.PROJECT_MANAGER &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only PM or CEO can reject changes');
    }

    const entry = await this.prisma.projectChangeLog.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Change log entry not found');
    if (!canAccessSite(user.siteIds, entry.siteId, user.role)) {
      throw new ForbiddenException();
    }
    if (entry.status !== ChangeLogStatus.IN_REVIEW) {
      throw new BadRequestException('Only in-review entries can be rejected');
    }

    return this.prisma.projectChangeLog.update({
      where: { id },
      data: {
        status: ChangeLogStatus.REJECTED,
        rejectReason: dto.rejectReason,
        approvedById: user.id,
        approvedAt: new Date(),
      },
      include,
    });
  }

  async exportCsv(projectId: string, user: AuthUser): Promise<string> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { site: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (!canAccessSite(user.siteIds, project.siteId, user.role)) {
      throw new ForbiddenException();
    }

    const entries = await this.prisma.projectChangeLog.findMany({
      where: { projectId },
      include,
      orderBy: { changeId: 'asc' },
    });

    const title = `PROJECT CHANGE LOG FOR THE ${project.name.toUpperCase()}, ${(project.location ?? project.site.location ?? '').toUpperCase()}`;
    const headers = [
      'CHANGE ID',
      'DATE OF REVISION',
      'ORIGINATOR/REQUESTER',
      'CHANGE DESCRIPTION',
      'JUSTIFICATION',
      'REVISED BY',
      'STATUS (approved, in review, rejected)',
      'APPROVED BY',
      'IMPACT (Scope/Time/Cost)',
    ];

    const statusLabel = (s: ChangeLogStatus) => {
      if (s === ChangeLogStatus.IN_REVIEW) return 'in review';
      if (s === ChangeLogStatus.APPROVED) return 'approved';
      if (s === ChangeLogStatus.REJECTED) return 'rejected';
      return 'draft';
    };

    const impactLabel = (i: ChangeImpactLevel) => {
      if (i === ChangeImpactLevel.MEDIUM) return 'Med';
      if (i === ChangeImpactLevel.HIGH) return 'High';
      return 'Low';
    };

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;

    const rows = entries.map((e) =>
      [
        e.changeId,
        e.revisionDate.toISOString().slice(0, 10),
        e.originatorName,
        e.description,
        e.justification,
        e.revisedBy
          ? `${e.revisedBy.firstName} ${e.revisedBy.lastName}`
          : '',
        statusLabel(e.status),
        e.approvedBy
          ? `${e.approvedBy.firstName} ${e.approvedBy.lastName}`
          : '',
        impactLabel(e.impactLevel),
      ]
        .map(escape)
        .join(','),
    );

    return [escape(title), headers.map(escape).join(','), ...rows].join('\n');
  }

  private async getEditable(id: string, user: AuthUser) {
    const entry = await this.prisma.projectChangeLog.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Change log entry not found');
    if (!canAccessSite(user.siteIds, entry.siteId, user.role)) {
      throw new ForbiddenException();
    }
    if (
      entry.status !== ChangeLogStatus.DRAFT &&
      entry.status !== ChangeLogStatus.REJECTED
    ) {
      throw new BadRequestException('Entry cannot be edited in current status');
    }
    return entry;
  }
}
