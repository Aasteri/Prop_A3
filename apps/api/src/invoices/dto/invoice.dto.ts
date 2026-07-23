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
import { InvoiceType } from '@prisma/client';

export class InvoiceLineDto {
  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsString()
  unit!: string;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class InvoiceVariationDto {
  @IsOptional()
  @IsString()
  changeLogId?: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  amount!: number;
}

export class CreateInvoiceDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsString()
  settlementEntityId!: string;

  @IsEnum(InvoiceType)
  invoiceType!: InvoiceType;

  @IsDateString()
  issueDate!: string;

  @IsOptional()
  @IsString()
  contractRef?: string;

  @IsString()
  @MinLength(2)
  clientName!: string;

  @IsOptional()
  @IsString()
  clientAddress?: string;

  @IsOptional()
  @IsString()
  projectDetails?: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines!: InvoiceLineDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceVariationDto)
  variations?: InvoiceVariationDto[];
}

export class UpdateInvoiceDto extends CreateInvoiceDto {}

export class RejectPaymentDto {
  @IsString()
  @MinLength(3)
  rejectReason!: string;
}

export class UploadPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;
}
