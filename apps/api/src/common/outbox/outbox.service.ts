import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Kysely, sql, Transaction } from 'kysely';
import { randomUUID } from 'crypto';
import { KYSELY_DB } from '../database/database.module.js';
import type { Database } from '@arihant/shared';

export interface DomainEventEnvelope<T = any> {
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  occurredAt: Date;
  actorId?: string;
  payload: T;
}

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private isProcessing = false;

  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<Database>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Enqueue a domain event into outbox within an active database transaction.
   * Ensures transactional consistency: either both tender state & event are committed, or neither.
   */
  async queueEvent<T = any>(
    trx: Transaction<Database> | Kysely<Database>,
    data: {
      eventType: string;
      aggregateType?: string;
      aggregateId: string;
      actorId?: string;
      payload: T;
    },
  ): Promise<string> {
    const eventId = `evt_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 10)}`;

    await trx
      .insertInto('outbox_events')
      .values({
        event_id: eventId,
        event_type: data.eventType,
        aggregate_type: data.aggregateType || 'TENDER',
        aggregate_id: data.aggregateId,
        payload: {
          ...data.payload,
          _actorId: data.actorId,
        },
        status: 'PENDING',
        attempts: 0,
        max_attempts: 5,
        available_at: new Date(),
        created_at: new Date(),
      })
      .execute();

    this.logger.log(`Queued outbox event: [${data.eventType}] id=${eventId} for ${data.aggregateId}`);
    return eventId;
  }

  /**
   * Idempotency Check: Returns true if the event has already been handled by handlerName.
   */
  async isEventProcessed(eventId: string, handlerName: string): Promise<boolean> {
    const existing = await this.db
      .selectFrom('processed_events')
      .select('id')
      .where('event_id', '=', eventId)
      .where('handler_name', '=', handlerName)
      .executeTakeFirst();

    return !!existing;
  }

  /**
   * Idempotency Record: Mark event as successfully processed by handlerName.
   */
  async markEventProcessed(eventId: string, handlerName: string): Promise<void> {
    await this.db
      .insertInto('processed_events')
      .values({
        event_id: eventId,
        handler_name: handlerName,
        processed_at: new Date(),
      })
      .onConflict((oc) => oc.columns(['event_id', 'handler_name']).doNothing())
      .execute();
  }

  /**
   * Outbox Background Worker: Processes pending events with retries and exponential backoff.
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  async processPendingEvents(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    let processedCount = 0;
    try {
      const now = new Date();
      const pendingEvents = await this.db
        .selectFrom('outbox_events')
        .selectAll()
        .where('status', '=', 'PENDING')
        .where('available_at', '<=', now)
        .where('attempts', '<', 5)
        .orderBy('created_at', 'asc')
        .limit(20)
        .execute();

      for (const event of pendingEvents) {
        const attempts = (event.attempts || 0) + 1;

        // Set status to PROCESSING
        await this.db
          .updateTable('outbox_events')
          .set({ status: 'PROCESSING', attempts })
          .where('id', '=', event.id)
          .execute();

        const envelope: DomainEventEnvelope = {
          eventId: event.event_id,
          eventType: event.event_type,
          aggregateType: event.aggregate_type,
          aggregateId: event.aggregate_id,
          occurredAt: event.created_at,
          actorId: (event.payload as any)?._actorId,
          payload: event.payload,
        };

        try {
          // Asynchronously broadcast to all registered NestJS listeners
          await this.eventEmitter.emitAsync(event.event_type, envelope);

          // Mark as PROCESSED on success
          await this.db
            .updateTable('outbox_events')
            .set({
              status: 'PROCESSED',
              processed_at: new Date(),
              error_message: null,
            })
            .where('id', '=', event.id)
            .execute();

          processedCount++;
          this.logger.log(
            `Processed outbox event [${event.event_type}] id=${event.event_id} aggregateId=${event.aggregate_id}`,
          );
        } catch (err: any) {
          this.logger.error(
            `Failed delivering outbox event [${event.event_type}] attempt ${attempts}: ${err.message}`,
            err.stack,
          );

          if (attempts >= (event.max_attempts || 5)) {
            await this.db
              .updateTable('outbox_events')
              .set({
                status: 'FAILED',
                error_message: err.message || 'Exceeded max attempts',
              })
              .where('id', '=', event.id)
              .execute();
          } else {
            // Exponential backoff: 2^attempts * 5 seconds
            const backoffMs = Math.pow(2, attempts) * 5000;
            const nextAvailable = new Date(Date.now() + backoffMs);

            await this.db
              .updateTable('outbox_events')
              .set({
                status: 'PENDING',
                available_at: nextAvailable,
                error_message: err.message || 'Delivery error, retrying',
              })
              .where('id', '=', event.id)
              .execute();
          }
        }
      }
    } catch (err: any) {
      this.logger.error(`Error in outbox processing loop: ${err.message}`);
    } finally {
      this.isProcessing = false;
    }

    return processedCount;
  }

  /**
   * Trigger immediate processing without waiting for the next cron interval
   */
  triggerImmediate(): void {
    setImmediate(() => {
      this.processPendingEvents().catch((err) =>
        this.logger.error(`Immediate outbox process error: ${err.message}`),
      );
    });
  }
}
