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
import { assertRegionScope } from '../../common/utils/scope.util.js';
import { AppEvents } from '../../common/events/event-names.js';
import type { Database, AuthUser, PaginatedResult } from '@arihant/shared';
import type {
  CreateVisitDto,
  ChangeVisitStatusDto,
  SubmitVisitUpdateDto,
  ManagerInterventionDto,
} from './visits.dto.js';

@Injectable()
export class VisitsService {
  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<Database>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      assigned_to?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    user: AuthUser,
  ): Promise<PaginatedResult<any>> {
    const { page, limit, offset } = getPaginationParams(query);

    let baseQuery = this.db
      .selectFrom('visits')
      .innerJoin('organisations', 'visits.organisation_id', 'organisations.id')
      .leftJoin('products', 'visits.product_id', 'products.id')
      .leftJoin('contacts', 'visits.contact_id', 'contacts.id')
      .leftJoin('users as assignee', 'visits.assigned_to', 'assignee.id')
      .leftJoin('users as planner', 'visits.planned_by', 'planner.id')
      .leftJoin('users as manager', 'visits.assigned_by_manager', 'manager.id');

    if (user.role === 'sales' || user.role === 'demo_team' || user.role === 'service_team') {
      baseQuery = baseQuery.where('visits.assigned_to', '=', user.id);
    } else if (user.role === 'regional_manager') {
      if (user.zone_id) {
        baseQuery = baseQuery.where('organisations.zone_id', '=', user.zone_id);
      } else if (user.region_id) {
        baseQuery = baseQuery.where('organisations.region_id', '=', user.region_id);
      }
    }

    if (query.status) {
      baseQuery = baseQuery.where('visits.status', '=', query.status as any);
    }

    if (query.assigned_to) {
      baseQuery = baseQuery.where('visits.assigned_to', '=', query.assigned_to);
    }

    if (query.dateFrom) {
      baseQuery = baseQuery.where('visits.planned_date', '>=', query.dateFrom);
    }

    if (query.dateTo) {
      baseQuery = baseQuery.where('visits.planned_date', '<=', query.dateTo);
    }

    if (query.search) {
      const s = `%${query.search.toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          sql<boolean>`lower(organisations.name) like ${s}`,
          sql<boolean>`lower(visits.location) like ${s}`,
          sql<boolean>`lower(visits.purpose) like ${s}`,
        ]),
      );
    }

    const countRes = await baseQuery
      .select(sql<number>`count(visits.id)::int`.as('total'))
      .executeTakeFirst();
    const total = countRes?.total || 0;

    const visits = await baseQuery
      .select([
        'visits.id',
        'visits.organisation_id',
        'visits.contact_id',
        'visits.product_id',
        'visits.planned_by',
        'visits.assigned_to',
        'visits.assigned_by_manager',
        'visits.location',
        'visits.planned_date',
        'visits.purpose',
        'visits.demo_required',
        'visits.travel_required',
        'visits.expected_outcome',
        'visits.status',
        'visits.change_reason',
        'visits.rescheduled_from',
        'visits.remarks',
        'visits.created_at',
        'visits.updated_at',
        'organisations.name as organisation_name',
        'organisations.city as city',
        'organisations.region_id',
        'products.name as product_name',
        'contacts.full_name as contact_name',
        'assignee.full_name as assignee_name',
        'planner.full_name as planner_name',
        'manager.full_name as manager_name',
      ])
      .orderBy('visits.planned_date', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return buildPaginatedResult(visits, total, page, limit);
  }

  async findOne(id: string, user: AuthUser) {
    const visit = await this.db
      .selectFrom('visits')
      .innerJoin('organisations', 'visits.organisation_id', 'organisations.id')
      .leftJoin('products', 'visits.product_id', 'products.id')
      .leftJoin('contacts', 'visits.contact_id', 'contacts.id')
      .leftJoin('users as assignee', 'visits.assigned_to', 'assignee.id')
      .leftJoin('users as manager', 'visits.assigned_by_manager', 'manager.id')
      .selectAll('visits')
      .select([
        'organisations.name as organisation_name',
        'organisations.city as city',
        'organisations.region_id',
        'products.name as product_name',
        'contacts.full_name as contact_name',
        'contacts.mobile as contact_mobile',
        'assignee.full_name as assignee_name',
        'manager.full_name as manager_name',
      ])
      .where('visits.id', '=', id)
      .executeTakeFirst();

    if (!visit) {
      throw new NotFoundException('Visit not found');
    }

    if (user.role === 'regional_manager') {
      assertRegionScope(user, visit.region_id);
    }

    const updates = await this.db
      .selectFrom('visit_updates')
      .leftJoin('users', 'visit_updates.updated_by', 'users.id')
      .selectAll('visit_updates')
      .select('users.full_name as updated_by_name')
      .where('visit_updates.visit_id', '=', id)
      .orderBy('visit_updates.created_at', 'desc')
      .execute();

    return {
      ...visit,
      updates,
    };
  }

  async create(dto: CreateVisitDto, user: AuthUser) {
    const assignedTo = dto.assigned_to || user.id;

    const visit = await this.db
      .insertInto('visits')
      .values({
        organisation_id: dto.organisation_id,
        contact_id: dto.contact_id || null,
        product_id: dto.product_id || null,
        planned_by: user.id,
        assigned_to: assignedTo,
        location: dto.location || null,
        planned_date: dto.planned_date,
        purpose: dto.purpose || null,
        demo_required: dto.demo_required || false,
        travel_required: dto.travel_required || false,
        expected_outcome: dto.expected_outcome || null,
        status: 'planned',
        remarks: dto.remarks || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'visit',
      entityId: visit.id,
      action: 'create',
      newValue: visit,
    });

    return visit;
  }

  async changeStatus(id: string, dto: ChangeVisitStatusDto, user: AuthUser) {
    const existing = await this.findOne(id, user);

    if ((dto.status === 'cancelled' || dto.status === 'rescheduled') && !dto.change_reason) {
      throw new BadRequestException('A reason is strictly required when cancelling or rescheduling a visit.');
    }

    const updatePayload: any = {
      status: dto.status,
      change_reason: dto.change_reason || null,
    };

    if (dto.status === 'rescheduled' && dto.rescheduled_to) {
      updatePayload.rescheduled_from = existing.planned_date;
      updatePayload.planned_date = dto.rescheduled_to;
    }

    const updated = await this.db
      .updateTable('visits')
      .set(updatePayload)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'visit',
      entityId: id,
      action: `status_${dto.status}`,
      previousValue: existing,
      newValue: updated,
    });

    return updated;
  }

  async addManagerIntervention(id: string, dto: ManagerInterventionDto, user: AuthUser) {
    const existing = await this.findOne(id, user);

    const updated = await this.db
      .updateTable('visits')
      .set({
        assigned_by_manager: user.id,
        remarks: existing.remarks
          ? `${existing.remarks} | Manager Intervention: ${dto.instructions}`
          : `Manager Intervention: ${dto.instructions}`,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    this.eventEmitter.emit(AppEvents.VISIT_ALSO_MEET, {
      visitId: id,
      employeeId: existing.assigned_to,
      managerName: user.full_name,
      instructions: dto.instructions,
    });

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'visit',
      entityId: id,
      action: 'manager_intervention',
      newValue: { instructions: dto.instructions },
    });

    return updated;
  }

  async submitUpdate(id: string, dto: SubmitVisitUpdateDto, user: AuthUser) {
    const existing = await this.findOne(id, user);

    const updateRecord = await this.db
      .insertInto('visit_updates')
      .values({
        visit_id: id,
        met_completed: dto.met_completed !== undefined ? dto.met_completed : true,
        person_met: dto.person_met || null,
        discussion: dto.discussion || null,
        product_discussed: dto.product_discussed || null,
        outcome: dto.outcome || null,
        opportunity: dto.opportunity || null,
        tender_opportunity: dto.tender_opportunity || null,
        demo_required: dto.demo_required || false,
        next_action: dto.next_action || null,
        followup_date: dto.followup_date || null,
        remarks: dto.remarks || null,
        updated_by: user.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Mark visit as completed
    await this.db
      .updateTable('visits')
      .set({ status: 'completed' })
      .where('id', '=', id)
      .execute();

    // Add entry to customer interactions timeline
    await this.db
      .insertInto('interactions')
      .values({
        organisation_id: existing.organisation_id,
        contact_id: existing.contact_id,
        type: 'visit',
        employee_id: user.id,
        occurred_on: existing.planned_date,
        remarks: dto.discussion || 'Field visit completed',
        outcome: dto.outcome || 'Meeting held',
        next_action: dto.next_action || null,
        followup_date: dto.followup_date || null,
      })
      .execute();

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'visit',
      entityId: id,
      action: 'submit_update',
      newValue: updateRecord,
    });

    return updateRecord;
  }
}
