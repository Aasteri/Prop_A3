import { Module } from '@nestjs/common';
import { MoneyInflowsController } from './money-inflows.controller';
import { MoneyInflowsService } from './money-inflows.service';

@Module({
  controllers: [MoneyInflowsController],
  providers: [MoneyInflowsService],
  exports: [MoneyInflowsService],
})
export class MoneyInflowsModule {}
