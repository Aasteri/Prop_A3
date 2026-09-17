import { Module } from '@nestjs/common';
import { LegalTemplatesModule } from '../legal-templates/legal-templates.module';
import { TenanciesController } from './tenancies.controller';
import { TenanciesService } from './tenancies.service';
import { TenancyRenewalCronService } from './tenancy-renewal-cron.service';

@Module({
  imports: [LegalTemplatesModule],
  controllers: [TenanciesController],
  providers: [TenanciesService, TenancyRenewalCronService],
  exports: [TenanciesService],
})
export class TenanciesModule {}
