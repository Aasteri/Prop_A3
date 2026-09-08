import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTenancyOfferDto {
  @IsString()
  applicationId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rentAnnual?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cautionAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  agencyFeePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  legalFeePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  managementFeePct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceChargeAnnual?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estateServiceCharge?: number;

  @IsOptional()
  @IsString()
  serviceChargeNotes?: string;

  @IsOptional()
  @IsString()
  landlordPayee?: string;

  @IsOptional()
  @IsString()
  managementPayee?: string;

  @IsOptional()
  @IsString()
  agencyPayee?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
