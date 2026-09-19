import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Kysely } from 'kysely';
import { KYSELY_DB } from '../common/database/database.module.js';
import type { Database } from '@arihant/shared';

@Injectable()
export class RecurringTasksJob {
  private readonly logger = new Logger(RecurringTasksJob.name);

  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateRecurringTasks() {
    this.logger.log('Running recurring task generation job (§38)...');

    const today = new Date().toISOString().split('T')[0];

    // Find active recurring tasks
    const recurringTasks = await this.db
      .selectFrom('tasks')
      .selectAll()
      .where('task_type', 'in', ['daily', 'weekly', 'monthly'])
      .execute();

    let createdCount = 0;

    for (const template of recurringTasks) {
      // Check if task instance already exists for today/period
      const existing = await this.db
        .selectFrom('tasks')
        .select('id')
        .where('title', 'like', `${template.title}%`)
        .where('start_date', '=', today)
        .executeTakeFirst();

      if (!existing) {
        // Calculate new deadline based on recurrence interval
        let deadline = today;
        const d = new Date();
        if (template.task_type === 'daily') {
          deadline = today;
        } else if (template.task_type === 'weekly') {
          d.setDate(d.getDate() + 7);
          deadline = d.toISOString().split('T')[0];
        } else if (template.task_type === 'monthly') {
          d.setMonth(d.getMonth() + 1);
          deadline = d.toISOString().split('T')[0];
        }

        await this.db
          .insertInto('tasks')
          .values({
            title: `${template.title} [${today}]`,
            description: template.description,
            assigned_to: template.assigned_to,
            reporting_manager_id: template.reporting_manager_id,
            department: template.department,
            priority: template.priority,
            task_type: 'one_time',
            start_date: today,
            deadline,
            status: 'not_started',
          })
          .execute();

        createdCount++;
      }
    }

    this.logger.log(`Recurring task job completed. Generated ${createdCount} task instances.`);
  }
}
