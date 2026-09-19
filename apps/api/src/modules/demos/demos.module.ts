import { Module } from '@nestjs/common';
import { DemosService } from './demos.service.js';
import { DemosController } from './demos.controller.js';

@Module({
  controllers: [DemosController],
  providers: [DemosService],
  exports: [DemosService],
})
export class DemosModule {}
