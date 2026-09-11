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
  CreateDepositSettlementDto,
  UpdateDepositSettlementDto,
} from './dto/deposit-settlement.dto';
import { DepositSettlementsService } from './deposit-settlements.service';
import { IsOptional, IsString } from 'class-validator';

class MarkRefundPaidDto {
  @IsOptional()
  @IsString()
  refundReference?: string;
}

@Controller('deposit-settlements')
@UseGuards(JwtAuthGuard)
export class DepositSettlementsController {
  constructor(private readonly settlements: DepositSettlementsService) {}

  @Get('preview')
  preview(
    @CurrentUser() user: AuthUser,
    @Query('tenancyId') tenancyId: string,
    @Query('moveOutInventoryId') moveOutInventoryId?: string,
  ) {
    return this.settlements.preview(tenancyId, user, moveOutInventoryId);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('tenancyId') tenancyId: string) {
    return this.settlements.findByTenancy(tenancyId, user);
  }

  @Get(':id/pdf')
  async pdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const buf = await this.settlements.buildPdf(id, user);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="deposit-${id}.pdf"`,
    });
    res.send(buf);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.settlements.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateDepositSettlementDto, @CurrentUser() user: AuthUser) {
    return this.settlements.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDepositSettlementDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.settlements.update(id, dto, user);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.settlements.approve(id, user);
  }

  @Post(':id/shortfall-invoice')
  shortfallInvoice(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.settlements.createShortfallInvoice(id, user);
  }

  @Patch(':id/refund-paid')
  refundPaid(
    @Param('id') id: string,
    @Body() dto: MarkRefundPaidDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.settlements.markRefundPaid(id, dto, user);
  }

  @Patch(':id/close')
  close(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.settlements.close(id, user);
  }
}
