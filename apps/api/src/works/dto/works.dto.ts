import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWorksContractDto {
  @IsString()
  projectId!: string;

  @IsString()
  subcontractorName!: string;

  @IsOptional()
  @IsString()
  subcontractorPhone?: string;

  @IsString()
  scopeSummary!: string;

  @IsNumber()
  @Min(0)
  contractSum!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mobilisationPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  retentionPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  platformFeePct?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  completionDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateWorksStatusDto {
  @IsString()
  status!: string;
}
