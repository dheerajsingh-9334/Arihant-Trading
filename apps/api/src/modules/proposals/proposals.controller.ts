import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProposalsService } from './proposals.service.js';
import {
  CreateProposalDto,
  UpdateProposalDto,
  ChangeProposalStatusDto,
  CreateProposalFollowupDto,
  ProposalQueryDto,
} from './proposals.dto.js';
import { JwtAuthGuard } from '../../common/auth/jwt.guard.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { Roles } from '../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { AuthUser } from '@arihant/shared';

@Controller('proposals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get()
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin', 'accounts')
  async findAll(
    @Query() query: ProposalQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.proposalsService.findAll(query, user);
  }

  @Get('dashboard')
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin', 'accounts')
  async getDashboardStats(@CurrentUser() user: AuthUser) {
    return this.proposalsService.getDashboardStats(user);
  }

  @Get(':id')
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin', 'accounts')
  async findOne(@Param('id') id: string) {
    return this.proposalsService.findOne(id);
  }

  @Post()
  @Roles('management', 'regional_manager', 'sales', 'admin')
  async create(@Body() dto: CreateProposalDto, @CurrentUser() user: AuthUser) {
    return this.proposalsService.create(dto, user);
  }

  @Patch(':id')
  @Roles('management', 'regional_manager', 'sales', 'admin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProposalDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.proposalsService.update(id, dto, user);
  }

  @Patch(':id/status')
  @Roles('management', 'regional_manager', 'sales', 'admin')
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeProposalStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.proposalsService.changeStatus(id, dto, user);
  }

  @Post(':id/follow-ups')
  @Roles('management', 'regional_manager', 'sales', 'admin')
  async addFollowup(
    @Param('id') id: string,
    @Body() dto: CreateProposalFollowupDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.proposalsService.addFollowup(id, dto, user);
  }

  @Get(':id/follow-ups')
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin', 'accounts')
  async getFollowups(@Param('id') id: string) {
    return this.proposalsService.getFollowups(id);
  }

  @Get(':id/history')
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin', 'accounts')
  async getHistory(@Param('id') id: string) {
    return this.proposalsService.getHistory(id);
  }

  @Delete(':id')
  @Roles('management', 'admin')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.proposalsService.softDelete(id, user);
  }
}
