import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import { KYSELY_DB } from '../../common/database/database.module.js';
import type { Database } from '@arihant/shared';

@Injectable()
export class MastersService {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async getZones() {
    return this.db.selectFrom('zones').selectAll().orderBy('code', 'asc').execute();
  }

  async getRegions(zoneId?: string) {
    let q = this.db
      .selectFrom('regions')
      .leftJoin('zones', 'regions.zone_id', 'zones.id')
      .select([
        'regions.id',
        'regions.name',
        'regions.zone_id',
        'zones.name as zone_name',
        'zones.code as zone_code',
      ]);

    if (zoneId) {
      q = q.where('regions.zone_id', '=', zoneId);
    }

    return q.orderBy('regions.name', 'asc').execute();
  }

  async getProducts() {
    return this.db
      .selectFrom('products')
      .selectAll()
      .orderBy('name', 'asc')
      .execute();
  }

  async createProduct(data: {
    name: string;
    category?: string;
    make?: string;
    is_mha_qr?: boolean;
    spec_ref?: string;
  }) {
    return this.db
      .insertInto('products')
      .values({
        name: data.name.trim(),
        category: data.category || null,
        make: data.make || null,
        is_mha_qr: data.is_mha_qr || false,
        spec_ref: data.spec_ref || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateProduct(
    id: string,
    data: {
      name?: string;
      category?: string;
      make?: string;
      is_mha_qr?: boolean;
      spec_ref?: string;
    },
  ) {
    return this.db
      .updateTable('products')
      .set(data)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // --- Departments CRUD (§5) ---
  async getDepartments() {
    return this.db.selectFrom('departments').selectAll().orderBy('name', 'asc').execute();
  }

  async createDepartment(data: { code: string; name: string; description?: string }) {
    return this.db
      .insertInto('departments')
      .values({
        code: data.code.trim().toLowerCase(),
        name: data.name.trim(),
        description: data.description || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateDepartment(id: string, data: { name?: string; description?: string }) {
    return this.db
      .updateTable('departments')
      .set(data)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async deleteDepartment(id: string) {
    await this.db.deleteFrom('departments').where('id', '=', id).execute();
    return { success: true };
  }

  // --- Zones CRUD (§5) ---
  async createZone(data: { code: string; name: string }) {
    return this.db
      .insertInto('zones')
      .values({
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateZone(id: string, data: { code?: string; name?: string }) {
    const payload: any = {};
    if (data.code) payload.code = data.code.trim().toUpperCase();
    if (data.name) payload.name = data.name.trim();

    return this.db
      .updateTable('zones')
      .set(payload)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async deleteZone(id: string) {
    await this.db.deleteFrom('zones').where('id', '=', id).execute();
    return { success: true };
  }

  // --- Regions CRUD (§5) ---
  async createRegion(data: { name: string; zone_id?: string }) {
    return this.db
      .insertInto('regions')
      .values({
        name: data.name.trim(),
        zone_id: data.zone_id || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateRegion(id: string, data: { name?: string; zone_id?: string }) {
    return this.db
      .updateTable('regions')
      .set(data)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async deleteRegion(id: string) {
    await this.db.deleteFrom('regions').where('id', '=', id).execute();
    return { success: true };
  }

  // --- Role Permissions Matrix (§5) ---
  async getRolePermissions(role?: string) {
    let q = this.db.selectFrom('role_permissions').selectAll();
    if (role) {
      q = q.where('role', '=', role as any);
    }
    return q.orderBy('role', 'asc').orderBy('module', 'asc').execute();
  }

  async updateRolePermission(
    id: string,
    data: {
      can_view?: boolean;
      can_create?: boolean;
      can_edit?: boolean;
      can_delete?: boolean;
      can_approve?: boolean;
    },
  ) {
    return this.db
      .updateTable('role_permissions')
      .set(data)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
