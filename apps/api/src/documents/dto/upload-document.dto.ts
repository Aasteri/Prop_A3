import { DocumentCategory, DocumentEntityType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UploadDocumentDto {
  @IsEnum(DocumentEntityType)
  entityType!: DocumentEntityType;

  @IsString()
  @MinLength(1)
  entityId!: string;

  @IsEnum(DocumentCategory)
  category!: DocumentCategory;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
