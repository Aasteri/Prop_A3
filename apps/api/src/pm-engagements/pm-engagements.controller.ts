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
  CreatePmEngagementDto,
  UpdatePmEngagementDto,
} from './dto/pm-engagement.dto';
import { PmEngagementsService } from './pm-engagements.service';

@Controller('pm-engagements')
@UseGuards(JwtAuthGuard)
export class PmEngagementsController {
  constructor(private readonly engagements: PmEngagementsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.engagements.findAll(user);
  }

  @Get('schedule')
  schedule(
    @CurrentUser() user: AuthUser,
    @Query('propertyId') propertyId?: string,
  ) {
    return this.engagements.resolveSchedule(user, propertyId);
  }

  @Get(':id/pdf')
  async pdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const buf = await this.engagements.buildPdf(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="pm-engagement-${id}.pdf"`,
    });
    res.send(buf);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.engagements.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreatePmEngagementDto, @CurrentUser() user: AuthUser) {
    return this.engagements.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePmEngagementDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.engagements.update(id, dto, user);
  }
}
