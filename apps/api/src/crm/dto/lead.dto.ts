import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { LeadSource, LeadStage } from '@prisma/client';

export class CreateLeadDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @IsString()
  listingId?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetNgn?: number;

  @IsOptional()
  @IsString()
  preferences?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dealValueNgn?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeadDto extends CreateLeadDto {}

export class UpdateLeadStageDto {
  @IsEnum(LeadStage)
  stage!: LeadStage;

  @IsOptional()
  @IsString()
  lostReason?: string;
}

export class PublicInquiryDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  listingId?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmCampaign?: string;
}
