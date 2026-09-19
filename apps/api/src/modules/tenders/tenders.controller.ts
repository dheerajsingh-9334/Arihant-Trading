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
import { TendersService } from './tenders.service.js';
import {
  CreateTenderDto,
  UpdateTenderDto,
  ChangeTenderStatusDto,
  ApproveTenderDto,
  RecordTenderOutcomeDto,
} from './tenders.dto.js';
import { JwtAuthGuard } from '../../common/auth/jwt.guard.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { Roles } from '../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { AuthUser, TenderFilterDto } from '@arihant/shared';

@Controller('tenders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TendersController {
  constructor(private readonly tendersService: TendersService) {}

  @Get()
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin')
  async findAll(@Query() query: TenderFilterDto, @CurrentUser() user: AuthUser) {
    return this.tendersService.findAll(query, user);
  }

  @Get('stats')
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin')
  async getStats(@CurrentUser() user: AuthUser) {
    return this.tendersService.getStats(user);
  }

  @Get(':id')
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin')
  async findOne(@Param('id') id: string) {
    return this.tendersService.findOne(id);
  }

  @Post()
  @Roles('management', 'regional_manager', 'tender_team', 'admin')
  async create(@Body() dto: CreateTenderDto, @CurrentUser() user: AuthUser) {
    return this.tendersService.create(dto, user);
  }

  @Patch(':id')
  @Roles('management', 'regional_manager', 'tender_team', 'admin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTenderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tendersService.update(id, dto, user);
  }

  @Patch(':id/status')
  @Roles('management', 'regional_manager', 'tender_team', 'admin')
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeTenderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tendersService.changeStatus(id, dto, user);
  }

  @Post(':id/approve')
  @Roles('management', 'regional_manager')
  async approveParticipation(
    @Param('id') id: string,
    @Body() dto: ApproveTenderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tendersService.approveParticipation(id, dto, user);
  }

  @Post(':id/outcome')
  @Roles('management', 'tender_team', 'admin')
  async recordOutcome(
    @Param('id') id: string,
    @Body() dto: RecordTenderOutcomeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tendersService.recordOutcome(id, dto, user);
  }
}
