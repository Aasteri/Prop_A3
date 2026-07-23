import { Module } from '@nestjs/common';
import { DeployHookController } from './deploy-hook.controller';

@Module({
  controllers: [DeployHookController],
})
export class DeployHookModule {}
