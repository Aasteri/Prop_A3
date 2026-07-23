import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, AuditEntityType, MilestoneStage, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CertifyMilestoneDto, UpdateMilestoneProgressDto } from './dto/milestone.dto';
import { capMilestoneProgress, stageLabel } from './milestones.utils';

const include = {
  project: { include: { site: true } },
  certifiedBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
};

@Injectable()
export class MilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findByProject(projectId: string, user: AuthUser) {
    return this.getProjectWithAccess(projectId, user).then((project) =>
      this.prisma.milestone.findMany({
        where: { projectId: project.id },
        include,
        orderBy: { stage: 'asc' },
      }).then((milestones) => ({
        project: {
          id: project.id,
          name: project.name,
          fcdaPermitUrl: project.fcdaPermitUrl,
          site: project.site,
        },
        milestones: milestones.map((m) => ({
          ...m,
          progressPct: Number(m.progressPct),
          stageLabel: stageLabel(m.stage),
          fcdaGateActive:
            m.stage === MilestoneStage.FOUNDATION && !project.fcdaPermitUrl,
          canReach100:
            m.stage !== MilestoneStage.FOUNDATION || !!project.fcdaPermitUrl,
        })),
      })),
    );
  }

  async updateProgress(id: string, dto: UpdateMilestoneProgressDto, user: AuthUser) {
    if (
      user.role !== UserRole.PROJECT_MANAGER &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only PM can update milestone progress');
    }

    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');

    await this.getProjectWithAccess(milestone.projectId, user);

    if (milestone.certifiedAt) {
      throw new BadRequestException('Cannot edit a certified milestone');
    }

    const progressPct = capMilestoneProgress(
      milestone.stage,
      dto.progressPct,
      !!milestone.project.fcdaPermitUrl,
    );

    const updated = await this.prisma.milestone.update({
      where: { id },
      data: {
        progressPct,
        notes: dto.notes ?? milestone.notes,
        completedAt: progressPct >= 100 ? new Date() : null,
      },
      include,
    });

    await this.audit.log({
      entityType: AuditEntityType.MILESTONE,
      entityId: id,
      action: AuditAction.UPDATE,
      summary: `${milestone.stage} progress ${Number(milestone.progressPct)}% → ${progressPct}%`,
      actor: user,
      before: { progressPct: Number(milestone.progressPct), stage: milestone.stage },
      after: { progressPct, stage: milestone.stage },
      metadata: { projectId: milestone.projectId },
    });

    return updated;
  }

  async certify(id: string, dto: CertifyMilestoneDto, user: AuthUser) {
    if (
      user.role !== UserRole.ENGINEER &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only engineer can certify milestones');
    }

    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');

    await this.getProjectWithAccess(milestone.projectId, user);

    if (Number(milestone.progressPct) < 100) {
      throw new BadRequestException('Milestone must be at 100% before certification');
    }

    if (
      milestone.stage === MilestoneStage.FOUNDATION &&
      !milestone.project.fcdaPermitUrl
    ) {
      throw new BadRequestException(
        'FCDA permit must be uploaded before Foundation certification',
      );
    }

    if (milestone.certifiedAt) {
      throw new BadRequestException('Milestone already certified');
    }

    const updated = await this.prisma.milestone.update({
      where: { id },
      data: {
        certifiedById: user.id,
        certifiedAt: new Date(),
        completedAt: milestone.completedAt ?? new Date(),
        notes: dto.notes ?? milestone.notes,
      },
      include,
    });

    await this.audit.log({
      entityType: AuditEntityType.MILESTONE,
      entityId: id,
      action: AuditAction.CERTIFY,
      summary: `${milestone.stage} milestone certified at 100%`,
      actor: user,
      before: { certifiedAt: null, progressPct: Number(milestone.progressPct) },
      after: { certifiedAt: updated.certifiedAt, certifiedById: user.id },
      metadata: { projectId: milestone.projectId, stage: milestone.stage },
    });

    return updated;
  }

  private async getProjectWithAccess(projectId: string, user: AuthUser) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        ...((user.role === UserRole.CEO ||
          user.role === UserRole.ADMIN ||
          !user.siteIds.length)
          ? {}
          : { siteId: { in: user.siteIds } }),
      },
      include: { site: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
