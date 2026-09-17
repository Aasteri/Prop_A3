import { Module } from '@nestjs/common';
import { MoneyInflowsModule } from '../money-inflows/money-inflows.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [MoneyInflowsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
