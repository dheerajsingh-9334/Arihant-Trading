import { Module } from '@nestjs/common';
import { InteractionsService } from './interactions.service.js';
import { InteractionsController } from './interactions.controller.js';

@Module({
  controllers: [InteractionsController],
  providers: [InteractionsService],
  exports: [InteractionsService],
})
export class InteractionsModule {}
