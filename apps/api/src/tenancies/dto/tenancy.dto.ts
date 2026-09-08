import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TenancyStatus } from '@prisma/client';

export class CreateTenancyDto {
  @IsString()
  propertyId!: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  agreementNo?: string;

  @IsString()
  tenantName!: string;

  @IsOptional()
  @IsString()
  tenantPhone?: string;

  @IsOptional()
  @IsString()
  tenantEmail?: string;

  @IsOptional()
  @IsString()
  applicationId?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsNumber()
  @Min(0)
  rentAnnual!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cautionAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceCharge?: number;

  @IsOptional()
  @IsEnum(TenancyStatus)
  status?: TenancyStatus;
}

export class UpdateTenancyDto {
  @IsOptional()
  @IsString()
  tenantName?: string;

  @IsOptional()
  @IsString()
  tenantPhone?: string;

  @IsOptional()
  @IsString()
  tenantEmail?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

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
  serviceCharge?: number;

  @IsOptional()
  @IsEnum(TenancyStatus)
  status?: TenancyStatus;
}

export class ActivateMoveInDto {
  @IsOptional()
  @IsBoolean()
  waiver?: boolean;

  @IsOptional()
  @IsString()
  waiverReason?: string;
}

export class ListTenanciesQueryDto {
  @IsOptional()
  @IsEnum(TenancyStatus)
  status?: TenancyStatus;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
