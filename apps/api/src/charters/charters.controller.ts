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
  CreateCharterDto,
  CreateKickoffDto,
  SignCharterDto,
  UpdateCharterDto,
} from './dto/charter.dto';
import { ChartersService } from './charters.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChartersController {
  constructor(private readonly charters: ChartersService) {}

  @Get('charters')
  listCharters(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.charters.findCharters(user, projectId);
  }

  @Get('charters/:id/pdf')
  async charterPdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const buf = await this.charters.buildCharterPdf(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="charter-${id}.pdf"`,
    });
    res.send(buf);
  }

  @Get('charters/:id')
  getCharter(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.charters.findCharter(id, user);
  }

  @Post('charters')
  createCharter(@Body() dto: CreateCharterDto, @CurrentUser() user: AuthUser) {
    return this.charters.createCharter(dto, user);
  }

  @Patch('charters/:id')
  updateCharter(
    @Param('id') id: string,
    @Body() dto: UpdateCharterDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.charters.updateCharter(id, dto, user);
  }

  @Patch('charters/:id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.charters.submitForReview(id, user);
  }

  @Patch('charters/:id/sign-company')
  signCompany(
    @Param('id') id: string,
    @Body() dto: SignCharterDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.charters.signCompany(id, dto, user);
  }

  @Patch('charters/:id/sign-client')
  signClient(
    @Param('id') id: string,
    @Body() dto: SignCharterDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.charters.signClient(id, dto, user);
  }

  @Get('kickoffs/default-agenda')
  defaultAgenda() {
    return this.charters.defaultAgenda();
  }

  @Get('kickoffs')
  listKickoffs(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.charters.findKickoffs(user, projectId);
  }

  @Get('kickoffs/:id/pdf')
  async kickoffPdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const buf = await this.charters.buildKickoffPdf(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="kickoff-${id}.pdf"`,
    });
    res.send(buf);
  }

  @Get('kickoffs/:id')
  getKickoff(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.charters.findKickoff(id, user);
  }

  @Post('kickoffs')
  createKickoff(@Body() dto: CreateKickoffDto, @CurrentUser() user: AuthUser) {
    return this.charters.createKickoff(dto, user);
  }

  @Patch('kickoffs/:id/publish')
  publishKickoff(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.charters.publishKickoff(id, user);
  }
}
