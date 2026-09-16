import { Module } from '@nestjs/common';
import { PmEngagementsModule } from '../pm-engagements/pm-engagements.module';
import { TenantApplicationsController } from './tenant-applications.controller';
import { TenantApplicationsService } from './tenant-applications.service';

@Module({
  imports: [PmEngagementsModule],
  controllers: [TenantApplicationsController],
  providers: [TenantApplicationsService],
})
export class TenantApplicationsModule {}
