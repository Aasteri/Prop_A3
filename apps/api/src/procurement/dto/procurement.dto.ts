import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  legalName!: string;

  @IsOptional()
  @IsString()
  tradingName?: string;

  @IsOptional()
  @IsString()
  cacNumber?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class PurchaseRequisitionLineDto {
  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  spec?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0.001)
  qty!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estUnitCost?: number;
}

export class CreatePurchaseRequisitionDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  neededBy?: string;

  @IsOptional()
  @IsString()
  justification?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseRequisitionLineDto)
  lines!: PurchaseRequisitionLineDto[];
}

export class ListProcurementQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
