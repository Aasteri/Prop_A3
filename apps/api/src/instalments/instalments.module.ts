import { Module } from '@nestjs/common';
import { InstalmentsController } from './instalments.controller';
import { InstalmentsService } from './instalments.service';

@Module({
  controllers: [InstalmentsController],
  providers: [InstalmentsService],
  exports: [InstalmentsService],
})
export class InstalmentsModule {}
