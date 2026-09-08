import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ServiceChargeCreditDto, ServiceChargeDebitDto } from './dto/service-charge.dto';
import { ServiceChargesService } from './service-charges.service';

@Controller('service-charges')
@UseGuards(JwtAuthGuard)
export class ServiceChargesController {
  constructor(private readonly serviceCharges: ServiceChargesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.serviceCharges.listAccounts(user);
  }

  @Get('property/:propertyId')
  getByProperty(@Param('propertyId') propertyId: string, @CurrentUser() user: AuthUser) {
    return this.serviceCharges.getByProperty(propertyId, user);
  }

  @Post('property/:propertyId/credit')
  credit(
    @Param('propertyId') propertyId: string,
    @Body() dto: ServiceChargeCreditDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceCharges.credit(propertyId, dto, user);
  }

  @Post('property/:propertyId/debit')
  debit(
    @Param('propertyId') propertyId: string,
    @Body() dto: ServiceChargeDebitDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceCharges.debit(propertyId, dto, user);
  }
}
