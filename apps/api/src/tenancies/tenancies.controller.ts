import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateTenancyDto,
  ListTenanciesQueryDto,
  UpdateTenancyDto,
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
}
