import { Module } from '@nestjs/common';
import { TendersService } from './tenders.service.js';
import { TendersController } from './tenders.controller.js';
import { TendersWorkflowService } from './tenders.workflow.js';

@Module({
  controllers: [TendersController],
  providers: [TendersService, TendersWorkflowService],
  exports: [TendersService, TendersWorkflowService],
})
export class TendersModule {}
