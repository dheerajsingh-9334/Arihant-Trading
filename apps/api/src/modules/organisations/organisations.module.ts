import { Module } from '@nestjs/common';
import { OrganisationsService } from './organisations.service.js';
import { OrganisationsController } from './organisations.controller.js';

@Module({
  controllers: [OrganisationsController],
  providers: [OrganisationsService],
  exports: [OrganisationsService],
})
export class OrganisationsModule {}
