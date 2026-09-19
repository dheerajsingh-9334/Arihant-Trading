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
import { ProposalsService } from './proposals.service.js';
import { CreateProposalDto, UpdateProposalDto } from './proposals.dto.js';
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
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin')
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('responsible_id') responsible_id?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.proposalsService.findAll(
      { page, limit, search, status, responsible_id },
      user!,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.proposalsService.findOne(id);
  }

  @Post()
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin')
  async create(@Body() dto: CreateProposalDto, @CurrentUser() user: AuthUser) {
    return this.proposalsService.create(dto, user);
  }

  @Patch(':id')
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProposalDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.proposalsService.update(id, dto, user);
  }
}
