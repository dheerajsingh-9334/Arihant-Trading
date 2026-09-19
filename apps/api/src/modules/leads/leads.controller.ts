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
import { LeadsService } from './leads.service.js';
import { CreateLeadDto, UpdateLeadDto } from './leads.dto.js';
import { JwtAuthGuard } from '../../common/auth/jwt.guard.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { Roles } from '../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { AuthUser } from '@arihant/shared';

@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'demo_team', 'service_team', 'admin')
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('probability') probability?: string,
    @Query('status') status?: string,
    @Query('assigned_to') assigned_to?: string,
    @Query('organisation_id') organisation_id?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.leadsService.findAll(
      { page, limit, search, category, probability, status, assigned_to, organisation_id },
      user!,
    );
  }

  @Get(':id')
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'demo_team', 'service_team', 'admin')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.leadsService.findOne(id, user);
  }

  @Post()
  @Roles('management', 'regional_manager', 'sales', 'admin')
  async create(@Body() dto: CreateLeadDto, @CurrentUser() user: AuthUser) {
    return this.leadsService.create(dto, user);
  }

  @Patch(':id')
  @Roles('management', 'regional_manager', 'sales', 'admin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.leadsService.update(id, dto, user);
  }
}
