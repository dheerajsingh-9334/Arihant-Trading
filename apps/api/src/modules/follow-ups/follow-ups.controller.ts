import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FollowUpsService } from './follow-ups.service.js';
import {
  CreateFollowUpDto,
  CompleteFollowUpDto,
  RescheduleFollowUpDto,
  CancelFollowUpDto,
} from './follow-ups.dto.js';
import { JwtAuthGuard } from '../../common/auth/jwt.guard.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { Roles } from '../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { AuthUser } from '@arihant/shared';

@Controller('follow-ups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Get('metrics')
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'demo_team', 'service_team', 'admin')
  async getMetrics(@CurrentUser() user: AuthUser) {
    return this.followUpsService.getMetrics(user);
  }

  @Get()
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'demo_team', 'service_team', 'admin')
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('assigned_to') assignedTo?: string,
    @Query('organisation_id') orgId?: string,
    @Query('lead_id') leadId?: string,
    @Query('timeframe') timeframe?: 'due_today' | 'overdue' | 'upcoming',
    @CurrentUser() user?: AuthUser,
  ) {
    return this.followUpsService.findAll(
      {
        page,
        limit,
        search,
        status,
        assigned_to: assignedTo,
        organisation_id: orgId,
        lead_id: leadId,
        timeframe,
      },
      user!,
    );
  }

  @Post()
  @Roles('management', 'regional_manager', 'sales', 'admin')
  async create(@Body() dto: CreateFollowUpDto, @CurrentUser() user: AuthUser) {
    return this.followUpsService.create(dto, user);
  }

  @Patch(':id/complete')
  @Roles('management', 'regional_manager', 'sales', 'admin')
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteFollowUpDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.followUpsService.complete(id, dto, user);
  }

  @Patch(':id/reschedule')
  @Roles('management', 'regional_manager', 'sales', 'admin')
  async reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleFollowUpDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.followUpsService.reschedule(id, dto, user);
  }

  @Patch(':id/cancel')
  @Roles('management', 'regional_manager', 'sales', 'admin')
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelFollowUpDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.followUpsService.cancel(id, dto, user);
  }
}
