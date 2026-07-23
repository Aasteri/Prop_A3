import { Module } from '@nestjs/common';
import { SiteTrackerController } from './site-tracker.controller';
import { SiteTrackerService } from './site-tracker.service';
import { SiteTrackerCronService } from './site-tracker-cron.service';
import { HseModule } from '../hse/hse.module';

@Module({
  imports: [HseModule],
  controllers: [SiteTrackerController],
  providers: [SiteTrackerService, SiteTrackerCronService],
})
export class SiteTrackerModule {}
