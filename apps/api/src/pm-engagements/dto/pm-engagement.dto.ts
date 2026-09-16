import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePmEngagementDto {
  @IsString()
  ownerName!: string;

  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lettingFeePct?: number;

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
  applicationAgencyLegalPct?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  propertyIds?: string[];
}

export class UpdatePmEngagementDto {
  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lettingFeePct?: number;

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
  applicationAgencyLegalPct?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  propertyIds?: string[];
}
