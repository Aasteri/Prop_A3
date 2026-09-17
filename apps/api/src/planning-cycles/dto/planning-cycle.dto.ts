import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlanningCycleKind } from '@prisma/client';

export class ChecklistItemDto {
  @IsString()
  item!: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePlanningCycleDto {
  @IsString()
  projectId!: string;

  @IsEnum(PlanningCycleKind)
  kind!: PlanningCycleKind;

  @IsDateString()
  periodStart!: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist?: ChecklistItemDto[];

  @IsOptional()
  @IsString()
  targets?: string;

  @IsOptional()
  @IsString()
  resourcesNote?: string;

  @IsOptional()
  @IsString()
  risksNote?: string;

  @IsOptional()
  @IsString()
  lookaheadNote?: string;

  @IsOptional()
  @IsString()
  cashflowNote?: string;

  @IsOptional()
  @IsString()
  preparedBy?: string;
}

export class UpdatePlanningCycleDto {
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist?: ChecklistItemDto[];

  @IsOptional()
  @IsString()
  targets?: string;

  @IsOptional()
  @IsString()
  resourcesNote?: string;

  @IsOptional()
  @IsString()
  risksNote?: string;

  @IsOptional()
  @IsString()
  lookaheadNote?: string;

  @IsOptional()
  @IsString()
  cashflowNote?: string;

  @IsOptional()
  @IsString()
  preparedBy?: string;
}
