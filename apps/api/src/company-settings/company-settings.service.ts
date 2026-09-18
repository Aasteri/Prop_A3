import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { UpdateCompanySettingsDto } from './dto/company-settings.dto';

export type FeeSchedule = {
  lettingFeePct: number;
  agencyFeePct: number;
  legalFeePct: number;
  managementFeePct: number;
  applicationAgencyLegalPct: number;
  worksPlatformFeePct: number;
  worksRetentionPct: number;
  servicesPlatformFeePct: number;
  marketplacePlatformFeePct: number;
  cautionDepositPct: number;
  externalAgentCommissionOfAgencyPct: number;
};

/** Hardcoded Doc 10/11/12 defaults — used when DB/settings unavailable. */
export const HARDCODED_FEE_FALLBACK: FeeSchedule = {
  lettingFeePct: 10,
  agencyFeePct: 10,
  legalFeePct: 5,
  managementFeePct: 5,
  applicationAgencyLegalPct: 20,
  worksPlatformFeePct: 10,
  worksRetentionPct: 5,
  servicesPlatformFeePct: 2.5,
  marketplacePlatformFeePct: 2.5,
  cautionDepositPct: 10,
  externalAgentCommissionOfAgencyPct: 50,
};

export type CompanySettingsView = FeeSchedule & {
  id: string;
  companyLegalName: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  defaultCurrency: string;
  notes: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

const CACHE_TTL_MS = 30_000;
const SETTINGS_ID = 'default';

@Injectable()
export class CompanySettingsService {
  private readonly logger = new Logger(CompanySettingsService.name);
  private cache: { at: number; value: CompanySettingsView } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** Upsert singleton if missing; short in-memory TTL cache. */
  async get(): Promise<CompanySettingsView> {
    if (this.cache && Date.now() - this.cache.at < CACHE_TTL_MS) {
      return this.cache.value;
    }
    const row = await this.prisma.companySettings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });
    const view = this.serialize(row);
    this.cache = { at: Date.now(), value: view };
    return view;
  }

  /**
   * Fee percentages for new calculations. Falls back to hardcoded defaults
   * if settings cannot be loaded.
   */
  async getFeeSchedule(): Promise<FeeSchedule> {
    try {
      const s = await this.get();
      return {
        lettingFeePct: s.lettingFeePct,
        agencyFeePct: s.agencyFeePct,
        legalFeePct: s.legalFeePct,
        managementFeePct: s.managementFeePct,
        applicationAgencyLegalPct: s.applicationAgencyLegalPct,
        worksPlatformFeePct: s.worksPlatformFeePct,
        worksRetentionPct: s.worksRetentionPct,
        servicesPlatformFeePct: s.servicesPlatformFeePct,
        marketplacePlatformFeePct: s.marketplacePlatformFeePct,
        cautionDepositPct: s.cautionDepositPct,
        externalAgentCommissionOfAgencyPct: s.externalAgentCommissionOfAgencyPct,
      };
    } catch (err) {
      this.logger.warn(
        `getFeeSchedule falling back to hardcoded defaults: ${err instanceof Error ? err.message : err}`,
      );
      return { ...HARDCODED_FEE_FALLBACK };
    }
  }

  async update(dto: UpdateCompanySettingsDto, user: AuthUser): Promise<CompanySettingsView> {
    this.assertCanEdit(user);
    await this.get(); // ensure row exists

    const data: Record<string, unknown> = {
      updatedBy: this.displayName(user),
    };
    const keys: (keyof UpdateCompanySettingsDto)[] = [
      'lettingFeePct',
      'agencyFeePct',
      'legalFeePct',
      'managementFeePct',
      'applicationAgencyLegalPct',
      'worksPlatformFeePct',
      'worksRetentionPct',
      'servicesPlatformFeePct',
      'marketplacePlatformFeePct',
      'cautionDepositPct',
      'externalAgentCommissionOfAgencyPct',
      'companyLegalName',
      'bankName',
      'bankAccountName',
      'bankAccountNumber',
      'defaultCurrency',
      'notes',
    ];
    for (const k of keys) {
      if (dto[k] !== undefined) data[k] = dto[k];
    }

    const row = await this.prisma.companySettings.update({
      where: { id: SETTINGS_ID },
      data,
    });

    await this.syncTripleASettlement(row);
    this.invalidateCache();
    return this.serialize(row);
  }

  invalidateCache() {
    this.cache = null;
  }

  private async syncTripleASettlement(row: {
    companyLegalName: string;
    bankName: string;
    bankAccountName: string;
    bankAccountNumber: string;
  }) {
    await this.prisma.settlementEntity.upsert({
      where: { id: 'seed-triplea' },
      update: {
        name: row.companyLegalName,
        bankName: row.bankName,
        accountName: row.bankAccountName,
        accountNumber: row.bankAccountNumber,
        isDefault: true,
      },
      create: {
        id: 'seed-triplea',
        name: row.companyLegalName,
        bankName: row.bankName,
        accountName: row.bankAccountName,
        accountNumber: row.bankAccountNumber,
        isDefault: true,
      },
    });
    await this.prisma.settlementEntity.updateMany({
      where: { id: { not: 'seed-triplea' } },
      data: { isDefault: false },
    });
  }

  private serialize(row: {
    id: string;
    lettingFeePct: unknown;
    agencyFeePct: unknown;
    legalFeePct: unknown;
    managementFeePct: unknown;
    applicationAgencyLegalPct: unknown;
    worksPlatformFeePct: unknown;
    worksRetentionPct: unknown;
    servicesPlatformFeePct: unknown;
    marketplacePlatformFeePct: unknown;
    cautionDepositPct: unknown;
    externalAgentCommissionOfAgencyPct: unknown;
    companyLegalName: string;
    bankName: string;
    bankAccountName: string;
    bankAccountNumber: string;
    defaultCurrency: string;
    notes: string | null;
    updatedAt: Date;
    updatedBy: string | null;
  }): CompanySettingsView {
    return {
      id: row.id,
      lettingFeePct: Number(row.lettingFeePct),
      agencyFeePct: Number(row.agencyFeePct),
      legalFeePct: Number(row.legalFeePct),
      managementFeePct: Number(row.managementFeePct),
      applicationAgencyLegalPct: Number(row.applicationAgencyLegalPct),
      worksPlatformFeePct: Number(row.worksPlatformFeePct),
      worksRetentionPct: Number(row.worksRetentionPct),
      servicesPlatformFeePct: Number(row.servicesPlatformFeePct),
      marketplacePlatformFeePct: Number(row.marketplacePlatformFeePct),
      cautionDepositPct: Number(row.cautionDepositPct),
      externalAgentCommissionOfAgencyPct: Number(row.externalAgentCommissionOfAgencyPct),
      companyLegalName: row.companyLegalName,
      bankName: row.bankName,
      bankAccountName: row.bankAccountName,
      bankAccountNumber: row.bankAccountNumber,
      defaultCurrency: row.defaultCurrency,
      notes: row.notes,
      updatedAt: row.updatedAt.toISOString(),
      updatedBy: row.updatedBy,
    };
  }

  private assertCanEdit(user: AuthUser) {
    if (user.role !== UserRole.CEO && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only CEO or Admin can update company settings');
    }
  }

  private displayName(user: AuthUser) {
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  }
}
