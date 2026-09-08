import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateArtisanDto {
  @IsString()
  fullName!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
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

  @IsString()
  guarantorName!: string;

  @IsString()
  guarantorPhone!: string;

  @IsOptional()
  @IsString()
  guarantorAddress?: string;

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
}

export class UpdateArtisanStatusDto {
  @IsString()
  status!: string;
}

export class ListArtisansQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  trade?: string;
}
