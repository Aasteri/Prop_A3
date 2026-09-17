import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateProgressReportDto,
  UpdateProgressReportDto,
} from './dto/progress-report.dto';
import { ProgressReportsService } from './progress-reports.service';

@Controller('progress-reports')
@UseGuards(JwtAuthGuard)
export class ProgressReportsController {
  constructor(private readonly progressReports: ProgressReportsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.progressReports.findAll(user, projectId);
  }

  @Get(':id/pdf')
  async pdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const buf = await this.progressReports.buildPdf(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="progress-report-${id}.pdf"`,
    });
    res.send(buf);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.progressReports.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateProgressReportDto, @CurrentUser() user: AuthUser) {
    return this.progressReports.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProgressReportDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.progressReports.update(id, dto, user);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.progressReports.publish(id, user);
  }
}
