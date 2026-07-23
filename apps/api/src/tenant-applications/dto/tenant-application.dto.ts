import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTenantApplicationDto {
  @IsString()
  estateId!: string;

  @IsOptional()
  @IsString()
  terrierRowId?: string;

  @IsString()
  surname!: string;

  @IsString()
  otherNames!: string;

  @IsString()
  nationality!: string;

  @IsString()
  stateOfOrigin!: string;

  @IsString()
  maritalStatus!: string;

  @IsString()
  phone!: string;

  @IsString()
  formerAddress!: string;

  @IsString()
  vacateReason!: string;

  @IsString()
  permanentAddress!: string;

  @IsString()
  occupation!: string;

  @IsString()
  officeAddress!: string;

  @IsString()
  propertyTypeAccepted!: string;

  @IsNumber()
  @Min(0)
  rentAccepted!: number;

  @IsString()
  rentPayer!: string;

  @IsString()
  nextOfKinName!: string;

  @IsString()
  nextOfKinPhone!: string;

  @IsString()
  nextOfKinAddress!: string;

  @IsString()
  nextOfKinRelationship!: string;

  @IsString()
  guarantorName!: string;

  @IsString()
  guarantorWorkAddress!: string;

  @IsString()
  guarantorPhone!: string;

  @IsOptional()
  @IsString()
  guarantorSignature?: string;

  @IsOptional()
  @IsDateString()
  inspectionDate?: string;

  @IsOptional()
  @IsString()
  applicantSignature?: string;

  @IsBoolean()
  clause1Accepted!: boolean;

  @IsBoolean()
  clause2Accepted!: boolean;
}

export class UpdateTenantApplicationDto extends CreateTenantApplicationDto {}

export class RejectTenantApplicationDto {
  @IsString()
  rejectReason!: string;
}

export class SubmitTenantApplicationDto {
  @IsOptional()
  @IsString()
  applicantSignature?: string;

  @IsOptional()
  @IsString()
  guarantorSignature?: string;
}
