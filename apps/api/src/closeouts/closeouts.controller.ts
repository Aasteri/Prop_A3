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
  AcknowledgeCloseoutDto,
  CreateCloseoutDto,
  UpdateCloseoutDto,
} from './dto/closeout.dto';
import { CloseoutsService } from './closeouts.service';

@Controller('closeouts')
@UseGuards(JwtAuthGuard)
export class CloseoutsController {
  constructor(private readonly closeouts: CloseoutsService) {}

  @Get('template-zones')
  templateZones() {
    return this.closeouts.templateZones();
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.closeouts.findAll(user, projectId);
  }

  @Get(':id/pdf')
  async pdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const buf = await this.closeouts.buildPdf(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="closeout-${id}.pdf"`,
    });
    res.send(buf);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.closeouts.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateCloseoutDto, @CurrentUser() user: AuthUser) {
    return this.closeouts.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCloseoutDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.closeouts.update(id, dto, user);
  }

  @Patch(':id/issue')
  issue(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.closeouts.issue(id, user);
  }

  @Patch(':id/acknowledge')
  acknowledge(
    @Param('id') id: string,
    @Body() dto: AcknowledgeCloseoutDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.closeouts.acknowledge(id, dto, user);
  }
}
