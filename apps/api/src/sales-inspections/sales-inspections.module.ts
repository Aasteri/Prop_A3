import { Module } from '@nestjs/common';
import { SalesInspectionsController } from './sales-inspections.controller';
import { SalesInspectionsService } from './sales-inspections.service';

@Module({
  controllers: [SalesInspectionsController],
  providers: [SalesInspectionsService],
  exports: [SalesInspectionsService],
})
export class SalesInspectionsModule {}
