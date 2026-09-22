import { Module } from '@nestjs/common';
import { FeasibilityController } from './feasibility.controller';
import { FeasibilityService } from './feasibility.service';

@Module({
  controllers: [FeasibilityController],
  providers: [FeasibilityService],
  exports: [FeasibilityService],
})
export class FeasibilityModule {}
