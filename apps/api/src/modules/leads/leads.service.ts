import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Kysely, sql } from 'kysely';
import { KYSELY_DB } from '../../common/database/database.module.js';
import { getPaginationParams, buildPaginatedResult } from '../../common/utils/pagination.js';
import { assertRegionScope } from '../../common/utils/scope.util.js';
import type { Database, AuthUser, PaginatedResult } from '@arihant/shared';
import type { CreateLeadDto, UpdateLeadDto } from './leads.dto.js';

@Injectable()
export class LeadsService {
  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<Database>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      probability?: string;
      status?: string;
      assigned_to?: string;
      organisation_id?: string;
      region_id?: string;
    },
    user: AuthUser,
  ): Promise<PaginatedResult<any>> {
    const { page, limit, offset } = getPaginationParams(query);

    let baseQuery = this.db
      .selectFrom('leads')
      .innerJoin('organisations', 'leads.organisation_id', 'organisations.id')
      .leftJoin('products', 'leads.product_id', 'products.id')
      .leftJoin('contacts', 'leads.primary_contact_id', 'contacts.id')
      .leftJoin('users as assignee', 'leads.assigned_to', 'assignee.id')
      .leftJoin('regions', 'organisations.region_id', 'regions.id')
      .leftJoin('zones', 'organisations.zone_id', 'zones.id');

    // Role scoping
    if (user.role === 'sales') {
      baseQuery = baseQuery.where('leads.assigned_to', '=', user.id);
    } else if (user.role === 'regional_manager') {
      if (user.region_id) {
        baseQuery = baseQuery.where((eb) =>
          eb.or([
            eb('organisations.region_id', '=', user.region_id),
            eb('leads.regional_manager_id', '=', user.id),
          ]),
        );
      }
    }

    if (query.search) {
      const s = `%${query.search.toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          sql<boolean>`lower(organisations.name) like ${s}`,
          sql<boolean>`lower(products.name) like ${s}`,
          sql<boolean>`lower(leads.status) like ${s}`,
        ]),
      );
    }

    if (query.category) {
      baseQuery = baseQuery.where('leads.category', '=', query.category as any);
    }

    if (query.probability) {
      baseQuery = baseQuery.where('leads.probability', '=', query.probability as any);
    }

    if (query.status) {
      baseQuery = baseQuery.where('leads.status', '=', query.status);
    }

    if (query.assigned_to) {
      baseQuery = baseQuery.where('leads.assigned_to', '=', query.assigned_to);
    }

    if (query.organisation_id) {
      baseQuery = baseQuery.where('leads.organisation_id', '=', query.organisation_id);
    }

    const countRes = await baseQuery
      .select(sql<number>`count(leads.id)::int`.as('total'))
      .executeTakeFirst();
    const total = countRes?.total || 0;

    const leads = await baseQuery
      .select([
        'leads.id',
        'leads.organisation_id',
        'leads.primary_contact_id',
        'leads.product_id',
        'leads.source',
        'leads.category',
        'leads.probability',
        'leads.channel',
        'leads.status',
        'leads.assigned_to',
        'leads.regional_manager_id',
        'leads.bill_qtr',
        'leads.last_contact_date',
        'leads.next_followup_date',
        'leads.qty',
        'leads.quot_price',
        'leads.order_price',
        'leads.value_lakh',
        'leads.booking_month',
        'leads.billing_month',
        'leads.order_status',
        'leads.remarks',
        'leads.created_at',
        'leads.updated_at',
        'organisations.name as organisation_name',
        'organisations.city as city',
        'organisations.region_id',
        'organisations.zone_id',
        'products.name as product_name',
        'products.category as product_category',
        'contacts.full_name as contact_name',
        'contacts.mobile as contact_mobile',
        'assignee.full_name as assignee_name',
        'regions.name as region_name',
        'zones.name as zone_name',
      ])
      .orderBy('leads.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return buildPaginatedResult(leads, total, page, limit);
  }

  async findOne(id: string, user: AuthUser) {
    const lead = await this.db
      .selectFrom('leads')
      .innerJoin('organisations', 'leads.organisation_id', 'organisations.id')
      .leftJoin('products', 'leads.product_id', 'products.id')
      .leftJoin('contacts', 'leads.primary_contact_id', 'contacts.id')
      .leftJoin('users as assignee', 'leads.assigned_to', 'assignee.id')
      .leftJoin('regions', 'organisations.region_id', 'regions.id')
      .selectAll('leads')
      .select([
        'organisations.name as organisation_name',
        'organisations.city as city',
        'organisations.region_id',
        'organisations.zone_id',
        'products.name as product_name',
        'contacts.full_name as contact_name',
        'assignee.full_name as assignee_name',
        'regions.name as region_name',
      ])
      .where('leads.id', '=', id)
      .executeTakeFirst();

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (user.role === 'regional_manager') {
      assertRegionScope(user, lead.region_id, lead.zone_id);
    }

    // Get interactions timeline for this lead
    const interactions = await this.db
      .selectFrom('interactions')
      .leftJoin('users', 'interactions.employee_id', 'users.id')
      .selectAll('interactions')
      .select('users.full_name as employee_name')
      .where('interactions.lead_id', '=', id)
      .orderBy('interactions.occurred_on', 'desc')
      .execute();

    return {
      ...lead,
      interactions,
    };
  }

  async create(dto: CreateLeadDto, user: AuthUser) {
    const assignedTo = dto.assigned_to || user.id;

    // Get manager for assignee
    const assignee = await this.db
      .selectFrom('users')
      .select(['reporting_manager_id', 'region_id'])
      .where('id', '=', assignedTo)
      .executeTakeFirst();

    const lead = await this.db
      .insertInto('leads')
      .values({
        organisation_id: dto.organisation_id,
        primary_contact_id: dto.primary_contact_id || null,
        product_id: dto.product_id,
        source: dto.source || 'Direct',
        category: dto.category || 'follow_up',
        probability: dto.probability || 'medium',
        channel: dto.channel || 'direct',
        status: dto.status || 'open',
        assigned_to: assignedTo,
        regional_manager_id: assignee?.reporting_manager_id || null,
        bill_qtr: dto.bill_qtr || null,
        next_followup_date: dto.next_followup_date || null,
        qty: dto.qty || null,
        quot_price: dto.quot_price || null,
        order_price: dto.order_price || null,
        value_lakh: dto.value_lakh || null,
        booking_month: dto.booking_month || null,
        billing_month: dto.billing_month || null,
        order_status: dto.order_status || null,
        remarks: dto.remarks || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Automatically create initial interaction entry on the customer timeline
    await this.db
      .insertInto('interactions')
      .values({
        organisation_id: dto.organisation_id,
        contact_id: dto.primary_contact_id || null,
        lead_id: lead.id,
        type: 'call',
        employee_id: user.id,
        remarks: `Opportunity created: ${dto.remarks || 'Initial inquiry logged.'}`,
        outcome: 'Lead registered in pipeline',
        next_action: dto.next_followup_date ? `Follow up on ${dto.next_followup_date}` : null,
        followup_date: dto.next_followup_date || null,
      })
      .execute();

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'lead',
      entityId: lead.id,
      action: 'create',
      newValue: lead,
    });

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, user: AuthUser) {
    const existing = await this.findOne(id, user);

    const updated = await this.db
      .updateTable('leads')
      .set({
        ...dto,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'lead',
      entityId: id,
      action: 'update',
      previousValue: existing,
      newValue: updated,
    });

    return updated;
  }
}
