import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { PatchAttributionsDto } from './dto/money-inflow.dto';
import { MoneyInflowsService } from './money-inflows.service';

@Controller('money-inflows')
@UseGuards(JwtAuthGuard)
export class MoneyInflowsController {
  constructor(private readonly moneyInflows: MoneyInflowsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.moneyInflows.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.moneyInflows.findOne(id, user);
  }

  @Patch(':id/attributions')
  patchAttributions(
    @Param('id') id: string,
    @Body() dto: PatchAttributionsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.moneyInflows.patchAttributions(id, dto, user);
  }
}
