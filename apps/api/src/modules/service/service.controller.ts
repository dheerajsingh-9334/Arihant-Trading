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
import { ServiceService } from './service.service.js';
import {
  CreateTicketDto,
  UpdateTicketStatusDto,
  SubmitServiceReportDto,
} from './service.dto.js';
import { JwtAuthGuard } from '../../common/auth/jwt.guard.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { Roles } from '../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { AuthUser } from '@arihant/shared';

@Controller('service')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get('stats')
  @Roles('management', 'regional_manager', 'sales', 'service_team', 'admin')
  async getDashboardStats(@CurrentUser() user: AuthUser) {
    return this.serviceService.getDashboardStats(user);
  }

  @Get()
  @Get('tickets')
  @Roles('management', 'regional_manager', 'sales', 'service_team', 'admin')
  async findAllTickets(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigned_to') assigned_to?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.serviceService.findAllTickets(
      { page, limit, search, status, priority, assigned_to },
      user!,
    );
  }

  @Get('tickets/:id')
  async findOneTicket(@Param('id') id: string) {
    return this.serviceService.findOneTicket(id);
  }

  @Post('tickets')
  @Roles('management', 'regional_manager', 'sales', 'service_team', 'admin')
  async createTicket(@Body() dto: CreateTicketDto, @CurrentUser() user: AuthUser) {
    return this.serviceService.createTicket(dto, user);
  }

  @Patch('tickets/:id/status')
  @Roles('management', 'regional_manager', 'service_team', 'admin')
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceService.updateTicketStatus(id, dto, user);
  }

  @Post('tickets/:id/report')
  @Roles('service_team', 'admin')
  async submitReport(
    @Param('id') id: string,
    @Body() dto: SubmitServiceReportDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.serviceService.submitReport(id, dto, user);
  }
}
