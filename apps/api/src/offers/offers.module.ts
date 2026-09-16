import { Module } from '@nestjs/common';
import { PmEngagementsModule } from '../pm-engagements/pm-engagements.module';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';

@Module({
  imports: [PmEngagementsModule],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
