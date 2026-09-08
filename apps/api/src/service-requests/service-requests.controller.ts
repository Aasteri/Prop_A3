import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  AssignArtisanDto,
  ConfirmServiceRequestDto,
  CreateServiceRequestDto,
  EstimateServiceRequestDto,
} from './dto/service-request.dto';
import { ServiceRequestsService } from './service-requests.service';

@Controller('service-requests')
@UseGuards(JwtAuthGuard)
export class ServiceRequestsController {
  constructor(private readonly serviceRequests: ServiceRequestsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.serviceRequests.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.serviceRequests.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateServiceRequestDto, @CurrentUser() user: AuthUser) {
    return this.serviceRequests.create(dto, user);
  }

  @Patch(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignArtisanDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceRequests.assign(id, dto, user);
  }

  @Patch(':id/estimate')
  estimate(
    @Param('id') id: string,
    @Body() dto: EstimateServiceRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceRequests.estimate(id, dto, user);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.serviceRequests.approve(id, user);
  }

  @Patch(':id/start')
  start(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.serviceRequests.start(id, user);
  }

  @Patch(':id/confirm')
  confirm(
    @Param('id') id: string,
    @Body() dto: ConfirmServiceRequestDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceRequests.confirm(id, dto, user);
  }
}
