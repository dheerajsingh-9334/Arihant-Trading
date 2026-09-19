import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DemosService } from './demos.service.js';
import {
  CreateDemoDto,
  ReserveEquipmentDto,
  SubmitDemoOutcomeDto,
  CreateEquipmentDto,
} from './demos.dto.js';
import { JwtAuthGuard } from '../../common/auth/jwt.guard.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { Roles } from '../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { AuthUser } from '@arihant/shared';

@Controller('demos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DemosController {
  constructor(private readonly demosService: DemosService) {}

  @Get('equipment')
  async getEquipment(
    @Query('location') location?: string,
    @Query('status') status?: string,
    @Query('product_id') product_id?: string,
  ) {
    return this.demosService.getEquipment({ location, status, product_id });
  }

  @Post('equipment')
  @Roles('demo_team', 'service_team', 'admin')
  async createEquipment(@Body() dto: CreateEquipmentDto, @CurrentUser() user: AuthUser) {
    return this.demosService.createEquipment(dto, user.id);
  }

  @Get()
  async findAllDemos(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('assigned_to') assigned_to?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.demosService.findAllDemos({ page, limit, search, status, assigned_to }, user!);
  }

  @Get(':id')
  async findOneDemo(@Param('id') id: string) {
    return this.demosService.findOneDemo(id);
  }

  @Post()
  @Roles('management', 'regional_manager', 'sales', 'demo_team', 'admin')
  async createDemo(@Body() dto: CreateDemoDto, @CurrentUser() user: AuthUser) {
    return this.demosService.createDemo(dto, user);
  }

  @Post(':id/reserve')
  @Roles('management', 'regional_manager', 'demo_team', 'admin')
  async reserveEquipment(
    @Param('id') id: string,
    @Body() dto: ReserveEquipmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.demosService.reserveEquipment(id, dto, user);
  }

  @Post(':id/outcome')
  @Roles('management', 'regional_manager', 'demo_team', 'admin')
  async submitOutcome(
    @Param('id') id: string,
    @Body() dto: SubmitDemoOutcomeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.demosService.submitOutcome(id, dto, user);
  }
}
