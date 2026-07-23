import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateMilestoneProgressDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPct!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CertifyMilestoneDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
