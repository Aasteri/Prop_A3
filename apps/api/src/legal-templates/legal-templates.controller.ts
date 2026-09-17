import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LegalTemplatesService } from './legal-templates.service';

@Controller('legal-templates')
@UseGuards(JwtAuthGuard)
export class LegalTemplatesController {
  constructor(private readonly templates: LegalTemplatesService) {}

  @Get()
  list() {
    return this.templates.list();
  }

  @Get(':key')
  get(@Param('key') key: string) {
    return this.templates.getMarkdown(key);
  }
}
