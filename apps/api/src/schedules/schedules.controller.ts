import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  BulkWorkTasksDto,
  CreateLabourScheduleDto,
  CreateWorkTaskDto,
  UpdateLabourScheduleDto,
  UpdateWorkTaskDto,
} from './dto/schedules.dto';
import { SchedulesService } from './schedules.service';

@Controller('work-tasks')
@UseGuards(JwtAuthGuard)
export class WorkTasksController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.schedules.findWorkTasks(user, projectId);
  }

  @Get('export.csv')
  @Header('Content-Type', 'text/csv')
  exportCsv(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.schedules.exportWorkTasksCsv(user, projectId);
  }

  @Post()
  create(@Body() dto: CreateWorkTaskDto, @CurrentUser() user: AuthUser) {
    return this.schedules.createWorkTask(dto, user);
  }

  @Post('bulk')
  bulk(@Body() dto: BulkWorkTasksDto, @CurrentUser() user: AuthUser) {
    return this.schedules.bulkCreateWorkTasks(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schedules.updateWorkTask(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.schedules.deleteWorkTask(id, user);
  }
}

@Controller('labour-schedules')
@UseGuards(JwtAuthGuard)
export class LabourSchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('projectId') projectId?: string) {
    return this.schedules.findLabourSchedules(user, projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.schedules.findLabourSchedule(id, user);
  }

  @Post()
  create(@Body() dto: CreateLabourScheduleDto, @CurrentUser() user: AuthUser) {
    return this.schedules.createLabourSchedule(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLabourScheduleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schedules.updateLabourSchedule(id, dto, user);
  }
}
