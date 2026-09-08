import { Module } from '@nestjs/common';
import { TenanciesController } from './tenancies.controller';
import { TenanciesService } from './tenancies.service';
import { TenancyRenewalCronService } from './tenancy-renewal-cron.service';

@Module({
  controllers: [TenanciesController],
  providers: [TenanciesService, TenancyRenewalCronService],
  exports: [TenanciesService],
})
export class TenanciesModule {}
