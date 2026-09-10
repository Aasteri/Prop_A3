import { Module } from '@nestjs/common';
import { DepositSettlementsController } from './deposit-settlements.controller';
import { DepositSettlementsService } from './deposit-settlements.service';

@Module({
  controllers: [DepositSettlementsController],
  providers: [DepositSettlementsService],
  exports: [DepositSettlementsService],
})
export class DepositSettlementsModule {}
