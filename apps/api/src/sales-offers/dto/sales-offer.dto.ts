import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SalesOfferResponse } from '@prisma/client';

export class CreateSalesOfferDto {
  @IsString()
  leadId!: string;

  @IsOptional()
  @IsString()
  listingId?: string;

  @IsNumber()
  @Min(0)
  offerPrice!: number;

  @IsOptional()
  @IsDateString()
  validityUntil?: string;

  @IsOptional()
  @IsString()
  conditions?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositRequired?: number;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  preparedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RespondSalesOfferDto {
  @IsEnum(SalesOfferResponse)
  buyerResponse!: SalesOfferResponse;

  @IsOptional()
  @IsNumber()
  @Min(0)
  counterPrice?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
