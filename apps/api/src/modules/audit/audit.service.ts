import { Injectable, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { KYSELY_DB } from '../../common/database/database.module.js';
import { getPaginationParams, buildPaginatedResult } from '../../common/utils/pagination.js';
import type { Database, PaginatedResult } from '@arihant/shared';

@Injectable()
export class AuditService {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    entity_type?: string;
    action?: string;
  }): Promise<PaginatedResult<any>> {
    const { page, limit, offset } = getPaginationParams(query);

    let baseQuery = this.db
      .selectFrom('audit_log')
      .leftJoin('users as actor', 'audit_log.actor_id', 'actor.id');

    if (query.entity_type) {
      baseQuery = baseQuery.where('audit_log.entity_type', '=', query.entity_type);
    }

    if (query.action) {
      baseQuery = baseQuery.where('audit_log.action', '=', query.action);
    }

    const countRes = await baseQuery
      .select(sql<number>`count(audit_log.id)::int`.as('total'))
      .executeTakeFirst();
    const total = countRes?.total || 0;

    const logs = await baseQuery
      .select([
        'audit_log.id',
        'audit_log.actor_id',
        'audit_log.entity_type',
        'audit_log.entity_id',
        'audit_log.action',
        'audit_log.previous_value',
        'audit_log.new_value',
        'audit_log.created_at',
        'actor.full_name as actor_name',
        'actor.email as actor_email',
        'actor.role as actor_role',
      ])
      .orderBy('audit_log.created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return buildPaginatedResult(logs, total, page, limit);
  }
}
