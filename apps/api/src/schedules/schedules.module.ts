import { Module } from '@nestjs/common';
import {
  LabourSchedulesController,
  PlantEquipmentSchedulesController,
  WorkTasksController,
} from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  controllers: [
    WorkTasksController,
    LabourSchedulesController,
    PlantEquipmentSchedulesController,
  ],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
