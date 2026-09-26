import { Module } from '@nestjs/common';
import { ProposalsService } from './proposals.service.js';
import { ProposalsWorkflowService } from './proposals.workflow.js';
import { ProposalsController } from './proposals.controller.js';
import { ProposalAuditLogConsumer } from './consumers/audit-log.consumer.js';
import { ProposalTimelineProjection } from './consumers/timeline.projection.js';
import { ProposalNotificationConsumer } from './consumers/notification.consumer.js';
import { ProposalTaskReminderConsumer } from './consumers/task-reminder.consumer.js';
import { ProposalsSchedulerService } from './proposals-scheduler.service.js';

@Module({
  controllers: [ProposalsController],
  providers: [
    ProposalsService,
    ProposalsWorkflowService,
    ProposalAuditLogConsumer,
    ProposalTimelineProjection,
    ProposalNotificationConsumer,
    ProposalTaskReminderConsumer,
    ProposalsSchedulerService,
  ],
  exports: [
    ProposalsService,
    ProposalsWorkflowService,
    ProposalTimelineProjection,
    ProposalsSchedulerService,
  ],
})
export class ProposalsModule {}
