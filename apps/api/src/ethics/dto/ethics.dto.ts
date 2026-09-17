import { IsOptional, IsString } from 'class-validator';

export class AcknowledgeEthicsDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
