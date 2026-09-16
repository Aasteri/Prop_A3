import { Module } from '@nestjs/common';
import { ChartersController } from './charters.controller';
import { ChartersService } from './charters.service';

@Module({
  controllers: [ChartersController],
  providers: [ChartersService],
  exports: [ChartersService],
})
export class ChartersModule {}
