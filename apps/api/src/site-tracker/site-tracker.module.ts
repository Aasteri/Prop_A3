import { Module } from '@nestjs/common';
import { SiteTrackerController } from './site-tracker.controller';
import { SiteTrackerService } from './site-tracker.service';

@Module({
  controllers: [SiteTrackerController],
  providers: [SiteTrackerService],
})
export class SiteTrackerModule {}
