import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { RentPaidFixed } from '@prisma/client';

export class CreateTerrierRowDto {
  @IsString()
  estateId!: string;

  @IsString()
  propertyType!: string;

  @IsString()
  location!: string;
}

export class UpdateTerrierRowDto {
  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  tenantName?: string;

  @IsOptional()
  @IsString()
  tenantPhone?: string;

  @IsOptional()
  @IsEnum(RentPaidFixed)
  rentPaidFixed?: RentPaidFixed;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rentAmountNgn?: number;

  @IsOptional()
  @IsString()
  paymentMode?: string;

  @IsOptional()
  @IsDateString()
  datePaid?: string;

  @IsOptional()
  @IsDateString()
  tenancyStart?: string;

  @IsOptional()
  @IsDateString()
  tenancyEnd?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cautionDeposit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceCharge?: number;

  @IsOptional()
  @IsString()
  expenseDescription?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  expenseAmount?: number;
}

export class VacateTerrierRowDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
