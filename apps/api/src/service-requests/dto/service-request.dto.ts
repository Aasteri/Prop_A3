import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateServiceRequestDto {
  @IsString()
  tradeCode!: string;

  @IsString()
  description!: string;

  @IsString()
  component!: string;

  @IsString()
  workRequired!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  photoUrls!: string[];

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  maintenanceId?: string;
}

export class AssignArtisanDto {
  @IsString()
  artisanId!: string;
}

export class EstimateServiceRequestDto {
  @IsNumber()
  @Min(0)
  labourAmount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  materialsAmount?: number;
}

export class ConfirmServiceRequestDto {
  @IsBoolean()
  tenantSatisfied!: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  tenantRating?: number;
}
