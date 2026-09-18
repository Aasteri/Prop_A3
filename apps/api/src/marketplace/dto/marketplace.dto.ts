import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class PublicSeekerRegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateMarketplaceJobDto {
  @IsString()
  catalogItemId!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  locationText?: string;

  @IsOptional()
  @IsString()
  addressText?: string;

  @IsOptional()
  formPayload?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}

export class AssignArtisansDto {
  @IsArray()
  @IsString({ each: true })
  artisanIds!: string[];

  @IsOptional()
  @IsString()
  note?: string;
}

export class SubmitQuoteDto {
  @IsNumber()
  @Min(0)
  workmanshipAmount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  materialsEstimate?: number;

  @IsOptional()
  @IsString()
  materialsNote?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsOptional()
  @IsString()
  message?: string;
}

export class SelectQuoteDto {
  @IsString()
  quoteId!: string;
}

export class PostChatMessageDto {
  @IsString()
  @MinLength(1)
  body!: string;
}

export class InitiateEscrowDto {
  @IsString()
  method!: 'BANK_TRANSFER_PROOF' | 'PAYSTACK';

  @IsOptional()
  @IsBoolean()
  isDeposit?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  proofUrl?: string;
}
