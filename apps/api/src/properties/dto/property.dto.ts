import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  DensityBand,
  PropertyCategory,
  PropertyOccupancyKind,
  TitleDocumentType,
} from '@prisma/client';

export class CreatePropertyDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  name!: string;

  @IsString()
  address!: string;

  @IsOptional()
  @IsEnum(PropertyCategory)
  category?: PropertyCategory;

  @IsOptional()
  @IsEnum(PropertyOccupancyKind)
  occupancyKind?: PropertyOccupancyKind;

  @IsOptional()
  @IsEnum(TitleDocumentType)
  titleType?: TitleDocumentType;

  @IsOptional()
  @IsEnum(DensityBand)
  density?: DensityBand;

  @IsOptional()
  @IsString()
  estateName?: string;

  @IsOptional()
  @IsString()
  neighbourhood?: string;

  @IsOptional()
  @IsString()
  landlordName?: string;

  @IsOptional()
  @IsString()
  landlordPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  unitCode?: string;

  @IsOptional()
  @IsString()
  unitType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;
}

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(PropertyCategory)
  category?: PropertyCategory;

  @IsOptional()
  @IsEnum(PropertyOccupancyKind)
  occupancyKind?: PropertyOccupancyKind;

  @IsOptional()
  @IsEnum(TitleDocumentType)
  titleType?: TitleDocumentType;

  @IsOptional()
  @IsEnum(DensityBand)
  density?: DensityBand;

  @IsOptional()
  @IsString()
  estateName?: string;

  @IsOptional()
  @IsString()
  neighbourhood?: string;

  @IsOptional()
  @IsString()
  landlordName?: string;

  @IsOptional()
  @IsString()
  landlordPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ListPropertiesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PropertyCategory)
  category?: PropertyCategory;
}
