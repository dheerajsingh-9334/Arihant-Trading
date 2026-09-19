import { Module } from '@nestjs/common';
import { TendersService } from './tenders.service.js';
import { TendersController } from './tenders.controller.js';

@Module({
  controllers: [TendersController],
  providers: [TendersService],
  exports: [TendersService],
})
export class TendersModule {}
