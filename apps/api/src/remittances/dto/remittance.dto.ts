import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRemittanceDto {
  @IsString()
  propertyId!: string;

  @IsString()
  landlordName!: string;

  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;

  @IsNumber()
  @Min(0)
  grossRent!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  otherReceipts?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  expensesTotal?: number;

  @IsOptional()
  @IsString()
  expenseNotes?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;
}

export class MarkRemittancePaidDto {
  @IsOptional()
  @IsString()
  transferRef?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
