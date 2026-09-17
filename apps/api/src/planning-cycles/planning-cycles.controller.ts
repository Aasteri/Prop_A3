import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlanningCycleKind } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreatePlanningCycleDto,
  UpdatePlanningCycleDto,
} from './dto/planning-cycle.dto';
import { PlanningCyclesService } from './planning-cycles.service';

@Controller('planning-cycles')
@UseGuards(JwtAuthGuard)
export class PlanningCyclesController {
  constructor(private readonly planningCycles: PlanningCyclesService) {}

  @Get('templates')
  templates(@CurrentUser() user: AuthUser) {
    return this.planningCycles.getTemplates(user);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('projectId') projectId?: string,
    @Query('kind') kind?: PlanningCycleKind,
  ) {
    return this.planningCycles.findAll(user, projectId, kind);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.planningCycles.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreatePlanningCycleDto, @CurrentUser() user: AuthUser) {
    return this.planningCycles.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlanningCycleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.planningCycles.update(id, dto, user);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.planningCycles.complete(id, user);
  }
}
