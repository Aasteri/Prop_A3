import { Body, Controller, Post } from '@nestjs/common';
import { PublicInquiryDto } from './dto/lead.dto';
import { CrmService } from './crm.service';

@Controller('inquiries')
export class InquiriesPublicController {
  constructor(private readonly crm: CrmService) {}

  @Post()
  create(@Body() dto: PublicInquiryDto) {
    return this.crm.createPublicInquiry(dto);
  }
}
