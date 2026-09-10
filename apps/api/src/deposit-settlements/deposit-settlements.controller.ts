import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateDepositSettlementDto,
  UpdateDepositSettlementDto,
} from './dto/deposit-settlement.dto';
import { DepositSettlementsService } from './deposit-settlements.service';

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

  @Patch(':id/close')
  close(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.settlements.close(id, user);
  }
}
