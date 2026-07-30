import { Module } from '@nestjs/common';
import { ComplianceCronService } from './compliance-cron.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { WeeklyReportCronService } from './weekly-report-cron.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, ComplianceCronService, WeeklyReportCronService],
})
export class DashboardModule {}
