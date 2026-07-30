import { Module } from '@nestjs/common';
import { ComplianceCronService } from './compliance-cron.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, ComplianceCronService],
})
export class DashboardModule {}
