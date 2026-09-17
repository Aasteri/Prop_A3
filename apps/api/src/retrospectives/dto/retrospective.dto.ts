import {
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RetrospectiveActionDto {
  @IsString()
  action!: string;

  @IsOptional()
  @IsIn(['tool', 'process', 'team'])
  type?: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsString()
  links?: string;
}

export class RetrospectiveTimelineDto {
  @IsString()
  dateAchieved!: string;

  @IsString()
  milestone!: string;
}

export class CreateRetrospectiveDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsDateString()
  heldAt?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  collaborators?: string;

  @IsString()
  projectSummary!: string;

  @IsOptional()
  @IsString()
  projectStatusNote?: string;

  @IsOptional()
  @IsString()
  goalsObjectives?: string;

  @IsOptional()
  @IsString()
  durationNote?: string;

  @IsOptional()
  @IsString()
  teamNote?: string;

  @IsOptional()
  @IsString()
  docsLink?: string;

  @IsOptional()
  @IsString()
  methodology?: string;

  @IsOptional()
  @IsString()
  resources?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  wentWell?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  improvements?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lucky?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RetrospectiveActionDto)
  actions?: RetrospectiveActionDto[];

  @IsOptional()
  @IsString()
  nextSteps?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RetrospectiveTimelineDto)
  timeline?: RetrospectiveTimelineDto[];

  @IsOptional()
  @IsString()
  clientTestimonial?: string;

  @IsOptional()
  @IsString()
  preparedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRetrospectiveDto {
  @IsOptional()
  @IsDateString()
  heldAt?: string;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  collaborators?: string;

  @IsOptional()
  @IsString()
  projectSummary?: string;

  @IsOptional()
  @IsString()
  projectStatusNote?: string;

  @IsOptional()
  @IsString()
  goalsObjectives?: string;

  @IsOptional()
  @IsString()
  durationNote?: string;

  @IsOptional()
  @IsString()
  teamNote?: string;

  @IsOptional()
  @IsString()
  docsLink?: string;

  @IsOptional()
  @IsString()
  methodology?: string;

  @IsOptional()
  @IsString()
  resources?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  wentWell?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  improvements?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lucky?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RetrospectiveActionDto)
  actions?: RetrospectiveActionDto[];

  @IsOptional()
  @IsString()
  nextSteps?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RetrospectiveTimelineDto)
  timeline?: RetrospectiveTimelineDto[];

  @IsOptional()
  @IsString()
  clientTestimonial?: string;

  @IsOptional()
  @IsString()
  preparedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ClientFeedbackDto {
  @IsString()
  testimonial!: string;

  @IsOptional()
  @IsString()
  feedbackBy?: string;
}
