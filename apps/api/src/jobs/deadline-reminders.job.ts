import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Kysely } from 'kysely';
import { KYSELY_DB } from '../common/database/database.module.js';
import { AppEvents } from '../common/events/event-names.js';
import { EventsGateway } from '../common/realtime/events.gateway.js';
import type { Database } from '@arihant/shared';

@Injectable()
export class DeadlineRemindersJob {
  private readonly logger = new Logger(DeadlineRemindersJob.name);

  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<Database>,
    private readonly eventEmitter: EventEmitter2,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkTenderDeadlines() {
    this.logger.log('Running tender deadline check job...');

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const urgentTenders = await this.db
      .selectFrom('tenders')
      .selectAll()
      .where('status', 'not in', ['won', 'lost', 'cancelled'])
      .where('bid_closing_date', 'is not', null)
      .where('bid_closing_date', '<=', sevenDaysFromNow.toISOString())
      .where('bid_closing_date', '>=', now.toISOString())
      .execute();

    for (const tender of urgentTenders) {
      const closingDate = new Date(tender.bid_closing_date!);
      const daysLeft = Math.ceil((closingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      this.logger.warn(
        `Tender ${tender.tender_no} closes in ${daysLeft} days! (Deadline: ${closingDate.toISOString()})`,
      );

      // Broadcast urgent banner to tender_team and management rooms
      this.eventsGateway.broadcast('tender:deadline_warning', {
        tenderId: tender.id,
        tenderNo: tender.tender_no,
        daysLeft,
        bidClosingDate: tender.bid_closing_date,
      });
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueTasks() {
    this.logger.log('Running task deadline compliance check...');
    const today = new Date().toISOString().split('T')[0];

    const overdueTasks = await this.db
      .selectFrom('tasks')
      .selectAll()
      .where('status', 'not in', ['completed'])
      .where('deadline', 'is not', null)
      .where('deadline', '<', today)
      .execute();

    for (const task of overdueTasks) {
      if (task.status !== 'overdue' && task.status !== 'blocked') {
        await this.db
          .updateTable('tasks')
          .set({ status: 'overdue' })
          .where('id', '=', task.id)
          .execute();

        this.eventEmitter.emit(AppEvents.TASK_OVERDUE, {
          taskId: task.id,
          title: task.title,
          assignedTo: task.assigned_to,
          managerId: task.reporting_manager_id,
        });
      }
    }
  }
}
