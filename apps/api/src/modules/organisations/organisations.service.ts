import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Kysely, sql } from 'kysely';
import { KYSELY_DB } from '../../common/database/database.module.js';
import { getPaginationParams, buildPaginatedResult } from '../../common/utils/pagination.js';
import type { Database, PaginatedResult } from '@arihant/shared';
import type { CreateOrganisationDto, UpdateOrganisationDto } from './organisations.dto.js';

@Injectable()
export class OrganisationsService {
  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<Database>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    sector?: string;
    zone_id?: string;
    region_id?: string;
  }): Promise<PaginatedResult<any>> {
    const { page, limit, offset } = getPaginationParams(query);

    let baseQuery = this.db
      .selectFrom('organisations')
      .leftJoin('zones', 'organisations.zone_id', 'zones.id')
      .leftJoin('regions', 'organisations.region_id', 'regions.id');

    if (query.search) {
      const s = `%${query.search.toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          sql<boolean>`lower(organisations.name) like ${s}`,
          sql<boolean>`lower(organisations.city) like ${s}`,
          sql<boolean>`lower(organisations.sector) like ${s}`,
        ]),
      );
    }

    if (query.sector) {
      baseQuery = baseQuery.where('organisations.sector', '=', query.sector);
    }

    if (query.zone_id) {
      baseQuery = baseQuery.where('organisations.zone_id', '=', query.zone_id);
    }

    if (query.region_id) {
      baseQuery = baseQuery.where('organisations.region_id', '=', query.region_id);
    }

    const countRes = await baseQuery
      .select(sql<number>`count(organisations.id)::int`.as('total'))
      .executeTakeFirst();
    const total = countRes?.total || 0;

    const orgs = await baseQuery
      .select([
        'organisations.id',
        'organisations.name',
        'organisations.sector',
        'organisations.is_govt',
        'organisations.city',
        'organisations.state',
        'organisations.address',
        'organisations.zone_id',
        'organisations.region_id',
        'organisations.created_at',
        'organisations.updated_at',
        'zones.name as zone_name',
        'zones.code as zone_code',
        'regions.name as region_name',
      ])
      .orderBy('organisations.name', 'asc')
      .limit(limit)
      .offset(offset)
      .execute();

    return buildPaginatedResult(orgs, total, page, limit);
  }

  async findOne(id: string) {
    const org = await this.db
      .selectFrom('organisations')
      .leftJoin('zones', 'organisations.zone_id', 'zones.id')
      .leftJoin('regions', 'organisations.region_id', 'regions.id')
      .selectAll('organisations')
      .select(['zones.name as zone_name', 'regions.name as region_name'])
      .where('organisations.id', '=', id)
      .executeTakeFirst();

    if (!org) {
      throw new NotFoundException('Organisation not found');
    }

    const contacts = await this.db
      .selectFrom('contacts')
      .selectAll()
      .where('organisation_id', '=', id)
      .orderBy('is_primary', 'desc')
      .execute();

    const leadsCount = await this.db
      .selectFrom('leads')
      .select(sql<number>`count(id)::int`.as('count'))
      .where('organisation_id', '=', id)
      .executeTakeFirst();

    const tendersCount = await this.db
      .selectFrom('tenders')
      .select(sql<number>`count(id)::int`.as('count'))
      .where('organisation_id', '=', id)
      .executeTakeFirst();

    return {
      ...org,
      contacts,
      totalLeads: leadsCount?.count || 0,
      totalTenders: tendersCount?.count || 0,
    };
  }

  async checkDuplicate(name: string) {
    const cleanName = name.trim().toLowerCase();
    if (!cleanName) return { matches: [], isDuplicate: false };

    const s = `%${cleanName}%`;
    const matches = await this.db
      .selectFrom('organisations')
      .select(['id', 'name', 'city', 'sector'])
      .where(sql<boolean>`lower(name) like ${s}`)
      .limit(5)
      .execute();

    return {
      matches,
      isDuplicate: matches.length > 0,
      suggestion: matches.length > 0 ? 'Organisation already exists. Consider adding a new lead or interaction rather than creating a duplicate.' : null,
    };
  }

  async create(dto: CreateOrganisationDto, actorId: string) {
    const name = dto.name.trim();

    const org = await this.db
      .insertInto('organisations')
      .values({
        name,
        sector: dto.sector || null,
        is_govt: dto.is_govt !== undefined ? dto.is_govt : true,
        city: dto.city || null,
        state: dto.state || null,
        address: dto.address || null,
        zone_id: dto.zone_id || null,
        region_id: dto.region_id || null,
        created_by: actorId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    this.eventEmitter.emit('audit.log', {
      actorId,
      entityType: 'organisation',
      entityId: org.id,
      action: 'create',
      newValue: org,
    });

    return org;
  }

  async update(id: string, dto: UpdateOrganisationDto, actorId: string) {
    const existing = await this.findOne(id);

    const updated = await this.db
      .updateTable('organisations')
      .set({
        ...dto,
        name: dto.name ? dto.name.trim() : undefined,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    this.eventEmitter.emit('audit.log', {
      actorId,
      entityType: 'organisation',
      entityId: id,
      action: 'update',
      previousValue: existing,
      newValue: updated,
    });

    return updated;
  }
}
