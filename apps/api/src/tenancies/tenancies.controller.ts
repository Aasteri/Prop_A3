import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateTenancyDto,
  ListTenanciesQueryDto,
  UpdateTenancyDto,
  ActivateMoveInDto,
} from './dto/tenancy.dto';
import { TenanciesService } from './tenancies.service';

@Controller('tenancies')
@UseGuards(JwtAuthGuard)
export class TenanciesController {
  constructor(private readonly tenancies: TenanciesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListTenanciesQueryDto) {
    return this.tenancies.findAll(user, query);
  }

  @Get('renewals/due')
  renewalsDue(@CurrentUser() user: AuthUser) {
    return this.tenancies.listRenewalDue(user);
  }

  @Post('renewals/scan')
  scanRenewals(@CurrentUser() user: AuthUser) {
    // Manual trigger for staff / ops
    void user;
    return this.tenancies.processRenewalReminders();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tenancies.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateTenancyDto, @CurrentUser() user: AuthUser) {
    return this.tenancies.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTenancyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tenancies.update(id, dto, user);
  }

  @Post(':id/activate-move-in')
  activateMoveIn(
    @Param('id') id: string,
    @Body() dto: ActivateMoveInDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tenancies.activateMoveIn(id, dto, user);
  }
}
