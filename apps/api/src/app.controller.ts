import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      name: 'Propa3 API',
      company: 'Triple A Realty Projects Ltd',
      docs: '/api/health',
    };
  }
}
