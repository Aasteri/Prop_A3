import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MilestoneStage,
  Prisma,
  ProjectProcessGroup,
  ProjectStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { DocumentsService } from '../documents/documents.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

const MILESTONE_STAGES: MilestoneStage[] = [
  MilestoneStage.FOUNDATION,
  MilestoneStage.SHELL,
  MilestoneStage.FINISHING,
  MilestoneStage.HANDOVER,
];

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
  ) {}

  private assertCanManage(user: AuthUser) {
    if (
      user.role !== UserRole.PROJECT_MANAGER &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only PM, CEO, or Admin can manage projects');
    }
  }

  private siteFilter(user: AuthUser) {
    const allSites =
      user.role === UserRole.CEO ||
      user.role === UserRole.ADMIN ||
      !user.siteIds.length;
    return allSites ? {} : { siteId: { in: user.siteIds } };
  }

  findAll(user: AuthUser) {
    return this.prisma.project.findMany({
      where: this.siteFilter(user),
      include: {
        site: true,
        projectManager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        milestones: { orderBy: { stage: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string, user: AuthUser) {
    return this.prisma.project.findFirst({
      where: { id, ...this.siteFilter(user) },
      include: {
        site: true,
        projectManager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        milestones: { orderBy: { stage: 'asc' } },
      },
    });
  }

  async create(dto: CreateProjectDto, user: AuthUser) {
    this.assertCanManage(user);

    const site = await this.prisma.site.findUnique({ where: { id: dto.siteId } });
    if (!site) throw new BadRequestException('Site not found');

    if (user.siteIds.length && user.role !== UserRole.CEO && user.role !== UserRole.ADMIN) {
      if (!user.siteIds.includes(dto.siteId)) {
        throw new ForbiddenException('Not assigned to this site');
      }
    }

    if (dto.projectManagerId) {
      const pm = await this.prisma.user.findUnique({ where: { id: dto.projectManagerId } });
      if (!pm) throw new BadRequestException('Project manager not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          siteId: dto.siteId,
          name: dto.name.trim(),
          projectNumber: dto.projectNumber?.trim() || null,
          location: dto.location?.trim() || null,
          contractRef: dto.contractRef?.trim() || null,
          projectManagerId: dto.projectManagerId || user.id,
          budgetAmount:
            dto.budgetAmount != null && !Number.isNaN(dto.budgetAmount)
              ? new Prisma.Decimal(dto.budgetAmount)
              : null,
          status: dto.status ?? ProjectStatus.PLANNING,
          processGroup: dto.processGroup ?? ProjectProcessGroup.INITIATE,
        },
      });

      await tx.milestone.createMany({
        data: MILESTONE_STAGES.map((stage) => ({
          projectId: project.id,
          stage,
          progressPct: 0,
        })),
      });

      return tx.project.findUniqueOrThrow({
        where: { id: project.id },
        include: {
          site: true,
          projectManager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          milestones: { orderBy: { stage: 'asc' } },
        },
      });
    });
  }

  async update(id: string, dto: UpdateProjectDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.findOne(id, user);
    if (!existing) throw new NotFoundException('Project not found');

    if (dto.siteId) {
      const site = await this.prisma.site.findUnique({ where: { id: dto.siteId } });
      if (!site) throw new BadRequestException('Site not found');
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.siteId ? { siteId: dto.siteId } : {}),
        ...(dto.name != null ? { name: dto.name.trim() } : {}),
        ...(dto.projectNumber !== undefined
          ? { projectNumber: dto.projectNumber?.trim() || null }
          : {}),
        ...(dto.location !== undefined ? { location: dto.location?.trim() || null } : {}),
        ...(dto.contractRef !== undefined
          ? { contractRef: dto.contractRef?.trim() || null }
          : {}),
        ...(dto.projectManagerId !== undefined
          ? { projectManagerId: dto.projectManagerId || null }
          : {}),
        ...(dto.budgetAmount !== undefined
          ? {
              budgetAmount:
                dto.budgetAmount == null || Number.isNaN(dto.budgetAmount)
                  ? null
                  : new Prisma.Decimal(dto.budgetAmount),
            }
          : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.processGroup ? { processGroup: dto.processGroup } : {}),
      },
      include: {
        site: true,
        projectManager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        milestones: { orderBy: { stage: 'asc' } },
      },
    });
  }

  async setProcessGroup(id: string, processGroup: ProjectProcessGroup, user: AuthUser) {
    this.assertCanManage(user);

    const project = await this.findOne(id, user);
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.project.update({
      where: { id },
      data: { processGroup },
      include: {
        site: true,
        projectManager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        milestones: { orderBy: { stage: 'asc' } },
      },
    });
  }

  async uploadFcdaPermit(id: string, file: Express.Multer.File, user: AuthUser) {
    this.assertCanManage(user);

    const project = await this.findOne(id, user);
    if (!project) throw new NotFoundException('Project not found');

    return this.documents.uploadFcdaPermit(id, file, user);
  }
}
