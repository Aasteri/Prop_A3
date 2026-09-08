import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateMaintenanceDto,
  CreateWorkOrderDto,
  ListMaintenanceQueryDto,
  UpdateMaintenanceDto,
  UpdateWorkOrderDto,
} from './dto/maintenance.dto';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListMaintenanceQueryDto) {
    return this.maintenance.findAll(user, query);
  }

  @Patch('work-orders/:woId')
  updateWorkOrder(
    @Param('woId') woId: string,
    @Body() dto: UpdateWorkOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.maintenance.updateWorkOrder(woId, dto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.maintenance.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateMaintenanceDto, @CurrentUser() user: AuthUser) {
    return this.maintenance.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.maintenance.update(id, dto, user);
  }

  @Post(':id/work-orders')
  createWorkOrder(
    @Param('id') id: string,
    @Body() dto: CreateWorkOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.maintenance.createWorkOrder(id, dto, user);
  }
}
