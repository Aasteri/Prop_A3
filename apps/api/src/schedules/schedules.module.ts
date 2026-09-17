import { Module } from '@nestjs/common';
import {
  LabourSchedulesController,
  WorkTasksController,
} from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  controllers: [WorkTasksController, LabourSchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
