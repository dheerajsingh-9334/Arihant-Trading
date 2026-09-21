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
  CreateTenderPortalIssueDto,
  UpdateTenderPortalIssueDto,
  TenderQueryDto,
} from './tenders.dto.js';
import { JwtAuthGuard } from '../../common/auth/jwt.guard.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { Roles } from '../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { AuthUser } from '@arihant/shared';

@Controller('tenders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TendersController {
  constructor(private readonly tendersService: TendersService) {}

  @Get()
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin')
  async findAll(@Query() query: TenderQueryDto, @CurrentUser() user: AuthUser) {
    return this.tendersService.findAll(query, user);
  }

  @Get('stats')
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin')
  async getStats(@CurrentUser() user: AuthUser) {
    return this.tendersService.getStats(user);
  }

  @Get('dashboard')
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin')
  async getDashboard(@CurrentUser() user: AuthUser) {
    return this.tendersService.getDashboard(user);
  }

  @Get('reports/pipeline')
  @Roles('management', 'regional_manager', 'tender_team', 'admin')
  async getPipelineReport(@CurrentUser() user: AuthUser) {
    return this.tendersService.getPipelineReport(user);
  }

  @Get('reports/win-loss')
  @Roles('management', 'regional_manager', 'tender_team', 'admin')
  async getWinLossReport(@CurrentUser() user: AuthUser) {
    return this.tendersService.getWinLossReport(user);
  }

  @Get('reports/by-zone')
  @Roles('management', 'regional_manager', 'admin')
  async getZoneReport(@CurrentUser() user: AuthUser) {
    return this.tendersService.getZoneReport(user);
  }

  @Get('reports/by-region')
  @Roles('management', 'regional_manager', 'admin')
  async getRegionReport(@CurrentUser() user: AuthUser) {
    return this.tendersService.getRegionReport(user);
  }

  @Get('reports/by-salesperson')
  @Roles('management', 'regional_manager', 'admin')
  async getSalespersonReport(@CurrentUser() user: AuthUser) {
    return this.tendersService.getSalespersonReport(user);
  }

  @Get('categories')
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin')
  async getCategories() {
    return this.tendersService.getCategories();
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

  @Post(':id/transitions')
  @Roles('management', 'regional_manager', 'tender_team', 'admin')
  async transitionStatus(
    @Param('id') id: string,
    @Body() dto: ChangeTenderStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tendersService.changeStatus(id, dto, user);
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

  @Post(':id/approval-request')
  @Roles('management', 'regional_manager', 'tender_team', 'sales', 'admin')
  async approvalRequest(
    @Param('id') id: string,
    @Body('remarks') remarks: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tendersService.requestApproval(id, remarks, user);
  }

  @Post(':id/request-approval')
  @Roles('management', 'regional_manager', 'tender_team', 'sales', 'admin')
  async requestApproval(
    @Param('id') id: string,
    @Body('remarks') remarks: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tendersService.requestApproval(id, remarks, user);
  }

  @Post(':id/approve')
  @Roles('management', 'regional_manager', 'admin')
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

  @Post(':id/portal-issues')
  @Roles('management', 'regional_manager', 'tender_team', 'sales', 'admin')
  async createPortalIssueAlias(
    @Param('id') id: string,
    @Body() dto: CreateTenderPortalIssueDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tendersService.createPortalIssue(id, dto, user);
  }

  @Post(':id/issues')
  @Roles('management', 'regional_manager', 'tender_team', 'sales', 'admin')
  async createPortalIssue(
    @Param('id') id: string,
    @Body() dto: CreateTenderPortalIssueDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tendersService.createPortalIssue(id, dto, user);
  }

  @Get(':id/portal-issues')
  @Roles('management', 'regional_manager', 'tender_team', 'sales', 'admin')
  async getPortalIssuesAlias(@Param('id') id: string) {
    return this.tendersService.getPortalIssues(id);
  }

  @Get(':id/issues')
  @Roles('management', 'regional_manager', 'tender_team', 'sales', 'admin')
  async getPortalIssues(@Param('id') id: string) {
    return this.tendersService.getPortalIssues(id);
  }

  @Patch(':id/portal-issues/:issueId')
  @Roles('management', 'regional_manager', 'tender_team', 'admin')
  async updatePortalIssueAlias(
    @Param('id') id: string,
    @Param('issueId') issueId: string,
    @Body() dto: UpdateTenderPortalIssueDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tendersService.updatePortalIssue(id, issueId, dto, user);
  }

  @Patch(':id/issues/:issueId')
  @Roles('management', 'regional_manager', 'tender_team', 'admin')
  async updatePortalIssue(
    @Param('id') id: string,
    @Param('issueId') issueId: string,
    @Body() dto: UpdateTenderPortalIssueDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tendersService.updatePortalIssue(id, issueId, dto, user);
  }

  @Get(':id/activities')
  @Roles('management', 'regional_manager', 'sales', 'tender_team', 'admin')
  async getActivities(@Param('id') id: string) {
    return this.tendersService.getActivities(id);
  }
}
