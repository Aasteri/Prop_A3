import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ListingFinish, ListingStatus, ListingType } from '@prisma/client';

export class CreateListingDto {
  @IsOptional()
  @IsString()
  listingRef?: string;

  @IsString()
  location!: string;

  @IsString()
  propertyType!: string;

  @IsEnum(ListingFinish)
  finish!: ListingFinish;

  @IsString()
  paymentPlan!: string;

  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceNgn?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceOutrightNgn?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price6mNgn?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price12mNgn?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price18mNgn?: number;

  @IsOptional()
  @IsString()
  sourceDocument?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateListingDto extends CreateListingDto {}

export class ListListingsQueryDto {
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  finish?: ListingFinish;

  @IsOptional()
  @IsString()
  search?: string;
}
