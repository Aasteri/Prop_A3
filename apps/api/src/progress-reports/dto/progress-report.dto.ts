import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProgressTeamMemberDto {
  @IsString()
  role!: string;

  @IsString()
  name!: string;
}

export class ProgressTaskDto {
  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class ProgressRiskDto {
  @IsString()
  issue!: string;

  @IsOptional()
  @IsString()
  impact?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  owner?: string;
}

export class CreateProgressReportDto {
  @IsString()
  projectId!: string;

  @IsDateString()
  reportDate!: string;

  @IsString()
  summary!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressTeamMemberDto)
  team?: ProgressTeamMemberDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressTaskDto)
  completed?: ProgressTaskDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressTaskDto)
  upcoming?: ProgressTaskDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressRiskDto)
  risks?: ProgressRiskDto[];

  @IsOptional()
  @IsString()
  preparedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProgressReportDto {
  @IsOptional()
  @IsDateString()
  reportDate?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressTeamMemberDto)
  team?: ProgressTeamMemberDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressTaskDto)
  completed?: ProgressTaskDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressTaskDto)
  upcoming?: ProgressTaskDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressRiskDto)
  risks?: ProgressRiskDto[];

  @IsOptional()
  @IsString()
  preparedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
