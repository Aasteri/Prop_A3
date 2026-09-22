import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FeasibilityDecision, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class FeasibilityService {
  constructor(private readonly prisma: PrismaService) {}

  private assertStaff(user: AuthUser) {
    if (
      user.role === UserRole.CLIENT ||
      user.role === UserRole.ARTISAN ||
      user.role === UserRole.MARKETPLACE_SEEKER
    ) {
      throw new ForbiddenException('Staff only');
    }
  }

  private assertManage(user: AuthUser) {
    if (
      user.role !== UserRole.PROJECT_MANAGER &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only PM, CEO, or Admin');
    }
  }

  private projectWhere(user: AuthUser) {
    return user.role === UserRole.CEO ||
      user.role === UserRole.ADMIN ||
      !user.siteIds.length
      ? {}
      : { siteId: { in: user.siteIds } };
  }

  async getBundle(projectId: string, user: AuthUser) {
    this.assertStaff(user);
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, ...this.projectWhere(user) },
      include: { site: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const [feasibility, stakeholders] = await Promise.all([
      this.prisma.projectFeasibility.findUnique({ where: { projectId } }),
      this.prisma.projectStakeholder.findMany({
        where: { projectId },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return { project, feasibility, stakeholders };
  }

  async upsertFeasibility(
    projectId: string,
    body: {
      budgetBand?: string;
      siteNotes?: string;
      clientNeed?: string;
      objectives?: string;
      constraints?: string;
      decision?: FeasibilityDecision;
      notes?: string;
    },
    user: AuthUser,
  ) {
    this.assertManage(user);
    await this.getBundle(projectId, user);

    const decision = body.decision;
    return this.prisma.projectFeasibility.upsert({
      where: { projectId },
      create: {
        projectId,
        budgetBand: body.budgetBand?.trim() || null,
        siteNotes: body.siteNotes?.trim() || null,
        clientNeed: body.clientNeed?.trim() || null,
        objectives: body.objectives?.trim() || null,
        constraints: body.constraints?.trim() || null,
        decision: decision ?? FeasibilityDecision.PENDING,
        notes: body.notes?.trim() || null,
        ...(decision && decision !== FeasibilityDecision.PENDING
          ? {
              decidedAt: new Date(),
              decidedBy: `${user.firstName} ${user.lastName}`,
            }
          : {}),
      },
      update: {
        budgetBand: body.budgetBand?.trim() || null,
        siteNotes: body.siteNotes?.trim() || null,
        clientNeed: body.clientNeed?.trim() || null,
        objectives: body.objectives?.trim() || null,
        constraints: body.constraints?.trim() || null,
        notes: body.notes?.trim() || null,
        ...(decision
          ? {
              decision,
              decidedAt:
                decision === FeasibilityDecision.PENDING ? null : new Date(),
              decidedBy:
                decision === FeasibilityDecision.PENDING
                  ? null
                  : `${user.firstName} ${user.lastName}`,
            }
          : {}),
      },
    });
  }

  async addStakeholder(
    projectId: string,
    body: {
      name: string;
      role?: string;
      organisation?: string;
      interest?: string;
      influence?: string;
      contact?: string;
      notes?: string;
    },
    user: AuthUser,
  ) {
    this.assertManage(user);
    await this.getBundle(projectId, user);
    const count = await this.prisma.projectStakeholder.count({ where: { projectId } });
    return this.prisma.projectStakeholder.create({
      data: {
        projectId,
        name: body.name.trim(),
        role: body.role?.trim() || null,
        organisation: body.organisation?.trim() || null,
        interest: body.interest?.trim() || null,
        influence: body.influence?.trim() || null,
        contact: body.contact?.trim() || null,
        notes: body.notes?.trim() || null,
        sortOrder: count,
      },
    });
  }

  async deleteStakeholder(id: string, user: AuthUser) {
    this.assertManage(user);
    const row = await this.prisma.projectStakeholder.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Stakeholder not found');
    await this.getBundle(row.projectId, user);
    await this.prisma.projectStakeholder.delete({ where: { id } });
    return { ok: true };
  }
}
