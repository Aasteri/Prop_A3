import { IsDateString, IsOptional, IsString } from 'class-validator';

export class PreviewPayoutDto {
  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;
}

export class CreatePayoutDto {
  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
