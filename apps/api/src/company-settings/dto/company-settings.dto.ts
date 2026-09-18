import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateCompanySettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  lettingFeePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  agencyFeePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  legalFeePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  managementFeePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  applicationAgencyLegalPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  worksPlatformFeePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  worksRetentionPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  servicesPlatformFeePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  marketplacePlatformFeePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  cautionDepositPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  externalAgentCommissionOfAgencyPct?: number;

  @IsOptional()
  @IsString()
  companyLegalName?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  defaultCurrency?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
