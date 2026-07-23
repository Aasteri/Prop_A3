import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ChangeImpactLevel } from '@prisma/client';

export class CreateChangeLogDto {
  @IsString()
  projectId!: string;

  @IsDateString()
  revisionDate!: string;

  @IsString()
  @MinLength(3)
  description!: string;

  @IsString()
  @MinLength(3)
  justification!: string;

  @IsEnum(ChangeImpactLevel)
  impactLevel!: ChangeImpactLevel;

  @IsOptional()
  @IsString()
  originatorName?: string;
}

export class UpdateChangeLogDto extends CreateChangeLogDto {}

export class RejectChangeLogDto {
  @IsString()
  @MinLength(3)
  rejectReason!: string;
}
