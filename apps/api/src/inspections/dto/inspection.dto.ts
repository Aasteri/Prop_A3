import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { InspectionResult } from '@prisma/client';

export class CreateInspectionDto {
  @IsString()
  projectId!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  phase?: string;

  @IsDateString()
  inspectedAt!: string;

  @IsOptional()
  @IsString()
  inspectedBy?: string;

  @IsOptional()
  @IsEnum(InspectionResult)
  result?: InspectionResult;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInspectionDto {
  @IsOptional()
  @IsEnum(InspectionResult)
  result?: InspectionResult;

  @IsOptional()
  @IsString()
  notes?: string;
}
