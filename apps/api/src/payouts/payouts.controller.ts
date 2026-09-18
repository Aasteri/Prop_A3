import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { CreatePayoutDto, PreviewPayoutDto } from './dto/payout.dto';
import { PayoutsService } from './payouts.service';

@Controller('payouts')
@UseGuards(JwtAuthGuard)
export class PayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.payouts.findAll(user);
  }

  @Post('preview')
  preview(@Body() dto: PreviewPayoutDto, @CurrentUser() user: AuthUser) {
    return this.payouts.preview(dto, user);
  }

  @Get(':id/pdf')
  async pdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const buf = await this.payouts.buildPdf(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="payout-${id}.pdf"`,
    });
    res.send(buf);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.payouts.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreatePayoutDto, @CurrentUser() user: AuthUser) {
    return this.payouts.create(dto, user);
  }

  @Patch(':id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.payouts.submit(id, user);
  }

  @Patch(':id/finance-approve')
  financeApprove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.payouts.financeApprove(id, user);
  }

  @Patch(':id/exec-approve')
  execApprove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.payouts.execApprove(id, user);
  }

  @Patch(':id/mark-paid')
  markPaid(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.payouts.markPaid(id, user);
  }
}
