import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MaterialUrgency } from '@prisma/client';

export class MaterialLineDto {
  @IsString()
  material!: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsNumber()
  @Min(0.001)
  quantityRequested!: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsEnum(MaterialUrgency)
  urgency?: MaterialUrgency;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreateMaterialRequestDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  dailyLogId?: string;

  @IsDateString()
  requiredDate!: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialLineDto)
  lines!: MaterialLineDto[];
}

export class UpdateMaterialRequestDto extends CreateMaterialRequestDto {}

export class ApproveLineDto {
  @IsString()
  lineId!: string;

  @IsNumber()
  @Min(0)
  quantityApproved!: number;
}

export class ApproveMaterialRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApproveLineDto)
  lines!: ApproveLineDto[];
}

export class IssueLineDto {
  @IsString()
  lineId!: string;

  @IsNumber()
  @Min(0)
  quantityIssued!: number;
}

export class IssueMaterialRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IssueLineDto)
  lines!: IssueLineDto[];
}

export class RejectMaterialRequestDto {
  @IsString()
  @MinLength(3)
  rejectReason!: string;
}
