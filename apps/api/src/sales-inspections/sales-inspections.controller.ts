import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateSalesInspectionDto,
  LogInspectionResponseDto,
  UpdateSalesInspectionDto,
} from './dto/sales-inspection.dto';
import { SalesInspectionsService } from './sales-inspections.service';

@Controller('sales-inspections')
@UseGuards(JwtAuthGuard)
export class SalesInspectionsController {
  constructor(private readonly inspections: SalesInspectionsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('leadId') leadId?: string) {
    return this.inspections.findAll(user, leadId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.inspections.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreateSalesInspectionDto, @CurrentUser() user: AuthUser) {
    return this.inspections.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSalesInspectionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inspections.update(id, dto, user);
  }

  @Post(':id/response')
  logResponse(
    @Param('id') id: string,
    @Body() dto: LogInspectionResponseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inspections.logResponse(id, dto, user);
  }
}
