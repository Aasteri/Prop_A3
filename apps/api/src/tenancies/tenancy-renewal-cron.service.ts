import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TenanciesService } from './tenancies.service';

@Injectable()
export class TenancyRenewalCronService {
  private readonly logger = new Logger(TenancyRenewalCronService.name);

  constructor(private readonly tenancies: TenanciesService) {}

  @Cron('0 8 * * *')
  async dailyRenewalScan() {
    this.logger.log('Running tenancy renewal reminder scan');
    await this.tenancies.processRenewalReminders();
  }
}
