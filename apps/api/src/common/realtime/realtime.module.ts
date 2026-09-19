import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsGateway } from './events.gateway.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class RealtimeModule {}
