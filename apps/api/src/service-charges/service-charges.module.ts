import { Module } from '@nestjs/common';
import { ServiceChargesController } from './service-charges.controller';
import { ServiceChargesService } from './service-charges.service';

@Module({
  controllers: [ServiceChargesController],
  providers: [ServiceChargesService],
  exports: [ServiceChargesService],
})
export class ServiceChargesModule {}
