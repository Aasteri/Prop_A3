import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { InquiriesPublicController } from './inquiries-public.controller';
import { CrmService } from './crm.service';

@Module({
  controllers: [CrmController, InquiriesPublicController],
  providers: [CrmService],
})
export class CrmModule {}
