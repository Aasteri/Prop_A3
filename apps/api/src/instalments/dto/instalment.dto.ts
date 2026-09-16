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

export class SchedulePctDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  pct!: number;
}

export class CreateInstalmentPlanDto {
  @IsString()
  purchaserName!: string;

  @IsString()
  unitPlotNo!: string;

  @IsNumber()
  @Min(0)
  contractPrice!: number;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  /** Six percentages; defaults 20/15/15/15/15/20 */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchedulePctDto)
  schedulePcts?: SchedulePctDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordInstalmentPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  paymentRef?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
