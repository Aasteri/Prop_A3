import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { EarnerType } from '@prisma/client';

export class AttributionLineDto {
  @IsEnum(EarnerType)
  earnerType!: EarnerType;

  @IsOptional()
  @IsString()
  earnerUserId?: string;

  @IsOptional()
  @IsString()
  earnerName?: string;

  @IsOptional()
  @IsString()
  earnerRef?: string;

  @IsOptional()
  @IsNumber()
  sharePct?: number;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PatchAttributionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttributionLineDto)
  attributions!: AttributionLineDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
