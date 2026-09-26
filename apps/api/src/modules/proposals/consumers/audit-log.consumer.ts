import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Kysely } from 'kysely';
import { KYSELY_DB } from '../../../common/database/database.module.js';
import { OutboxService, type DomainEventEnvelope } from '../../../common/outbox/outbox.service.js';
import type { Database } from '@arihant/shared';

@Injectable()
export class ProposalAuditLogConsumer {
  private readonly logger = new Logger(ProposalAuditLogConsumer.name);
  private readonly handlerName = 'AuditLogConsumer';
  // Per-proposal last applied sequence for out-of-order protection
  private readonly proposalSequences = new Map<string, number>();

  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<Database>,
    private readonly outboxService: OutboxService,
  ) {}

  @OnEvent('proposal.*')
  async handleProposalEvent(envelope: DomainEventEnvelope) {
    const { eventId, eventType, aggregateId, aggregateSequence, actorId, payload } = envelope;

    // Idempotency check (E51)
    const isProcessed = await this.outboxService.isEventProcessed(eventId, this.handlerName);
    if (isProcessed) {
      this.logger.debug(`[${this.handlerName}] Skipping duplicate event ${eventId}`);
      return;
    }

    // Sequence check (E52): ignore if older than last applied sequence
    if (aggregateSequence && aggregateId) {
      const lastSeq = this.proposalSequences.get(aggregateId) || 0;
      if (aggregateSequence < lastSeq) {
        this.logger.warn(
          `[${this.handlerName}] Ignoring out-of-order event ${eventId} (seq ${aggregateSequence} < last ${lastSeq})`,
        );
        await this.outboxService.markEventProcessed(eventId, this.handlerName);
        return;
      }
      this.proposalSequences.set(aggregateId, aggregateSequence);
    }

    try {
      // Determine action name from eventType e.g. "proposal.requested" -> "create"
      let action = 'update';
      if (eventType.includes('requested') || eventType.includes('created')) {
        action = 'create';
      } else if (eventType.includes('deleted')) {
        action = 'delete';
      } else if (eventType.includes('status_changed')) {
        action = 'status_change';
      } else if (eventType.includes('approved')) {
        action = 'approve';
      } else if (eventType.includes('changes_requested')) {
        action = 'reject';
      }

      await this.db
        .insertInto('audit_log')
        .values({
          actor_id: actorId || null,
          entity_type: 'proposal',
          entity_id: aggregateId,
          action,
          previous_value: payload?.before ? JSON.stringify(payload.before) : null,
          new_value: payload ? JSON.stringify(payload) : null,
          created_at: new Date(),
        })
        .execute();

      await this.outboxService.markEventProcessed(eventId, this.handlerName);
      this.logger.debug(`[${this.handlerName}] Recorded audit log for event ${eventId}`);
    } catch (err: any) {
      this.logger.error(`[${this.handlerName}] Failed to process event ${eventId}: ${err.message}`, err.stack);
      // Consumer failure must not block the system or crash the app
    }
  }
}
