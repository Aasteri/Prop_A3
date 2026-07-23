import { Module } from '@nestjs/common';
import { EstateTerrierController } from './estate-terrier.controller';
import { EstateTerrierService } from './estate-terrier.service';

@Module({
  controllers: [EstateTerrierController],
  providers: [EstateTerrierService],
})
export class EstateTerrierModule {}
