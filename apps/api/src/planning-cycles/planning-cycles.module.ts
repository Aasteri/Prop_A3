import { Module } from '@nestjs/common';
import { PlanningCyclesController } from './planning-cycles.controller';
import { PlanningCyclesService } from './planning-cycles.service';

@Module({
  controllers: [PlanningCyclesController],
  providers: [PlanningCyclesService],
  exports: [PlanningCyclesService],
})
export class PlanningCyclesModule {}
