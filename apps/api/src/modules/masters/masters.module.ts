import { Module } from '@nestjs/common';
import { MastersService } from './masters.service.js';
import { MastersController } from './masters.controller.js';

@Module({
  controllers: [MastersController],
  providers: [MastersService],
  exports: [MastersService],
})
export class MastersModule {}
