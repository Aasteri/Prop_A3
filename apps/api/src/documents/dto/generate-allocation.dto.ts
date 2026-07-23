import { IsString, MinLength } from 'class-validator';

export class GenerateAllocationDto {
  @IsString()
  @MinLength(1)
  clientId!: string;

  @IsString()
  @MinLength(1)
  projectId!: string;
}
