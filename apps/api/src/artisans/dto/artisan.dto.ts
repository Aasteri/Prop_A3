import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ArtisanApprovalStatus, ArtisanSource } from '@prisma/client';

export class CreateArtisanDto {
  @IsString()
  fullName!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  altPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;

  @IsOptional()
  @IsString()
  nin?: string;

  @IsOptional()
  @IsString()
  cacNumber?: string;

  @IsOptional()
  @IsString()
  guarantorName?: string;

  @IsOptional()
  @IsString()
  guarantorPhone?: string;

  @IsOptional()
  @IsString()
  guarantorAddress?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  kycDocumentUrls?: string[];

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trades?: string[];

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  serviceAreas?: string;

  @IsOptional()
  @IsEnum(ArtisanSource)
  source?: ArtisanSource;

  /** When true (admin add), create login + APPROVED immediately. */
  @IsOptional()
  @IsBoolean()
  createLogin?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsEnum(ArtisanApprovalStatus)
  status?: ArtisanApprovalStatus;
}

/** Public artisan signup — always EXTERNAL + PENDING_REVIEW. */
export class PublicArtisanApplyDto {
  @IsString()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trades?: string[];

  @IsOptional()
  @IsString()
  serviceAreas?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  nin?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;
}

export class UpdateArtisanStatusDto {
  @IsEnum(ArtisanApprovalStatus)
  status!: ArtisanApprovalStatus;
}

export class UpdateArtisanLocationDto {
  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;
}

export class ListArtisansQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ArtisanApprovalStatus)
  status?: ArtisanApprovalStatus;

  @IsOptional()
  @IsString()
  trade?: string;

  @IsOptional()
  @IsEnum(ArtisanSource)
  source?: ArtisanSource;
}
