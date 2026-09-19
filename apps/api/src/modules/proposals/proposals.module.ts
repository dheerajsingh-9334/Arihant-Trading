import { Module } from '@nestjs/common';
import { ProposalsService } from './proposals.service.js';
import { ProposalsController } from './proposals.controller.js';

@Module({
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
