import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCharterDto {
  @IsString()
  projectId!: string;

  @IsString()
  title!: string;

  @IsString()
  executiveSummary!: string;

  @IsArray()
  @IsString({ each: true })
  goals!: string[];

  @IsArray()
  @IsString({ each: true })
  deliverables!: string[];

  @IsOptional()
  @IsString()
  businessCase?: string;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsString()
  costs?: string;

  @IsOptional()
  @IsString()
  budgetRange?: string;

  @IsOptional()
  @IsString()
  timeline?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  risks?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopeIn?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopeOut?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  team?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  successCriteria?: string[];

  @IsOptional()
  @IsString()
  preparedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCharterDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  executiveSummary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  goals?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliverables?: string[];

  @IsOptional()
  @IsString()
  businessCase?: string;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsString()
  costs?: string;

  @IsOptional()
  @IsString()
  budgetRange?: string;

  @IsOptional()
  @IsString()
  timeline?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  risks?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopeIn?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopeOut?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  team?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  successCriteria?: string[];

  @IsOptional()
  @IsString()
  preparedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SignCharterDto {
  @IsOptional()
  @IsString()
  signedBy?: string;
}

export class KickoffAttendeeDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class KickoffAgendaDto {
  @IsString()
  item!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class KickoffActionDto {
  @IsString()
  action!: string;

  @IsOptional()
  @IsString()
  actionedBy?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class CreateKickoffDto {
  @IsString()
  projectId!: string;

  @IsDateString()
  meetingAt!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  projectManagerName?: string;

  @IsOptional()
  @IsString()
  preparedBy?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KickoffAttendeeDto)
  attendees?: KickoffAttendeeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KickoffAgendaDto)
  agenda?: KickoffAgendaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KickoffActionDto)
  actions?: KickoffActionDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
