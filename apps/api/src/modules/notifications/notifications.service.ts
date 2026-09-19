import { Injectable, Inject } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { KYSELY_DB } from '../../common/database/database.module.js';
import type { Database } from '@arihant/shared';

@Injectable()
export class NotificationsService {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async findAll(userId: string) {
    return this.db
      .selectFrom('notifications')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .limit(50)
      .execute();
  }

  async getUnreadCount(userId: string) {
    const res = await this.db
      .selectFrom('notifications')
      .select(sql<number>`count(id)::int`.as('count'))
      .where('user_id', '=', userId)
      .where('is_read', '=', false)
      .executeTakeFirst();

    return { unreadCount: res?.count || 0 };
  }

  async markAsRead(id: string, userId: string) {
    return this.db
      .updateTable('notifications')
      .set({ is_read: true })
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .returningAll()
      .executeTakeFirst();
  }

  async markAllAsRead(userId: string) {
    await this.db
      .updateTable('notifications')
      .set({ is_read: true })
      .where('user_id', '=', userId)
      .where('is_read', '=', false)
      .execute();

    return { success: true };
  }
}
