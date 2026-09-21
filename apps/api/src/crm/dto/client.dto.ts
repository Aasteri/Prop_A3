import { IsBoolean, IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class CreateClientDto {
  /** Link an existing Propa3 user (e.g. marketplace seeker) and upgrade them to CLIENT. */
  @IsOptional()
  @IsString()
  existingUserId?: string;

  @ValidateIf((o: CreateClientDto) => !o.existingUserId)
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ValidateIf((o: CreateClientDto) => !o.existingUserId)
  @IsString()
  @MinLength(1)
  lastName?: string;

  @ValidateIf((o: CreateClientDto) => !o.existingUserId)
  @IsString()
  @MinLength(1)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  preferences?: string;

  /** When creating manually (no existingUserId), also create a CLIENT login. */
  @IsOptional()
  @IsBoolean()
  createLogin?: boolean;

  /** Required when createLogin is true and no existingUserId. */
  @ValidateIf((o: CreateClientDto) => Boolean(o.createLogin) && !o.existingUserId)
  @IsString()
  @MinLength(8)
  password?: string;
}

export class LinkPortalUserDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
