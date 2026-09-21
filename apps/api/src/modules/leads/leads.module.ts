import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service.js';
import { LeadsController } from './leads.controller.js';
import { LeadWorkflowService } from './leads.workflow.js';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, LeadWorkflowService],
  exports: [LeadsService, LeadWorkflowService],
})
export class LeadsModule {}
