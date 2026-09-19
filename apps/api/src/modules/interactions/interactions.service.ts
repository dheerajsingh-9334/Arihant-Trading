import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { KYSELY_DB } from '../../common/database/database.module.js';
import type { Database } from '@arihant/shared';
import type { CreateInteractionDto } from './interactions.dto.js';

@Injectable()
export class InteractionsService {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async findByOrganisation(orgId: string) {
    return this.db
      .selectFrom('interactions')
      .leftJoin('contacts', 'interactions.contact_id', 'contacts.id')
      .leftJoin('users', 'interactions.employee_id', 'users.id')
      .leftJoin('leads', 'interactions.lead_id', 'leads.id')
      .selectAll('interactions')
      .select([
        'contacts.full_name as contact_name',
        'users.full_name as employee_name',
        'leads.status as lead_status',
      ])
      .where('interactions.organisation_id', '=', orgId)
      .orderBy('interactions.occurred_on', 'desc')
      .orderBy('interactions.created_at', 'desc')
      .execute();
  }

  async create(dto: CreateInteractionDto, employeeId: string) {
    return this.db
      .insertInto('interactions')
      .values({
        organisation_id: dto.organisation_id,
        contact_id: dto.contact_id || null,
        lead_id: dto.lead_id || null,
        type: dto.type,
        employee_id: employeeId,
        occurred_on: dto.occurred_on || new Date().toISOString().split('T')[0],
        remarks: dto.remarks || null,
        outcome: dto.outcome || null,
        next_action: dto.next_action || null,
        followup_date: dto.followup_date || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
