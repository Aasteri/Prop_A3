import { Module } from '@nestjs/common';
import { MoneyInflowsModule } from '../money-inflows/money-inflows.module';
import { PaystackController } from './paystack.controller';

@Module({
  imports: [MoneyInflowsModule],
  controllers: [PaystackController],
})
export class PaystackModule {}
