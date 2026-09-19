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
import { VisitsService } from './visits.service.js';
import {
  CreateVisitDto,
  ChangeVisitStatusDto,
  SubmitVisitUpdateDto,
  ManagerInterventionDto,
} from './visits.dto.js';
import { JwtAuthGuard } from '../../common/auth/jwt.guard.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { Roles } from '../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { AuthUser } from '@arihant/shared';

@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get()
  @Roles('management', 'regional_manager', 'sales', 'demo_team', 'service_team', 'admin')
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('assigned_to') assigned_to?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.visitsService.findAll(
      { page, limit, search, status, assigned_to, dateFrom, dateTo },
      user!,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.visitsService.findOne(id, user);
  }

  @Post()
  @Roles('management', 'regional_manager', 'sales', 'demo_team', 'service_team', 'admin')
  async create(@Body() dto: CreateVisitDto, @CurrentUser() user: AuthUser) {
    return this.visitsService.create(dto, user);
  }

  @Patch(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeVisitStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.visitsService.changeStatus(id, dto, user);
  }

  @Post(':id/intervention')
  @Roles('management', 'regional_manager')
  async addManagerIntervention(
    @Param('id') id: string,
    @Body() dto: ManagerInterventionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.visitsService.addManagerIntervention(id, dto, user);
  }

  @Post(':id/update')
  async submitUpdate(
    @Param('id') id: string,
    @Body() dto: SubmitVisitUpdateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.visitsService.submitUpdate(id, dto, user);
  }
}
