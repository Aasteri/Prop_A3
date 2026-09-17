import { Module } from '@nestjs/common';
import { PmEngagementsModule } from '../pm-engagements/pm-engagements.module';
import { LegalTemplatesModule } from '../legal-templates/legal-templates.module';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';

@Module({
  imports: [PmEngagementsModule, LegalTemplatesModule],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
