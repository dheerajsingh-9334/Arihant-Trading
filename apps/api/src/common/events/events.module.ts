import { Module, Global } from '@nestjs/common';
import { AuditListener } from './audit.listener.js';
import { NotificationListener } from './notification.listener.js';

@Global()
@Module({
  providers: [AuditListener, NotificationListener],
  exports: [AuditListener, NotificationListener],
})
export class AppEventsModule {}
