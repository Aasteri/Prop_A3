import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityStatus } from '@prisma/client';

export class ActivityDto {
  @IsString()
  activity!: string;

  @IsEnum(ActivityStatus)
  status!: ActivityStatus;

  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent!: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class MachineryDto {
  @IsString()
  equipment!: string;

  @IsOptional()
  @IsNumber()
  unitsHours?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class MaterialDto {
  @IsString()
  material!: string;

  @IsNumber()
  @Min(0)
  receivedQty!: number;

  @IsNumber()
  @Min(0)
  consumedQty!: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreateDailyLogDto {
  @IsString()
  projectId!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsString()
  projectName!: string;

  @IsString()
  projectLocation!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  siteSupervisors?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  skilledWorkers?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  ironBenders?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  carpenters?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  masons?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  plumbers?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  electricians?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  unskilledWorkers?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  supervisorsCount?: number;

  @IsOptional()
  @IsString()
  manpowerRemark?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityDto)
  activities?: ActivityDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MachineryDto)
  machinery?: MachineryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialDto)
  materials?: MaterialDto[];

  @IsOptional()
  @IsBoolean()
  qualitySlumpTest?: boolean;

  @IsOptional()
  @IsBoolean()
  qualityCubeCasting?: boolean;

  @IsOptional()
  @IsBoolean()
  qualityReinforcement?: boolean;

  @IsOptional()
  @IsBoolean()
  qualityConcrete?: boolean;

  @IsOptional()
  @IsString()
  qualityOther?: string;

  @IsOptional()
  @IsBoolean()
  safetyPpeCompliance?: boolean;

  @IsOptional()
  @IsBoolean()
  safetyToolboxTalk?: boolean;

  @IsOptional()
  @IsBoolean()
  safetyIncidentsNearMisses?: boolean;

  @IsOptional()
  @IsBoolean()
  issueMaterialShortage?: boolean;

  @IsOptional()
  @IsBoolean()
  issueEquipmentBreakdown?: boolean;

  @IsOptional()
  @IsBoolean()
  issueWeatherDelay?: boolean;

  @IsOptional()
  @IsString()
  issueOther?: string;

  @IsOptional()
  @IsString()
  nextDayActivities?: string;

  @IsOptional()
  @IsString()
  nextDayMaterials?: string;

  @IsOptional()
  @IsString()
  nextDayManpower?: string;
}

export class UpdateDailyLogDto extends CreateDailyLogDto {}

export class SubmitDailyLogDto {
  @IsString()
  supervisorSignature!: string;

  @IsOptional()
  @IsNumber()
  submitLat?: number;

  @IsOptional()
  @IsNumber()
  submitLng?: number;
}

export class RejectDailyLogDto {
  @IsString()
  rejectReason!: string;
}
