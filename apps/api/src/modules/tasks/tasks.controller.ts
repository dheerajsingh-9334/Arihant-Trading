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
import { TasksService } from './tasks.service.js';
import {
  CreateTaskDto,
  UpdateTaskDto,
  RaiseBlockerDto,
  ResolveBlockerDto,
} from './tasks.dto.js';
import { JwtAuthGuard } from '../../common/auth/jwt.guard.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { Roles } from '../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { AuthUser, TaskFilterDto } from '@arihant/shared';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async findAll(@Query() query: TaskFilterDto, @CurrentUser() user: AuthUser) {
    return this.tasksService.findAll(query, user);
  }

  @Get('accountability')
  async getAccountability(@CurrentUser() user: AuthUser) {
    return this.tasksService.getAccountability(user);
  }

  @Get('salary-evidence')
  @Roles('management', 'regional_manager', 'admin')
  async getSalaryEvidence(
    @CurrentUser() user: AuthUser,
    @Query('employee_id') employeeId?: string,
  ) {
    return this.tasksService.getSalaryEvidence(user, employeeId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateTaskDto, @CurrentUser() user: AuthUser) {
    return this.tasksService.create(dto, user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.update(id, dto, user);
  }

  @Post(':id/blockers')
  async raiseBlocker(
    @Param('id') id: string,
    @Body() dto: RaiseBlockerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.raiseBlocker(id, dto, user);
  }

  @Patch(':id/blockers/:blockerId/resolve')
  @Roles('management', 'regional_manager', 'admin')
  async resolveBlocker(
    @Param('id') id: string,
    @Param('blockerId') blockerId: string,
    @Body() dto: ResolveBlockerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.resolveBlocker(id, blockerId, dto, user);
  }
}
