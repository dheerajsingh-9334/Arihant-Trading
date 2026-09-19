import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt.guard.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { Roles } from '../../common/auth/roles.decorator.js';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('admin', 'management')
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('entity_type') entity_type?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.findAll({ page, limit, entity_type, action });
  }
}
