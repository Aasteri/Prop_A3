import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { CreateLeadDto, UpdateLeadDto, UpdateLeadStageDto } from './dto/lead.dto';
import { CrmService } from './crm.service';

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @Get('pipeline')
  pipeline(@CurrentUser() user: AuthUser) {
    return this.crm.pipeline(user);
  }

  @Get('pipeline/meta')
  pipelineMeta(@CurrentUser() user: AuthUser) {
    return this.crm.pipelineMeta(user);
  }

  @Get('clients')
  listClients(@CurrentUser() user: AuthUser) {
    return this.crm.listClients(user);
  }

  @Get('leads')
  findAll(@CurrentUser() user: AuthUser, @Query('stage') stage?: LeadStage) {
    return this.crm.findAll(user, stage);
  }

  @Get('leads/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.crm.findOne(id, user);
  }

  @Post('leads')
  create(@Body() dto: CreateLeadDto, @CurrentUser() user: AuthUser) {
    return this.crm.createLead(dto, user);
  }

  @Patch('leads/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.crm.updateLead(id, dto, user);
  }

  @Post('leads/:id/stage')
  updateStage(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.crm.updateStage(id, dto, user);
  }

  @Post('leads/:id/convert')
  convert(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.crm.convertToClient(id, user);
  }
}
