import { Module } from '@nestjs/common';
import { SalesInspectionsModule } from '../sales-inspections/sales-inspections.module';
import { CrmController } from './crm.controller';
import { InquiriesPublicController } from './inquiries-public.controller';
import { CrmService } from './crm.service';

@Module({
  imports: [SalesInspectionsModule],
  controllers: [CrmController, InquiriesPublicController],
  providers: [CrmService],
})
export class CrmModule {}
