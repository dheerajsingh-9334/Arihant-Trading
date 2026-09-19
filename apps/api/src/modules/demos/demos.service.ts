import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Kysely, sql } from 'kysely';
import { KYSELY_DB } from '../../common/database/database.module.js';
import { getPaginationParams, buildPaginatedResult } from '../../common/utils/pagination.js';
import type { Database, AuthUser, PaginatedResult } from '@arihant/shared';
import type {
  CreateDemoDto,
  ReserveEquipmentDto,
  SubmitDemoOutcomeDto,
  CreateEquipmentDto,
} from './demos.dto.js';

@Injectable()
export class DemosService {
  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<Database>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getEquipment(query: { location?: string; status?: string; product_id?: string }) {
    let q = this.db
      .selectFrom('demo_equipment')
      .innerJoin('products', 'demo_equipment.product_id', 'products.id')
      .leftJoin('users', 'demo_equipment.responsible_person', 'users.id')
      .select([
        'demo_equipment.id',
        'demo_equipment.product_id',
        'demo_equipment.model',
        'demo_equipment.serial_no',
        'demo_equipment.current_location',
        'demo_equipment.availability_status',
        'demo_equipment.condition',
        'demo_equipment.reserved_until',
        'demo_equipment.remarks',
        'products.name as product_name',
        'products.category as product_category',
        'users.full_name as responsible_person_name',
      ]);

    if (query.location) {
      q = q.where('demo_equipment.current_location', '=', query.location);
    }

    if (query.status) {
      q = q.where('demo_equipment.availability_status', '=', query.status as any);
    }

    if (query.product_id) {
      q = q.where('demo_equipment.product_id', '=', query.product_id);
    }

    return q.orderBy('demo_equipment.current_location', 'asc').execute();
  }

