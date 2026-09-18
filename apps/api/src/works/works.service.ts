import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole, WorksContractStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateWorksContractDto, UpdateWorksStatusDto } from './dto/works.dto';
import { CompanySettingsService } from '../company-settings/company-settings.service';

const include = {
  project: { select: { id: true, name: true, location: true, site: { select: { code: true } } } },
};

@Injectable()
export class WorksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companySettings: CompanySettingsService,
  ) {}

  findAll(user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.worksContract.findMany({
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateWorksContractDto, user: AuthUser) {
    this.assertCanManage(user);
    const project = await this.prisma.project.findUnique({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const companyFees = await this.companySettings.getFeeSchedule();
    const feePct = dto.platformFeePct ?? companyFees.worksPlatformFeePct;
    const platformFeeAmount = Math.round(dto.contractSum * (feePct / 100) * 100) / 100;
    const year = new Date().getFullYear();
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);

    return this.prisma.worksContract.create({
      data: {
        number: `WRK-${year}-${stamp}`,
        projectId: dto.projectId,
        subcontractorName: dto.subcontractorName,
        subcontractorPhone: dto.subcontractorPhone,
        scopeSummary: dto.scopeSummary,
        contractSum: dto.contractSum,
        mobilisationPct: dto.mobilisationPct,
        retentionPct: dto.retentionPct ?? companyFees.worksRetentionPct,
        platformFeePct: feePct,
        platformFeeAmount,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        completionDate: dto.completionDate ? new Date(dto.completionDate) : undefined,
        notes: dto.notes,
        status: WorksContractStatus.ACTIVE,
      },
      include,
    });
  }

  async updateStatus(id: string, dto: UpdateWorksStatusDto, user: AuthUser) {
    this.assertCanManage(user);
    const existing = await this.prisma.worksContract.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Works contract not found');
    return this.prisma.worksContract.update({
      where: { id },
      data: { status: dto.status as WorksContractStatus },
      include,
    });
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.FOREMAN,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }

  private assertCanManage(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }
}
