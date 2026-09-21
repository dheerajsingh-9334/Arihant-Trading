import { Module } from '@nestjs/common';
import { ProposalsService } from './proposals.service.js';
import { ProposalsWorkflowService } from './proposals.workflow.js';
import { ProposalsController } from './proposals.controller.js';

@Module({
  controllers: [ProposalsController],
  providers: [ProposalsService, ProposalsWorkflowService],
  exports: [ProposalsService, ProposalsWorkflowService],
})
export class ProposalsModule {}