  async createEquipment(dto: CreateEquipmentDto, actorId: string) {
    return this.db
      .insertInto('demo_equipment')
      .values({
        product_id: dto.product_id,
        model: dto.model,
        serial_no: dto.serial_no,
        current_location: dto.current_location,
        responsible_person: dto.responsible_person || actorId,
        availability_status: 'available',
        condition: dto.condition || 'Operational',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async findAllDemos(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      assigned_to?: string;
    },
    user: AuthUser,
  ): Promise<PaginatedResult<any>> {
    const { page, limit, offset } = getPaginationParams(query);

    let baseQuery = this.db
      .selectFrom('demos')
      .innerJoin('organisations', 'demos.organisation_id', 'organisations.id')
      .leftJoin('products', 'demos.product_id', 'products.id')
      .leftJoin('users as requestedUser', 'demos.requested_by', 'requestedUser.id')
      .leftJoin('users as assignee', 'demos.assigned_to', 'assignee.id');

    if (user.role === 'demo_team') {
      // demo team sees all demos
    } else if (user.role === 'sales') {
      baseQuery = baseQuery.where('demos.requested_by', '=', user.id);
    }

    if (query.status) {
      baseQuery = baseQuery.where('demos.status', '=', query.status as any);
    }

    if (query.assigned_to) {
      baseQuery = baseQuery.where('demos.assigned_to', '=', query.assigned_to);
    }

    if (query.search) {
      const s = `%${query.search.toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          sql<boolean>`lower(organisations.name) like ${s}`,
          sql<boolean>`lower(demos.location) like ${s}`,
        ]),
      );
    }

    const countRes = await baseQuery
      .select(sql<number>`count(demos.id)::int`.as('total'))
      .executeTakeFirst();
    const total = countRes?.total || 0;

    const demos = await baseQuery
      .select([
        'demos.id',
        'demos.organisation_id',
        'demos.lead_id',
        'demos.product_id',
        'demos.requested_by',
        'demos.coordinator_id',
        'demos.assigned_to',
        'demos.location',
        'demos.requested_date',
        'demos.confirmed_date',
        'demos.expected_audience',
        'demos.equipment_required',
        'demos.status',
        'demos.created_at',
        'organisations.name as organisation_name',
        'organisations.city as city',
        'products.name as product_name',
        'requestedUser.full_name as requested_by_name',
        'assignee.full_name as assignee_name',
      ])
      .orderBy('demos.requested_date', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return buildPaginatedResult(demos, total, page, limit);
  }

  async findOneDemo(id: string) {
    const demo = await this.db
      .selectFrom('demos')
      .innerJoin('organisations', 'demos.organisation_id', 'organisations.id')
      .leftJoin('products', 'demos.product_id', 'products.id')
      .leftJoin('users as requestedUser', 'demos.requested_by', 'requestedUser.id')
      .leftJoin('users as assignee', 'demos.assigned_to', 'assignee.id')
      .selectAll('demos')
      .select([
        'organisations.name as organisation_name',
        'organisations.city as city',
        'products.name as product_name',
        'requestedUser.full_name as requested_by_name',
        'assignee.full_name as assignee_name',
      ])
      .where('demos.id', '=', id)
      .executeTakeFirst();

    if (!demo) {
      throw new NotFoundException('Demo not found');
    }

    const reservations = await this.db
      .selectFrom('demo_reservations')
      .innerJoin('demo_equipment', 'demo_reservations.equipment_id', 'demo_equipment.id')
      .leftJoin('products', 'demo_equipment.product_id', 'products.id')
      .selectAll('demo_reservations')
      .select([
        'demo_equipment.model',
        'demo_equipment.serial_no',
        'demo_equipment.current_location',
        'products.name as product_name',
      ])
      .where('demo_reservations.demo_id', '=', id)
      .execute();

    const outcome = await this.db
      .selectFrom('demo_outcomes')
      .selectAll()
      .where('demo_id', '=', id)
      .executeTakeFirst();

    return {
      ...demo,
      reservations,
      outcome,
    };
  }

  async createDemo(dto: CreateDemoDto, user: AuthUser) {
    const demo = await this.db
      .insertInto('demos')
      .values({
        organisation_id: dto.organisation_id,
        lead_id: dto.lead_id || null,
        product_id: dto.product_id || null,
        requested_by: user.id,
        assigned_to: dto.assigned_to || null,
        location: dto.location || null,
        requested_date: dto.requested_date || null,
        confirmed_date: dto.confirmed_date || null,
        expected_audience: dto.expected_audience || null,
        equipment_required: dto.equipment_required || null,
        special_requirements: dto.special_requirements || null,
        status: 'requested',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'demo',
      entityId: demo.id,
      action: 'create',
      newValue: demo,
    });

    return demo;
  }

  async reserveEquipment(demoId: string, dto: ReserveEquipmentDto, user: AuthUser) {
    // Prevent double-booking (§16): check if already reserved for overlapping dates
    const conflict = await this.db
      .selectFrom('demo_reservations')
      .where('equipment_id', '=', dto.equipment_id)
      .where('status', 'in', ['approved', 'requested'])
      .where('reserved_from', '<=', dto.reserved_to)
      .where('reserved_to', '>=', dto.reserved_from)
      .select('id')
      .executeTakeFirst();

    if (conflict) {
      throw new ConflictException(
        'Equipment unit is already reserved for an overlapping date range. Please select an alternate unit or adjust the trial dates.',
      );
    }

    const reservation = await this.db
      .insertInto('demo_reservations')
      .values({
        demo_id: demoId,
        equipment_id: dto.equipment_id,
        reserved_from: dto.reserved_from,
        reserved_to: dto.reserved_to,
        status: 'approved',
        approved_by: user.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Mark equipment reserved
    await this.db
      .updateTable('demo_equipment')
      .set({
        availability_status: 'reserved',
        reserved_until: dto.reserved_to,
      })
      .where('id', '=', dto.equipment_id)
      .execute();

    // Mark demo as equipment_reserved
    await this.db
      .updateTable('demos')
      .set({ status: 'equipment_reserved' })
      .where('id', '=', demoId)
      .execute();

    return reservation;
  }

  async submitOutcome(demoId: string, dto: SubmitDemoOutcomeDto, user: AuthUser) {
    const demo = await this.findOneDemo(demoId);

    const outcome = await this.db
      .insertInto('demo_outcomes')
      .values({
        demo_id: demoId,
        completed: dto.completed !== undefined ? dto.completed : true,
        customer_response: dto.customer_response || null,
        technical_performance: dto.technical_performance || null,
        product_suitability: dto.product_suitability || null,
        decision_maker_present: dto.decision_maker_present || null,
        competitor_involved: dto.competitor_involved || null,
        next_step: dto.next_step || null,
        result: dto.result,
        failure_reason: dto.result === 'fail' ? dto.failure_reason || 'other' : null,
        remarks: dto.remarks || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.db
      .updateTable('demos')
      .set({ status: 'completed' })
      .where('id', '=', demoId)
      .execute();

    // Add entry to customer interactions timeline
    await this.db
      .insertInto('interactions')
      .values({
        organisation_id: demo.organisation_id,
        lead_id: demo.lead_id,
        type: 'demo',
        employee_id: user.id,
        occurred_on: demo.confirmed_date || new Date().toISOString().split('T')[0],
        remarks: `Demonstration outcome: ${dto.result.toUpperCase()} - ${dto.remarks || 'Trials completed'}`,
        outcome: dto.customer_response || dto.result,
        next_action: dto.next_step || null,
      })
      .execute();

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'demo',
      entityId: demoId,
      action: 'submit_outcome',
      newValue: outcome,
    });

    return outcome;
  }
}
