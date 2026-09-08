import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SalesInspectionStatus } from '@prisma/client';

export class CreateSalesInspectionDto {
  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsString()
  listingId?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class UpdateSalesInspectionDto {
  @IsOptional()
  @IsEnum(SalesInspectionStatus)
  status?: SalesInspectionStatus;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsBoolean()
  occurred?: boolean;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  buyerFeedback?: string;

  @IsOptional()
  @IsString()
  interestLevel?: string;

  @IsOptional()
  @IsString()
  nextAction?: string;
}

export class LogInspectionResponseDto {
  @IsBoolean()
  occurred!: boolean;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  buyerFeedback?: string;

  @IsOptional()
  @IsString()
  interestLevel?: string;

  @IsOptional()
  @IsString()
  nextAction?: string;
}
