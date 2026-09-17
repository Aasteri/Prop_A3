import { Module } from '@nestjs/common';
import { IvcsController } from './ivcs.controller';
import { IvcsService } from './ivcs.service';

@Module({
  controllers: [IvcsController],
  providers: [IvcsService],
  exports: [IvcsService],
})
export class IvcsModule {}
