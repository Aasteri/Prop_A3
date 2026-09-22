import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectOpsController } from './project-ops.controller';
import { ProjectOpsService } from './project-ops.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectOpsController],
  providers: [ProjectOpsService],
  exports: [ProjectOpsService],
})
export class ProjectOpsModule {}
