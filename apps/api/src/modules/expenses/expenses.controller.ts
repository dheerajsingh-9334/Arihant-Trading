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
import { ExpensesService } from './expenses.service.js';
import {
  CreateExpenseDto,
  ManagerApproveExpenseDto,
  AccountsProcessExpenseDto,
} from './expenses.dto.js';
import { JwtAuthGuard } from '../../common/auth/jwt.guard.js';
import { RolesGuard } from '../../common/auth/roles.guard.js';
import { Roles } from '../../common/auth/roles.decorator.js';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import type { AuthUser, ExpenseFilterDto } from '@arihant/shared';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async findAll(@Query() query: ExpenseFilterDto, @CurrentUser() user: AuthUser) {
    return this.expensesService.findAll(query, user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateExpenseDto, @CurrentUser() user: AuthUser) {
    return this.expensesService.create(dto, user);
  }

  @Patch(':id/manager-approve')
  @Roles('management', 'regional_manager')
  async managerApprove(
    @Param('id') id: string,
    @Body() dto: ManagerApproveExpenseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.expensesService.managerApprove(id, dto, user);
  }

  @Patch(':id/accounts-process')
  @Roles('management', 'accounts')
  async accountsProcess(
    @Param('id') id: string,
    @Body() dto: AccountsProcessExpenseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.expensesService.accountsProcess(id, dto, user);
  }
}
