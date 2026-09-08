import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InspectionResult, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateInspectionDto, UpdateInspectionDto } from './dto/inspection.dto';

export const INSPECTION_CATEGORIES = [
  'Foundation',
  'Structural frame',
  'Blockwork / masonry',
  'Roofing',
  'Electrical first fix',
  'Plumbing first fix',
  'Plastering',
  'Tiling',
  'Joinery / carpentry',
  'Painting',
  'External works',
  'HSE compliance',
  'Pre-pour concrete',
  'Waterproofing',
  'MEP second fix',
  'Finishes',
  'Snagging',
  'Fire safety',
  'Quality closeout',
  'Other',
];

const include = {
  project: { select: { id: true, name: true, site: { select: { code: true } } } },
};

@Injectable()
export class InspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  meta() {
    return { categories: INSPECTION_CATEGORIES, results: Object.values(InspectionResult) };
  }

  findAll(user: AuthUser, projectId?: string) {
    this.assertCanView(user);
    return this.prisma.projectInspection.findMany({
      where: projectId ? { projectId } : undefined,
      include,
      orderBy: { inspectedAt: 'desc' },
    });
  }

  async create(dto: CreateInspectionDto, user: AuthUser) {
    this.assertCanManage(user);
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Project not found');
    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    return this.prisma.projectInspection.create({
      data: {
        number: `INS-${year}-${stamp}`,
        projectId: dto.projectId,
        category: dto.category,
        phase: dto.phase,
        inspectedAt: new Date(dto.inspectedAt),
        inspectedBy: dto.inspectedBy ?? `${user.firstName} ${user.lastName}`,
        result: dto.result ?? InspectionResult.PENDING,
        notes: dto.notes,
      },
      include,
    });
  }

  async update(id: string, dto: UpdateInspectionDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.prisma.projectInspection.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Inspection not found');
    return this.prisma.projectInspection.update({
      where: { id },
      data: { result: dto.result, notes: dto.notes },
      include,
    });
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FOREMAN,
      UserRole.ENGINEER,
      UserRole.ARCHITECT,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }

  private assertCanManage(user: AuthUser) {
    this.assertCanView(user);
  }
}
