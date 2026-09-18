import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreatePmEngagementDto,
  UpdatePmEngagementDto,
} from './dto/pm-engagement.dto';
import {
  CompanySettingsService,
  HARDCODED_FEE_FALLBACK,
} from '../company-settings/company-settings.service';

/** Production defaults (Doc 10 / 11 / 12) — overridable per engagement / company settings. */
export const DEFAULT_FEE_SCHEDULE = {
  lettingFeePct: HARDCODED_FEE_FALLBACK.lettingFeePct,
  agencyFeePct: HARDCODED_FEE_FALLBACK.agencyFeePct,
  legalFeePct: HARDCODED_FEE_FALLBACK.legalFeePct,
  managementFeePct: HARDCODED_FEE_FALLBACK.managementFeePct,
  applicationAgencyLegalPct: HARDCODED_FEE_FALLBACK.applicationAgencyLegalPct,
  source: 'defaults' as const,
};

const include = {
  properties: {
    include: {
      property: {
        select: { id: true, name: true, code: true, address: true, estateName: true },
      },
    },
  },
};

@Injectable()
export class PmEngagementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companySettings: CompanySettingsService,
  ) {}

  findAll(user: AuthUser) {
    this.assertCanView(user);
    return this.prisma.pmEngagement
      .findMany({ include, orderBy: { createdAt: 'desc' } })
      .then((rows) => rows.map((r) => this.serialize(r)));
  }

  async findOne(id: string, user: AuthUser) {
    this.assertCanView(user);
    const row = await this.prisma.pmEngagement.findUnique({ where: { id }, include });
    if (!row) throw new NotFoundException('PM engagement not found');
    return this.serialize(row);
  }

  /**
   * Resolve fee schedule for a property (active engagement) or company settings / Doc defaults.
   */
  async resolveSchedule(user: AuthUser, propertyId?: string) {
    this.assertCanView(user);
    const companyFees = await this.companySettings.getFeeSchedule();
    const companyDefaults = {
      lettingFeePct: companyFees.lettingFeePct,
      agencyFeePct: companyFees.agencyFeePct,
      legalFeePct: companyFees.legalFeePct,
      managementFeePct: companyFees.managementFeePct,
      applicationAgencyLegalPct: companyFees.applicationAgencyLegalPct,
      source: 'company_settings' as const,
    };

    if (!propertyId) {
      return { ...companyDefaults, propertyId: null, engagementId: null };
    }
    const link = await this.prisma.pmEngagementProperty.findFirst({
      where: {
        propertyId,
        engagement: { status: 'active' },
      },
      include: { engagement: true },
    });
    if (!link) {
      return {
        ...companyDefaults,
        propertyId,
        engagementId: null,
        note: 'No active PM engagement for this property — using company fee standards',
      };
    }
    const e = link.engagement;
    return {
      propertyId,
      engagementId: e.id,
      ownerName: e.ownerName,
      lettingFeePct: Number(e.lettingFeePct ?? companyDefaults.lettingFeePct),
      agencyFeePct: Number(e.agencyFeePct ?? companyDefaults.agencyFeePct),
      legalFeePct: Number(e.legalFeePct ?? companyDefaults.legalFeePct),
      managementFeePct: Number(e.managementFeePct ?? companyDefaults.managementFeePct),
      applicationAgencyLegalPct: Number(
        e.applicationAgencyLegalPct ?? companyDefaults.applicationAgencyLegalPct,
      ),
      source: 'engagement' as const,
    };
  }

  async create(dto: CreatePmEngagementDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.assertProperties(dto.propertyIds);
    const fees = await this.companySettings.getFeeSchedule();
    const row = await this.prisma.pmEngagement.create({
      data: {
        ownerName: dto.ownerName,
        ownerPhone: dto.ownerPhone,
        lettingFeePct: dto.lettingFeePct ?? fees.lettingFeePct,
        agencyFeePct: dto.agencyFeePct ?? fees.agencyFeePct,
        legalFeePct: dto.legalFeePct ?? fees.legalFeePct,
        managementFeePct: dto.managementFeePct ?? fees.managementFeePct,
        applicationAgencyLegalPct:
          dto.applicationAgencyLegalPct ?? fees.applicationAgencyLegalPct,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status ?? 'active',
        notes: dto.notes,
        properties: dto.propertyIds?.length
          ? { create: dto.propertyIds.map((propertyId) => ({ propertyId })) }
          : undefined,
      },
      include,
    });
    return this.serialize(row);
  }

  async update(id: string, dto: UpdatePmEngagementDto, user: AuthUser) {
    this.assertCanManage(user);
    await this.findOne(id, user);
    await this.assertProperties(dto.propertyIds);

    const row = await this.prisma.$transaction(async (tx) => {
      if (dto.propertyIds) {
        await tx.pmEngagementProperty.deleteMany({ where: { engagementId: id } });
        if (dto.propertyIds.length) {
          await tx.pmEngagementProperty.createMany({
            data: dto.propertyIds.map((propertyId) => ({ engagementId: id, propertyId })),
          });
        }
      }
      return tx.pmEngagement.update({
        where: { id },
        data: {
          ownerName: dto.ownerName,
          ownerPhone: dto.ownerPhone,
          lettingFeePct: dto.lettingFeePct,
          agencyFeePct: dto.agencyFeePct,
          legalFeePct: dto.legalFeePct,
          managementFeePct: dto.managementFeePct,
          applicationAgencyLegalPct: dto.applicationAgencyLegalPct,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          status: dto.status,
          notes: dto.notes,
        },
        include,
      });
    });
    return this.serialize(row);
  }

  private async assertProperties(propertyIds?: string[]) {
    if (!propertyIds?.length) return;
    const count = await this.prisma.propertyAsset.count({
      where: { id: { in: propertyIds } },
    });
    if (count !== propertyIds.length) {
      throw new BadRequestException('One or more properties not found');
    }
  }

  private serialize<T extends Record<string, unknown>>(row: T) {
    const r = row as T & {
      lettingFeePct: unknown;
      agencyFeePct: unknown;
      legalFeePct: unknown;
      managementFeePct: unknown;
      applicationAgencyLegalPct: unknown;
    };
    return {
      ...r,
      lettingFeePct: Number(r.lettingFeePct ?? DEFAULT_FEE_SCHEDULE.lettingFeePct),
      agencyFeePct: Number(r.agencyFeePct ?? DEFAULT_FEE_SCHEDULE.agencyFeePct),
      legalFeePct: Number(r.legalFeePct ?? DEFAULT_FEE_SCHEDULE.legalFeePct),
      managementFeePct: Number(r.managementFeePct ?? DEFAULT_FEE_SCHEDULE.managementFeePct),
      applicationAgencyLegalPct: Number(
        r.applicationAgencyLegalPct ?? DEFAULT_FEE_SCHEDULE.applicationAgencyLegalPct,
      ),
    };
  }

  async buildPdf(id: string, user: AuthUser) {
    const row = await this.findOne(id, user);
    const { buildPmEngagementPdf } = await import('./pm-engagement.pdf');
    const properties = (row.properties as { property: { name: string } }[]) ?? [];
    return buildPmEngagementPdf({
      ownerName: row.ownerName as string,
      ownerPhone: (row.ownerPhone as string | null) ?? null,
      status: row.status as string,
      lettingFeePct: Number(row.lettingFeePct),
      agencyFeePct: Number(row.agencyFeePct),
      legalFeePct: Number(row.legalFeePct),
      managementFeePct: Number(row.managementFeePct),
      applicationAgencyLegalPct: Number(row.applicationAgencyLegalPct),
      startDate: row.startDate ? new Date(row.startDate as string | Date) : null,
      endDate: row.endDate ? new Date(row.endDate as string | Date) : null,
      notes: (row.notes as string | null) ?? null,
      propertyNames: properties.map((p) => p.property.name),
    });
  }

  private assertCanView(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.FINANCE,
      UserRole.SALES,
      UserRole.CEO,
      UserRole.ADMIN,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }

  private assertCanManage(user: AuthUser) {
    const allowed: UserRole[] = [
      UserRole.PROJECT_MANAGER,
      UserRole.CEO,
      UserRole.ADMIN,
      UserRole.FINANCE,
    ];
    if (!allowed.includes(user.role)) throw new ForbiddenException();
  }
}
