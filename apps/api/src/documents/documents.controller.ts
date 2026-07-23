import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentCategory, DocumentEntityType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';
import { GenerateAllocationDto } from './dto/generate-allocation.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('entityType') entityType?: DocumentEntityType,
    @Query('entityId') entityId?: string,
    @Query('category') category?: DocumentCategory,
  ) {
    return this.documents.findAll(user, { entityType, entityId, category });
  }

  @Get(':id/versions')
  findVersions(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.documents.findVersions(id, user);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(
    @Body('entityType') entityType: DocumentEntityType,
    @Body('entityId') entityId: string,
    @Body('category') category: DocumentCategory,
    @Body('title') title: string,
    @Body('notes') notes: string | undefined,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.documents.upload(
      { entityType, entityId, category, title, notes },
      file,
      user,
    );
  }

  @Post('allocation-letter')
  generateAllocation(@Body() dto: GenerateAllocationDto, @CurrentUser() user: AuthUser) {
    return this.documents.generateAllocationLetter(dto, user);
  }
}
