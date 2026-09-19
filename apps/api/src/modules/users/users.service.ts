import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Kysely, sql } from 'kysely';
import { KYSELY_DB } from '../../common/database/database.module.js';
import { getPaginationParams, buildPaginatedResult } from '../../common/utils/pagination.js';
import type { Database, PaginatedResult } from '@arihant/shared';
import type { CreateUserDto, UpdateUserDto, BulkInviteUsersDto } from './users.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<Database>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    zone_id?: string;
    is_active?: string;
  }): Promise<PaginatedResult<any>> {
    const { page, limit, offset } = getPaginationParams(query);

    let baseQuery = this.db
      .selectFrom('users')
      .leftJoin('regions', 'users.region_id', 'regions.id')
      .leftJoin('zones', 'users.zone_id', 'zones.id')
      .leftJoin('users as manager', 'users.reporting_manager_id', 'manager.id');

    if (query.search) {
      const s = `%${query.search.toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          sql<boolean>`lower(users.full_name) like ${s}`,
          sql<boolean>`lower(users.email) like ${s}`,
          sql<boolean>`users.phone like ${s}`,
        ]),
      );
    }

    if (query.role) {
      baseQuery = baseQuery.where('users.role', '=', query.role as any);
    }

    if (query.zone_id) {
      baseQuery = baseQuery.where('users.zone_id', '=', query.zone_id);
    }

    if (query.is_active !== undefined) {
      const active = query.is_active === 'true';
      baseQuery = baseQuery.where('users.is_active', '=', active);
    }

    const countRes = await baseQuery
      .select(sql<number>`count(users.id)::int`.as('total'))
      .executeTakeFirst();
    const total = countRes?.total || 0;

    const users = await baseQuery
      .select([
        'users.id',
        'users.full_name',
        'users.email',
        'users.phone',
        'users.role',
        'users.region_id',
        'users.zone_id',
        'users.reporting_manager_id',
        'users.is_active',
        'users.created_at',
        'users.updated_at',
        'regions.name as region_name',
        'zones.name as zone_name',
        'zones.code as zone_code',
        'manager.full_name as reporting_manager_name',
      ])
      .orderBy('users.full_name', 'asc')
      .limit(limit)
      .offset(offset)
      .execute();

    return buildPaginatedResult(users, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.db
      .selectFrom('users')
      .leftJoin('regions', 'users.region_id', 'regions.id')
      .leftJoin('zones', 'users.zone_id', 'zones.id')
      .leftJoin('users as manager', 'users.reporting_manager_id', 'manager.id')
      .select([
        'users.id',
        'users.full_name',
        'users.email',
        'users.phone',
        'users.role',
        'users.region_id',
        'users.zone_id',
        'users.reporting_manager_id',
        'users.is_active',
        'users.created_at',
        'users.updated_at',
        'regions.name as region_name',
        'zones.name as zone_name',
        'manager.full_name as reporting_manager_name',
      ])
      .where('users.id', '=', id)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(dto: CreateUserDto, actorId?: string) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.db
      .selectFrom('users')
      .select('id')
      .where('email', '=', email)
      .executeTakeFirst();

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const id = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(dto.password || 'password123', 10);

    const user = await this.db
      .insertInto('users')
      .values({
        id,
        email,
        full_name: dto.full_name.trim(),
        phone: dto.phone || null,
        role: dto.role,
        region_id: dto.region_id || null,
        zone_id: dto.zone_id || null,
        reporting_manager_id: dto.reporting_manager_id || null,
        password_hash: passwordHash,
        is_active: true,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    this.eventEmitter.emit('audit.log', {
      actorId: actorId || null,
      entityType: 'user',
      entityId: user.id,
      action: 'create',
      newValue: { email: user.email, role: user.role, name: user.full_name },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string) {
    const existing = await this.findOne(id);

    const updatePayload: any = { ...dto };
    if (updatePayload.full_name) updatePayload.full_name = updatePayload.full_name.trim();

    const updated = await this.db
      .updateTable('users')
      .set(updatePayload)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    this.eventEmitter.emit('audit.log', {
      actorId: actorId || null,
      entityType: 'user',
      entityId: id,
      action: 'update',
      previousValue: existing,
      newValue: updated,
    });

    return updated;
  }

  async bulkInvite(dto: BulkInviteUsersDto, actorId?: string) {
    const results = { created: 0, skipped: 0 };
    const defaultHash = bcrypt.hashSync('password123', 10);

    for (const item of dto.users) {
      const email = item.email.trim().toLowerCase();
      const exists = await this.db
        .selectFrom('users')
        .select('id')
        .where('email', '=', email)
        .executeTakeFirst();

      if (exists) {
        results.skipped++;
        continue;
      }

      await this.db
        .insertInto('users')
        .values({
          id: crypto.randomUUID(),
          email,
          full_name: item.full_name.trim(),
          role: item.role,
          password_hash: defaultHash,
          is_active: true,
        })
        .execute();

      results.created++;
    }

    this.eventEmitter.emit('audit.log', {
      actorId: actorId || null,
      entityType: 'user',
      entityId: 'bulk',
      action: 'bulk_invite',
      newValue: results,
    });

    return results;
  }
}
