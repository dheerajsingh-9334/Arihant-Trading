import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Kysely, sql } from 'kysely';
import { KYSELY_DB } from '../../common/database/database.module.js';
import { getPaginationParams, buildPaginatedResult } from '../../common/utils/pagination.js';
import type { Database, AuthUser, PaginatedResult } from '@arihant/shared';
import type { CreateProposalDto, UpdateProposalDto } from './proposals.dto.js';

@Injectable()
export class ProposalsService {
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
      responsible_id?: string;
    },
    user: AuthUser,
  ): Promise<PaginatedResult<any>> {
    const { page, limit, offset } = getPaginationParams(query);

    let baseQuery = this.db
      .selectFrom('proposals')
      .innerJoin('organisations', 'proposals.organisation_id', 'organisations.id')
      .leftJoin('products', 'proposals.product_id', 'products.id')
      .leftJoin('users as requestedUser', 'proposals.requested_by', 'requestedUser.id')
      .leftJoin('users as responsible', 'proposals.responsible_id', 'responsible.id');

    if (query.status) {
      baseQuery = baseQuery.where('proposals.status', '=', query.status as any);
    }

    if (query.responsible_id) {
      baseQuery = baseQuery.where('proposals.responsible_id', '=', query.responsible_id);
    }

    if (query.search) {
      const s = `%${query.search.toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          sql<boolean>`lower(organisations.name) like ${s}`,
          sql<boolean>`lower(proposals.reference) like ${s}`,
          sql<boolean>`lower(products.name) like ${s}`,
        ]),
      );
    }

    const countRes = await baseQuery
      .select(sql<number>`count(proposals.id)::int`.as('total'))
      .executeTakeFirst();
    const total = countRes?.total || 0;

    const proposals = await baseQuery
      .select([
        'proposals.id',
        'proposals.organisation_id',
        'proposals.lead_id',
        'proposals.product_id',
        'proposals.sector',
        'proposals.requested_by',
        'proposals.responsible_id',
        'proposals.followup_owner_id',
        'proposals.request_date',
        'proposals.required_date',
        'proposals.sent_date',
        'proposals.version',
        'proposals.reference',
        'proposals.status',
        'proposals.next_followup',
        'proposals.remarks',
        'proposals.created_at',
        'proposals.updated_at',
        'organisations.name as organisation_name',
        'organisations.city as city',
        'products.name as product_name',
        'requestedUser.full_name as requested_by_name',
        'responsible.full_name as responsible_name',
      ])
      .orderBy('proposals.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return buildPaginatedResult(proposals, total, page, limit);
  }

  async findOne(id: string) {
    const proposal = await this.db
      .selectFrom('proposals')
      .innerJoin('organisations', 'proposals.organisation_id', 'organisations.id')
      .leftJoin('products', 'proposals.product_id', 'products.id')
      .leftJoin('users as requestedUser', 'proposals.requested_by', 'requestedUser.id')
      .leftJoin('users as responsible', 'proposals.responsible_id', 'responsible.id')
      .selectAll('proposals')
      .select([
        'organisations.name as organisation_name',
        'products.name as product_name',
        'requestedUser.full_name as requested_by_name',
        'responsible.full_name as responsible_name',
      ])
      .where('proposals.id', '=', id)
      .executeTakeFirst();

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    return proposal;
  }

  async create(dto: CreateProposalDto, user: AuthUser) {
    const proposal = await this.db
      .insertInto('proposals')
      .values({
        organisation_id: dto.organisation_id,
        lead_id: dto.lead_id || null,
        product_id: dto.product_id || null,
        sector: dto.sector || null,
        requested_by: user.id,
        responsible_id: dto.responsible_id || user.id,
        followup_owner_id: dto.followup_owner_id || user.id,
        request_date: dto.request_date || new Date().toISOString().split('T')[0],
        required_date: dto.required_date || null,
        sent_date: dto.sent_date || null,
        version: dto.version || 'v1.0',
        reference: dto.reference || null,
        status: dto.status || 'requested',
        next_followup: dto.next_followup || null,
        remarks: dto.remarks || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'proposal',
      entityId: proposal.id,
      action: 'create',
      newValue: proposal,
    });

    return proposal;
  }

  async update(id: string, dto: UpdateProposalDto, user: AuthUser) {
    const existing = await this.findOne(id);

    const updated = await this.db
      .updateTable('proposals')
      .set({
        ...dto,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'proposal',
      entityId: id,
      action: 'update',
      previousValue: existing,
      newValue: updated,
    });

    return updated;
  }
}
