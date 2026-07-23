import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateDailyLogDto,
  RejectDailyLogDto,
  SubmitDailyLogDto,
  UpdateDailyLogDto,
} from './dto/daily-log.dto';
import { SiteTrackerService } from './site-tracker.service';

@Controller('site-tracker/logs')
@UseGuards(JwtAuthGuard)
export class SiteTrackerController {
  constructor(private readonly tracker: SiteTrackerService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.tracker.findAll(user);
  }

  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @CurrentUser() user: AuthUser, @Res() res: Response) {
    const file = await this.tracker.exportPdf(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="site-log-${id}.pdf"`,
    });
    file.getStream().pipe(res);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tracker.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateDailyLogDto, @CurrentUser() user: AuthUser) {
    return this.tracker.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDailyLogDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tracker.update(id, dto, user);
  }

  @Post(':id/photos')
  @UseInterceptors(FilesInterceptor('photos', 10, { storage: memoryStorage() }))
  uploadPhotos(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('section') section: string | undefined,
    @Body('lat') lat: string | undefined,
    @Body('lng') lng: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tracker.uploadPhotos(
      id,
      files ?? [],
      section,
      lat ? parseFloat(lat) : undefined,
      lng ? parseFloat(lng) : undefined,
      user,
    );
  }

  @Post(':id/submit')
  submit(
    @Param('id') id: string,
    @Body() dto: SubmitDailyLogDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tracker.submit(id, dto, user);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tracker.approve(id, user);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectDailyLogDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tracker.reject(id, dto, user);
  }
}
