import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class IvcStageDto {
  @IsNumber()
  sn!: number;

  @IsString()
  stage!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  measuredPct?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pctPaid?: number | null;

  @IsOptional()
  @IsDateString()
  datePaid?: string | null;

  @IsOptional()
  @IsString()
  performanceComment?: string;
}

export class CreateIvcDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  worksContractId?: string;

  @IsString()
  workDescription!: string;

  @IsString()
  subcontractorName!: string;

  @IsOptional()
  @IsString()
  accountDetails?: string;

  @IsString()
  scopeOfWork!: string;

  @IsOptional()
  @IsString()
  contractReference?: string;

  @IsNumber()
  @Min(0)
  contractAmount!: number;

  @IsOptional()
  @IsString()
  deliveryPeriod?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IvcStageDto)
  stages?: IvcStageDto[];

  @IsOptional()
  @IsString()
  recommendation?: string;

  @IsOptional()
  @IsString()
  preparedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateIvcDto {
  @IsOptional()
  @IsString()
  workDescription?: string;

  @IsOptional()
  @IsString()
  subcontractorName?: string;

  @IsOptional()
  @IsString()
  accountDetails?: string;

  @IsOptional()
  @IsString()
  scopeOfWork?: string;

  @IsOptional()
  @IsString()
  contractReference?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  contractAmount?: number;

  @IsOptional()
  @IsString()
  deliveryPeriod?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IvcStageDto)
  stages?: IvcStageDto[];

  @IsOptional()
  @IsString()
  recommendation?: string;

  @IsOptional()
  @IsString()
  preparedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SignIvcDto {
  @IsOptional()
  @IsString()
  signedBy?: string;
}
