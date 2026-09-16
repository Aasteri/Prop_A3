import { Module } from '@nestjs/common';
import { PmEngagementsController } from './pm-engagements.controller';
import { PmEngagementsService } from './pm-engagements.service';

@Module({
  controllers: [PmEngagementsController],
  providers: [PmEngagementsService],
  exports: [PmEngagementsService],
})
export class PmEngagementsModule {}
