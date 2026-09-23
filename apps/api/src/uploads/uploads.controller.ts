import {
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  /**
   * Shared photo / PDF attachment endpoint.
   * Returns `/uploads/photos/...` paths for storage in photoUrls JSON fields.
   */
  @Post('photos')
  @UseInterceptors(FilesInterceptor('photos', 10, { storage: memoryStorage() }))
  uploadPhotos(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploads.savePhotos(files);
  }
}
