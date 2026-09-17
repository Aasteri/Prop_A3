import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InspectionResult, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  ChecklistItemDto,
  CreateInspectionDto,
  UpdateInspectionDto,
} from './dto/inspection.dto';
import { DOC4_SECTIONS } from './doc4-sections';

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
    return {
      categories: INSPECTION_CATEGORIES,
      results: Object.values(InspectionResult),
      sections: DOC4_SECTIONS,
    };
  }

  doc4Sections() {
    return { sections: DOC4_SECTIONS };
  }

  constructionChecklist() {
    return {
      source: 'ALL_TYPES_CONSTRUCTION_CHECKLIST / INTERNAL_CONTROL',
      sections: DOC4_SECTIONS,
      categories: INSPECTION_CATEGORIES,
      results: Object.values(InspectionResult),
    };
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

    const result = dto.result ?? InspectionResult.PENDING;
    const checklist = dto.checklist ?? [];
    this.assertPrePourGate({
      category: dto.category,
      section: dto.section,
      result,
      checklist,
      sectionSignedBy: dto.sectionSignedBy,
    });

    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    const signedBy = dto.sectionSignedBy?.trim() || undefined;

    return this.prisma.projectInspection.create({
      data: {
        number: `INS-${year}-${stamp}`,
        projectId: dto.projectId,
        category: dto.category,
        phase: dto.phase,
        section: dto.section,
        inspectedAt: new Date(dto.inspectedAt),
        inspectedBy: dto.inspectedBy ?? `${user.firstName} ${user.lastName}`,
        result,
        notes: dto.notes,
        checklist: checklist.length
          ? (checklist as unknown as Prisma.InputJsonValue)
          : undefined,
        sectionSignedBy: signedBy,
        sectionSignedAt: signedBy ? new Date() : undefined,
      },
      include,
    });
  }

  async update(id: string, dto: UpdateInspectionDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.prisma.projectInspection.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Inspection not found');

    const category = dto.category ?? existing.category;
    const section = dto.section !== undefined ? dto.section : existing.section;
    const result = dto.result ?? existing.result;
    const checklist =
      dto.checklist ??
      (Array.isArray(existing.checklist)
        ? (existing.checklist as unknown as ChecklistItemDto[])
        : []);
    const sectionSignedBy =
      dto.sectionSignedBy !== undefined
        ? dto.sectionSignedBy
        : existing.sectionSignedBy ?? undefined;

    this.assertPrePourGate({
      category,
      section,
      result,
      checklist,
      sectionSignedBy,
    });

    const signedBy = dto.sectionSignedBy?.trim();
    return this.prisma.projectInspection.update({
      where: { id },
      data: {
        result: dto.result,
        notes: dto.notes,
        category: dto.category,
        section: dto.section,
        checklist:
          dto.checklist !== undefined
            ? (dto.checklist as unknown as Prisma.InputJsonValue)
            : undefined,
        sectionSignedBy: dto.sectionSignedBy !== undefined ? signedBy || null : undefined,
        sectionSignedAt:
          dto.sectionSignedBy !== undefined
            ? signedBy
              ? new Date()
              : null
            : undefined,
      },
      include,
    });
  }

  /**
   * Pre-pour gate: PASS requires every checklist item YES|NA (no empty/pending)
   * and sectionSignedBy when category or section indicates a pour gate.
   */
  private assertPrePourGate(args: {
    category: string;
    section?: string | null;
    result: InspectionResult;
    checklist: ChecklistItemDto[];
    sectionSignedBy?: string | null;
  }) {
    if (args.result !== InspectionResult.PASS) return;
    if (!this.isPrePourContext(args.category, args.section)) return;

    if (!args.checklist.length) {
      throw new BadRequestException(
        'Pre-pour PASS requires a completed checklist (all items YES or NA)',
      );
    }

    const incomplete = args.checklist.filter(
      (row) => !row.status || (row.status !== 'YES' && row.status !== 'NA'),
    );
    if (incomplete.length) {
      throw new BadRequestException(
        'Pre-pour PASS refused: every checklist item must be YES or NA (no NO or empty)',
      );
    }

    if (!args.sectionSignedBy?.trim()) {
      throw new BadRequestException(
        'Pre-pour PASS requires sectionSignedBy (section sign-off)',
      );
    }
  }

  private isPrePourContext(category: string, section?: string | null): boolean {
    if (category.toLowerCase().includes('pre-pour')) return true;
    const s = (section ?? '').toUpperCase();
    return s.includes('PRE-POUR') || s.includes('CONCRETE POUR');
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
