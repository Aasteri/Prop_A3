import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly pub: PublicService) {}

  @Get('company')
  company() {
    return this.pub.companyInfo();
  }

  @Get('listings')
  listings(@Query('search') search?: string) {
    return this.pub.listListings(search);
  }

  @Get('listings/:id')
  listing(@Param('id') id: string) {
    return this.pub.getListing(id);
  }

  @Get('projects')
  projects() {
    return this.pub.listProjects();
  }
}
