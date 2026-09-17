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
import { CreateIvcDto, SignIvcDto, UpdateIvcDto } from './dto/ivc.dto';
import { IvcsService } from './ivcs.service';

@Controller('ivcs')
@UseGuards(JwtAuthGuard)
export class IvcsController {
  constructor(private readonly ivcs: IvcsService) {}

  @Get('default-stages')
  defaultStages() {
    return this.ivcs.defaultStages();
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.ivcs.findAll(user, projectId);
  }

  @Get(':id/pdf')
  async pdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const buf = await this.ivcs.buildPdf(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ivc-${id}.pdf"`,
    });
    res.send(buf);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ivcs.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateIvcDto, @CurrentUser() user: AuthUser) {
    return this.ivcs.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIvcDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ivcs.update(id, dto, user);
  }

  @Patch(':id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ivcs.submit(id, user);
  }

  @Patch(':id/sign-pm')
  signPm(
    @Param('id') id: string,
    @Body() dto: SignIvcDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ivcs.signPm(id, dto, user);
  }

  @Patch(':id/sign-supervisor')
  signSupervisor(
    @Param('id') id: string,
    @Body() dto: SignIvcDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ivcs.signSupervisor(id, dto, user);
  }

  @Patch(':id/sign-subcontractor')
  signSubcontractor(
    @Param('id') id: string,
    @Body() dto: SignIvcDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ivcs.signSubcontractor(id, dto, user);
  }
}
