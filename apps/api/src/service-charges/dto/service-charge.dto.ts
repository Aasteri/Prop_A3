import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ServiceChargeCreditDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  entryDate?: string;
}

export class ServiceChargeDebitDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  entryDate?: string;

  @IsOptional()
  @IsString()
  workOrderId?: string;
}
