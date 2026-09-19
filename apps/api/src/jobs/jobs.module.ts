import { Module } from '@nestjs/common';
import { DeadlineRemindersJob } from './deadline-reminders.job.js';
import { RecurringTasksJob } from './recurring-tasks.job.js';

@Module({
  providers: [DeadlineRemindersJob, RecurringTasksJob],
  exports: [DeadlineRemindersJob, RecurringTasksJob],
})
export class JobsModule {}
