import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Kysely } from 'kysely';
import { KYSELY_DB } from '../../../common/database/database.module.js';
import { OutboxService, type DomainEventEnvelope } from '../../../common/outbox/outbox.service.js';
import type { Database } from '@arihant/shared';

@Injectable()
export class ProposalTaskReminderConsumer {
  private readonly logger = new Logger(ProposalTaskReminderConsumer.name);
  private readonly handlerName = 'TaskReminderConsumer';

  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<Database>,
    private readonly outboxService: OutboxService,
  ) {}

  @OnEvent('proposal.*')
  async handleTaskReminder(envelope: DomainEventEnvelope) {
    const { eventId, eventType, aggregateId, payload, suppressNotifications } = envelope;

    if (suppressNotifications) return;

    if (
      eventType !== 'proposal.sent' &&
      eventType !== 'proposal.followup_scheduled' &&
      eventType !== 'proposal.followup_logged'
    ) {
      return;
    }

    const isProcessed = await this.outboxService.isEventProcessed(eventId, this.handlerName);
    if (isProcessed) return;

    try {
      const ownerId = payload?.followUpOwnerId || payload?.ownerId;
      const dueDateStr = payload?.nextFollowUpDate || payload?.scheduledDate;

      if (ownerId && dueDateStr && aggregateId) {
        // Upsert or create task in tasks table
        const existingTask = await this.db
          .selectFrom('tasks')
          .select('id')
          .where('related_entity_type', '=', 'proposal')
          .where('related_entity_id', '=', aggregateId)
          .where('assigned_to', '=', ownerId)
          .where('status', 'in', ['not_started', 'in_progress'])
          .executeTakeFirst();

        if (existingTask) {
          await this.db
            .updateTable('tasks')
            .set({
              deadline: dueDateStr,
              updated_at: new Date(),
            })
            .where('id', '=', existingTask.id)
            .execute();
        } else {
          await this.db
            .insertInto('tasks')
            .values({
              title: `Proposal Follow-up: ${payload?.proposalNo || ''}`,
              description: `Conduct scheduled customer follow-up for proposal ${payload?.proposalNo || ''}.`,
              assigned_to: ownerId,
              priority: 'high',
              task_type: 'follow_up',
              related_entity_type: 'proposal',
              related_entity_id: aggregateId,
              start_date: new Date().toISOString().split('T')[0],
              deadline: dueDateStr,
              expected_outcome: 'Log customer decision or reschedule follow-up interaction',
              status: 'not_started',
              created_at: new Date(),
              updated_at: new Date(),
            })
            .execute();
        }
      }

      await this.outboxService.markEventProcessed(eventId, this.handlerName);
    } catch (err: any) {
      this.logger.error(`[${this.handlerName}] Failed to process task reminder for event ${eventId}: ${err.message}`);
    }
  }
}
