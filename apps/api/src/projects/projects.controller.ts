import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProjectProcessGroup } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.projects.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.projects.findOne(id, user);
  }

  @Patch(':id/process-group')
  setProcessGroup(
    @Param('id') id: string,
    @Body() body: { processGroup?: ProjectProcessGroup },
    @CurrentUser() user: AuthUser,
  ) {
    if (!body?.processGroup) {
      throw new BadRequestException('processGroup is required');
    }
    return this.projects.setProcessGroup(id, body.processGroup, user);
  }

  @Post(':id/fcda-permit')
  @UseInterceptors(FileInterceptor('permit', { storage: memoryStorage() }))
  uploadFcdaPermit(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projects.uploadFcdaPermit(id, file, user);
  }
}
