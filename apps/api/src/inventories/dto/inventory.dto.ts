import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { InventoryKind } from '@prisma/client';

export class CreateInventoryDto {
  @IsString()
  tenancyId!: string;

  @IsEnum(InventoryKind)
  kind!: InventoryKind;

  @IsDateString()
  inspectedAt!: string;

  @IsOptional()
  @IsString()
  inspectedBy?: string;

  @IsOptional()
  @IsDateString()
  moveDate?: string;

  @IsOptional()
  @IsBoolean()
  photoEvidence?: boolean;

  @IsOptional()
  @IsBoolean()
  videoEvidence?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  frontDoorKeys?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  backDoorKeys?: number;

  @IsOptional()
  @IsString()
  electricMeterNo?: string;

  @IsOptional()
  @IsString()
  electricReading?: string;

  @IsOptional()
  @IsString()
  waterMeterNo?: string;

  @IsOptional()
  @IsString()
  waterReading?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  roomsJson?: unknown;
}

export class CompleteInventoryDto {
  @IsOptional()
  @IsBoolean()
  landlordSigned?: boolean;

  @IsOptional()
  @IsBoolean()
  tenantSigned?: boolean;
}
