import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DepositSettlementLineDto {
  @IsString()
  sectionId!: string;

  @IsString()
  section!: string;

  @IsString()
  itemId!: string;

  @IsString()
  item!: string;

  @IsOptional()
  @IsString()
  moveInDefects?: string;

  @IsOptional()
  @IsString()
  moveOutDefects?: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsNumber()
  @Min(0)
  cost!: number;

  @IsBoolean()
  wearAndTear!: boolean;

  @IsBoolean()
  chargeable!: boolean;
}

export class CreateDepositSettlementDto {
  @IsString()
  tenancyId!: string;

  @IsOptional()
  @IsString()
  moveOutInventoryId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepositSettlementLineDto)
  lines?: DepositSettlementLineDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDepositSettlementDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepositSettlementLineDto)
  lines?: DepositSettlementLineDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  refundBankName?: string;

  @IsOptional()
  @IsString()
  refundAccountName?: string;

  @IsOptional()
  @IsString()
  refundAccountNumber?: string;
}

export class MarkRefundPaidDto {
  @IsOptional()
  @IsString()
  refundReference?: string;

  @IsOptional()
  @IsString()
  refundBankName?: string;

  @IsOptional()
  @IsString()
  refundAccountName?: string;

  @IsOptional()
  @IsString()
  refundAccountNumber?: string;
}
