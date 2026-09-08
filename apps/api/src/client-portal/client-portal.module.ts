import { Module } from '@nestjs/common';
import { ClientPortalController } from './client-portal.controller';
import { ClientPortalService } from './client-portal.service';
import { DocumentsModule } from '../documents/documents.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';

@Module({
  imports: [DocumentsModule, MaintenanceModule],
  controllers: [ClientPortalController],
  providers: [ClientPortalService],
})
export class ClientPortalModule {}