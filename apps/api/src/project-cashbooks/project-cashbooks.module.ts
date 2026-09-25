import { Module } from '@nestjs/common';
import { ProjectCashbooksController } from './project-cashbooks.controller';
import { ProjectCashbooksService } from './project-cashbooks.service';

@Module({
  controllers: [ProjectCashbooksController],
  providers: [ProjectCashbooksService],
  exports: [ProjectCashbooksService],
})
export class ProjectCashbooksModule {}
