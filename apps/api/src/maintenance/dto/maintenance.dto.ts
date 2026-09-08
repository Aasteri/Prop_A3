import {
  IsArray,
  ArrayMaxSize,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  MaintenanceResponsibility,
  MaintenanceStatus,
  MaintenanceUrgency,
  WorkOrderStatus,
} from '@prisma/client';

export class CreateMaintenanceDto {
  @IsString()
  propertyId!: string;

  @IsOptional()
  @IsString()
  unitLabel?: string;

  @IsOptional()
  @IsString()
  tenantName?: string;

  @IsOptional()
  @IsString()
  tenantPhone?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  component?: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsEnum(MaintenanceUrgency)
  urgency?: MaintenanceUrgency;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  photoUrls?: string[];
}

export class UpdateMaintenanceDto {
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsEnum(MaintenanceUrgency)
  urgency?: MaintenanceUrgency;

  @IsOptional()
  @IsEnum(MaintenanceResponsibility)
  responsibility?: MaintenanceResponsibility;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  component?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateWorkOrderDto {
  @IsOptional()
  @IsString()
  artisanName?: string;

  @IsOptional()
  @IsString()
  artisanPhone?: string;

  @IsOptional()
  @IsBoolean()
  withinServiceCharge?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  labourAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  materialsAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  platformFee?: number;
}

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @IsOptional()
  @IsString()
  artisanName?: string;

  @IsOptional()
  @IsString()
  artisanPhone?: string;

  @IsOptional()
  @IsBoolean()
  tenantSatisfied?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  tenantRating?: number;

  @IsOptional()
  @IsString()
  tenantFeedback?: string;
}

export class ListMaintenanceQueryDto {
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
