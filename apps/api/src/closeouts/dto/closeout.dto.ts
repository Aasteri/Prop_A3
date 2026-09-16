import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CloseoutZoneDto {
  @IsString()
  zone!: string;

  @IsArray()
  @IsString({ each: true })
  items!: string[];
}

export class CreateCloseoutDto {
  @IsString()
  projectId!: string;

  @IsString()
  developerName!: string;

  @IsString()
  clientName!: string;

  @IsOptional()
  @IsDateString()
  durationStart?: string;

  @IsOptional()
  @IsDateString()
  durationEnd?: string;

  @IsString()
  executiveSummary!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CloseoutZoneDto)
  accomplishments!: CloseoutZoneDto[];

  @IsOptional()
  @IsString()
  openItems?: string;

  @IsOptional()
  @IsBoolean()
  overBudget?: boolean;

  @IsOptional()
  @IsBoolean()
  onSchedule?: boolean;

  @IsOptional()
  @IsString()
  preparedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCloseoutDto {
  @IsOptional()
  @IsString()
  developerName?: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsDateString()
  durationStart?: string;

  @IsOptional()
  @IsDateString()
  durationEnd?: string;

  @IsOptional()
  @IsString()
  executiveSummary?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CloseoutZoneDto)
  accomplishments?: CloseoutZoneDto[];

  @IsOptional()
  @IsString()
  openItems?: string;

  @IsOptional()
  @IsBoolean()
  overBudget?: boolean;

  @IsOptional()
  @IsBoolean()
  onSchedule?: boolean;

  @IsOptional()
  @IsString()
  preparedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AcknowledgeCloseoutDto {
  @IsOptional()
  @IsString()
  clientAcknowledgedBy?: string;
}
