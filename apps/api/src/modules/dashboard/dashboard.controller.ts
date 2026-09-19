import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../../common/auth/jwt.guard.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { Roles } from '../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { AuthUser, DashboardMetricsDto } from '@arihant/shared';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  async getMetrics(@CurrentUser() user: AuthUser): Promise<DashboardMetricsDto> {
    return this.dashboardService.getMetrics(user);
  }

  @Get('regional-performance')
  @UseGuards(RolesGuard)
  @Roles('regional_manager', 'management', 'admin')
  async getRegionalPerformance(
    @CurrentUser() user: AuthUser,
    @Query('zone_id') zoneId?: string,
    @Query('region_id') regionId?: string,
  ) {
    return this.dashboardService.getRegionalPerformance(user, { zone_id: zoneId, region_id: regionId });
  }
}

