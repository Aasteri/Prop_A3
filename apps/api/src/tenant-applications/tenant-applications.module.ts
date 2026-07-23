import { Module } from '@nestjs/common';
import { TenantApplicationsController } from './tenant-applications.controller';
import { TenantApplicationsService } from './tenant-applications.service';

@Module({
  controllers: [TenantApplicationsController],
  providers: [TenantApplicationsService],
})
export class TenantApplicationsModule {}
