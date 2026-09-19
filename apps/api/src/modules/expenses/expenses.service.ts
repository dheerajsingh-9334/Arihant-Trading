import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Kysely, sql } from 'kysely';
import { KYSELY_DB } from '../../common/database/database.module.js';
import { getPaginationParams, buildPaginatedResult } from '../../common/utils/pagination.js';
import { assertNotSelfApproval } from '../../common/utils/scope.util.js';
import { AppEvents } from '../../common/events/event-names.js';
import type { Database, AuthUser, PaginatedResult, ExpenseFilterDto } from '@arihant/shared';
import type {
  CreateExpenseDto,
  ManagerApproveExpenseDto,
  AccountsProcessExpenseDto,
} from './expenses.dto.js';

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<Database>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: ExpenseFilterDto, user: AuthUser): Promise<PaginatedResult<any>> {
    const { page, limit, offset } = getPaginationParams(query);

    let baseQuery = this.db
      .selectFrom('expenses')
      .innerJoin('users as employee', 'expenses.employee_id', 'employee.id')
      .leftJoin('organisations', 'expenses.organisation_id', 'organisations.id')
      .leftJoin('visits', 'expenses.visit_id', 'visits.id')
      .leftJoin('users as manager', 'expenses.manager_id', 'manager.id');

    // Scoping rules:
    // Sales, Demo, Service staff only see their own expenses
    if (['sales', 'demo_team', 'service_team'].includes(user.role)) {
      baseQuery = baseQuery.where('expenses.employee_id', '=', user.id);
    } else if (user.role === 'regional_manager') {
      // Regional manager sees own expenses and those of subordinates
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb('expenses.employee_id', '=', user.id),
          eb('expenses.manager_id', '=', user.id),
          eb('employee.reporting_manager_id', '=', user.id),
        ]),
      );
    }
    // Accounts and Management see all expenses

    if (query.status) {
      baseQuery = baseQuery.where('expenses.status', '=', query.status as any);
    }

    if (query.category) {
      baseQuery = baseQuery.where('expenses.category', '=', query.category as any);
    }

    if (query.employee_id) {
      baseQuery = baseQuery.where('expenses.employee_id', '=', query.employee_id);
    }

    if (query.search) {
      const s = `%${query.search.toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          sql<boolean>`lower(employee.full_name) like ${s}`,
          sql<boolean>`lower(expenses.purpose) like ${s}`,
          sql<boolean>`lower(organisations.name) like ${s}`,
        ]),
      );
    }

    const countRes = await baseQuery
      .select(sql<number>`count(expenses.id)::int`.as('total'))
      .executeTakeFirst();
    const total = countRes?.total || 0;

    const expenses = await baseQuery
      .select([
        'expenses.id',
        'expenses.employee_id',
        'expenses.visit_id',
        'expenses.organisation_id',
        'expenses.expense_date',
        'expenses.category',
        'expenses.amount',
        'expenses.purpose',
        'expenses.receipt_url',
        'expenses.status',
        'expenses.manager_id',
        'expenses.manager_remarks',
        'expenses.remarks',
        'expenses.created_at',
        'expenses.updated_at',
        'employee.full_name as employee_name',
        'employee.email as employee_email',
        'organisations.name as organisation_name',
        'visits.purpose as visit_purpose',
        'manager.full_name as manager_name',
      ])
      .orderBy('expenses.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return buildPaginatedResult(expenses, total, page, limit);
  }

  async findOne(id: string) {
    const expense = await this.db
      .selectFrom('expenses')
      .innerJoin('users as employee', 'expenses.employee_id', 'employee.id')
      .leftJoin('organisations', 'expenses.organisation_id', 'organisations.id')
      .leftJoin('visits', 'expenses.visit_id', 'visits.id')
      .leftJoin('users as manager', 'expenses.manager_id', 'manager.id')
      .selectAll('expenses')
      .select([
        'employee.full_name as employee_name',
        'organisations.name as organisation_name',
        'visits.purpose as visit_purpose',
        'manager.full_name as manager_name',
      ])
      .where('expenses.id', '=', id)
      .executeTakeFirst();

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async create(dto: CreateExpenseDto, user: AuthUser) {
    // Find employee's reporting manager
    const emp = await this.db
      .selectFrom('users')
      .select('reporting_manager_id')
      .where('id', '=', user.id)
      .executeTakeFirst();

    const managerId = emp?.reporting_manager_id || null;

    const expense = await this.db
      .insertInto('expenses')
      .values({
        employee_id: user.id,
        visit_id: dto.visit_id || null,
        organisation_id: dto.organisation_id || null,
        expense_date: dto.expense_date,
        category: dto.category,
        amount: dto.amount,
        purpose: dto.purpose,
        receipt_url: dto.receipt_url || null,
        status: 'submitted',
        manager_id: managerId,
        remarks: dto.remarks || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    if (managerId) {
      this.eventEmitter.emit(AppEvents.EXPENSE_SUBMITTED, {
        expenseId: expense.id,
        employeeId: user.id,
        employeeName: user.full_name,
        amount: Number(expense.amount),
        managerId,
      });
    }

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'expense',
      entityId: expense.id,
      action: 'create',
      newValue: expense,
    });

    return expense;
  }

  async managerApprove(id: string, dto: ManagerApproveExpenseDto, user: AuthUser) {
    const expense = await this.findOne(id);

    // CRITICAL EDGE CASE: Enforce no self-approval!
    assertNotSelfApproval(user.id, expense.employee_id, 'expense approval');

    if (expense.status !== 'submitted' && expense.status !== 'clarification_required') {
      throw new BadRequestException(`Cannot approve an expense that is already in status '${expense.status}'`);
    }

    const updated = await this.db
      .updateTable('expenses')
      .set({
        status: dto.decision,
        manager_remarks: dto.manager_remarks || null,
        manager_id: user.id,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    if (dto.decision === 'manager_approved') {
      this.eventEmitter.emit(AppEvents.EXPENSE_MANAGER_APPROVED, {
        expenseId: id,
        employeeId: expense.employee_id,
        amount: Number(expense.amount),
      });
    }

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'expense',
      entityId: id,
      action: `manager_${dto.decision}`,
      previousValue: { status: expense.status },
      newValue: { status: dto.decision, remarks: dto.manager_remarks },
    });

    return updated;
  }

  async accountsProcess(id: string, dto: AccountsProcessExpenseDto, user: AuthUser) {
    const expense = await this.findOne(id);

    if (expense.status !== 'manager_approved') {
      throw new BadRequestException('Expense must be approved by the regional manager before accounts processing.');
    }

    const updated = await this.db
      .updateTable('expenses')
      .set({
        status: dto.decision,
        remarks: dto.remarks ? `${expense.remarks || ''} | Accounts: ${dto.remarks}` : expense.remarks,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    this.eventEmitter.emit(AppEvents.EXPENSE_PROCESSED, {
      expenseId: id,
      employeeId: expense.employee_id,
      amount: Number(expense.amount),
    });

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'expense',
      entityId: id,
      action: `accounts_${dto.decision}`,
      previousValue: { status: expense.status },
      newValue: { status: dto.decision },
    });

    return updated;
  }
}
