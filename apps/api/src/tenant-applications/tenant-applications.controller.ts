import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateTenantApplicationDto,
  RejectTenantApplicationDto,
  SubmitTenantApplicationDto,
  UpdateTenantApplicationDto,
} from './dto/tenant-application.dto';
import { TenantApplicationsService } from './tenant-applications.service';
import { CLAUSE_1, CLAUSE_2 } from './tenant-applications.utils';

@Controller('tenant-applications')
@UseGuards(JwtAuthGuard)
export class TenantApplicationsController {
  constructor(private readonly applications: TenantApplicationsService) {}

  @Get('clauses')
  clauses() {
    return { clause1: CLAUSE_1, clause2: CLAUSE_2 };
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('estateId') estateId?: string) {
    return this.applications.findAll(user, estateId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.applications.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateTenantApplicationDto, @CurrentUser() user: AuthUser) {
    return this.applications.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantApplicationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applications.update(id, dto, user);
  }

  @Post(':id/submit')
  submit(
    @Param('id') id: string,
    @Body() dto: SubmitTenantApplicationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applications.submit(id, dto, user);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.applications.approve(id, user);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectTenantApplicationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.applications.reject(id, dto, user);
  }
}
