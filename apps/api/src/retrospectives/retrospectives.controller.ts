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
  ClientFeedbackDto,
  CreateRetrospectiveDto,
  UpdateRetrospectiveDto,
} from './dto/retrospective.dto';
import { RetrospectivesService } from './retrospectives.service';

@Controller('retrospectives')
@UseGuards(JwtAuthGuard)
export class RetrospectivesController {
  constructor(private readonly retrospectives: RetrospectivesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.retrospectives.findAll(user, projectId);
  }

  @Get(':id/pdf')
  async pdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const buf = await this.retrospectives.buildPdf(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="retrospective-${id}.pdf"`,
    });
    res.send(buf);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.retrospectives.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateRetrospectiveDto, @CurrentUser() user: AuthUser) {
    return this.retrospectives.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRetrospectiveDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.retrospectives.update(id, dto, user);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.retrospectives.publish(id, user);
  }

  @Patch(':id/client-feedback')
  clientFeedback(
    @Param('id') id: string,
    @Body() dto: ClientFeedbackDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.retrospectives.addClientFeedback(id, dto, user);
  }
}
