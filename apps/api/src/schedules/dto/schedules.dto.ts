import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkTaskDto {
  @IsString()
  projectId!: string;

  @IsString()
  wbsNumber!: string;

  @IsString()
  taskTitle!: string;

  @IsOptional()
  @IsString()
  taskOwner?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPct?: number;

  @IsOptional()
  @IsBoolean()
  isPaymentMilestone?: boolean;

  @IsOptional()
  @IsString()
  sprintGoal?: string;

  @IsOptional()
  @IsString()
  phaseLabel?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateWorkTaskDto {
  @IsOptional()
  @IsString()
  wbsNumber?: string;

  @IsOptional()
  @IsString()
  taskTitle?: string;

  @IsOptional()
  @IsString()
  taskOwner?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationDays?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyHours?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPct?: number;

  @IsOptional()
  @IsBoolean()
  isPaymentMilestone?: boolean;

  @IsOptional()
  @IsString()
  sprintGoal?: string | null;

  @IsOptional()
  @IsString()
  phaseLabel?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

/** Bulk item — projectId comes from the parent BulkWorkTasksDto */
export class BulkWorkTaskItemDto {
  @IsString()
  wbsNumber!: string;

  @IsString()
  taskTitle!: string;

  @IsOptional()
  @IsString()
  taskOwner?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPct?: number;

  @IsOptional()
  @IsBoolean()
  isPaymentMilestone?: boolean;

  @IsOptional()
  @IsString()
  sprintGoal?: string;

  @IsOptional()
  @IsString()
  phaseLabel?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class BulkWorkTasksDto {
  @IsString()
  projectId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkWorkTaskItemDto)
  tasks!: BulkWorkTaskItemDto[];
}

export class LabourScheduleLineDto {
  @IsInt()
  @Min(1)
  sn!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  teamTrade?: string;

  @IsOptional()
  @IsString()
  gangLeader?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  gangSize?: number;

  @IsOptional()
  @IsDateString()
  workStart?: string;

  @IsOptional()
  @IsDateString()
  workEnd?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerUnit?: number;

  @IsOptional()
  @IsString()
  costUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @IsString()
  supervisedBy?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreateLabourScheduleDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  projectTitle?: string;

  @IsOptional()
  @IsString()
  projectPhase?: string;

  @IsOptional()
  @IsString()
  projectManager?: string;

  @IsOptional()
  @IsString()
  sheetNo?: string;

  @IsOptional()
  @IsDateString()
  scheduleDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabourScheduleLineDto)
  lines?: LabourScheduleLineDto[];
}

export class UpdateLabourScheduleDto {
  @IsOptional()
  @IsString()
  projectTitle?: string;

  @IsOptional()
  @IsString()
  projectPhase?: string;

  @IsOptional()
  @IsString()
  projectManager?: string;

  @IsOptional()
  @IsString()
  sheetNo?: string;

  @IsOptional()
  @IsDateString()
  scheduleDate?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabourScheduleLineDto)
  lines!: LabourScheduleLineDto[];
}

export class PlantEquipmentLineDto {
  @IsInt()
  @Min(1)
  sn!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  nameSource?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  qtyUsed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPerUnit?: number;

  @IsOptional()
  @IsString()
  costUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @IsString()
  supervisedBy?: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreatePlantEquipmentScheduleDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  projectTitle?: string;

  @IsOptional()
  @IsString()
  projectPhase?: string;

  @IsOptional()
  @IsString()
  projectManager?: string;

  @IsOptional()
  @IsString()
  sheetNo?: string;

  @IsOptional()
  @IsDateString()
  scheduleDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlantEquipmentLineDto)
  lines?: PlantEquipmentLineDto[];
}

export class UpdatePlantEquipmentScheduleDto {
  @IsOptional()
  @IsString()
  projectTitle?: string;

  @IsOptional()
  @IsString()
  projectPhase?: string;

  @IsOptional()
  @IsString()
  projectManager?: string;

  @IsOptional()
  @IsString()
  sheetNo?: string;

  @IsOptional()
  @IsDateString()
  scheduleDate?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlantEquipmentLineDto)
  lines!: PlantEquipmentLineDto[];
}
