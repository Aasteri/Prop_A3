import { Module } from '@nestjs/common';
import { SalesOffersController } from './sales-offers.controller';
import { SalesOffersService } from './sales-offers.service';

@Module({
  controllers: [SalesOffersController],
  providers: [SalesOffersService],
  exports: [SalesOffersService],
})
export class SalesOffersModule {}
