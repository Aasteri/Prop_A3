import { Module } from '@nestjs/common';
import { ChangeLogController } from './change-log.controller';
import { ChangeLogService } from './change-log.service';

@Module({
  controllers: [ChangeLogController],
  providers: [ChangeLogService],
})
export class ChangeLogModule {}
