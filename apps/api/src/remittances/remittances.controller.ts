import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { CreateRemittanceDto, MarkRemittancePaidDto } from './dto/remittance.dto';
import { RemittancesService } from './remittances.service';

@Controller('remittances')
@UseGuards(JwtAuthGuard)
export class RemittancesController {
  constructor(private readonly remittances: RemittancesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.remittances.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.remittances.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateRemittanceDto, @CurrentUser() user: AuthUser) {
    return this.remittances.create(dto, user);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.remittances.approve(id, user);
  }

  @Patch(':id/paid')
  markPaid(
    @Param('id') id: string,
    @Body() dto: MarkRemittancePaidDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.remittances.markPaid(id, dto, user);
  }
}
