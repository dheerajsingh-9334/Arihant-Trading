import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Kysely, sql } from 'kysely';
import { KYSELY_DB } from '../../common/database/database.module.js';
import { getPaginationParams, buildPaginatedResult } from '../../common/utils/pagination.js';
import { assertRegionScope, assertNotSelfApproval } from '../../common/utils/scope.util.js';
import { getDeadlineInfo } from '@arihant/shared';
import { AppEvents } from '../../common/events/event-names.js';
import type { Database, AuthUser, PaginatedResult, TenderFilterDto } from '@arihant/shared';
import type {
  CreateTenderDto,
  UpdateTenderDto,
  ChangeTenderStatusDto,
  ApproveTenderDto,
  RecordTenderOutcomeDto,
} from './tenders.dto.js';

@Injectable()
export class TendersService {
  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<Database>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: TenderFilterDto, user: AuthUser): Promise<PaginatedResult<any>> {
    const { page, limit, offset } = getPaginationParams(query);

    let baseQuery = this.db
      .selectFrom('tenders')
      .leftJoin('organisations', 'tenders.organisation_id', 'organisations.id')
      .leftJoin('products', 'tenders.product_id', 'products.id')
      .leftJoin('zones', 'tenders.zone_id', 'zones.id')
      .leftJoin('regions', 'tenders.region_id', 'regions.id')
      .leftJoin('users as assignee', 'tenders.assigned_to', 'assignee.id');

    // Role scoping: Regional manager can only view their region/zone
    if (user.role === 'regional_manager' && user.zone_id) {
      baseQuery = baseQuery.where('tenders.zone_id', '=', user.zone_id);
    }

    if (query.zone_id) {
      baseQuery = baseQuery.where('tenders.zone_id', '=', query.zone_id);
    }

    if (query.region_id) {
      baseQuery = baseQuery.where('tenders.region_id', '=', query.region_id);
    }

    if (query.status) {
      baseQuery = baseQuery.where('tenders.status', '=', query.status as any);
    }

    if (query.category) {
      baseQuery = baseQuery.where('tenders.category', '=', query.category as any);
    }

    if (query.closingSoonOnly) {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      baseQuery = baseQuery
        .where('tenders.status', 'not in', ['won', 'lost', 'cancelled'])
        .where('tenders.bid_closing_date', 'is not', null)
        .where('tenders.bid_closing_date', '<=', sevenDaysFromNow.toISOString())
        .where('tenders.bid_closing_date', '>=', now.toISOString());
    }

    if (query.search) {
      const s = `%${query.search.toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          sql<boolean>`lower(tenders.tender_no) like ${s}`,
          sql<boolean>`lower(tenders.requirement_text) like ${s}`,
          sql<boolean>`lower(organisations.name) like ${s}`,
          sql<boolean>`lower(tenders.city) like ${s}`,
        ]),
      );
    }

    const countRes = await baseQuery
      .select(sql<number>`count(tenders.id)::int`.as('total'))
      .executeTakeFirst();
    const total = countRes?.total || 0;

    const tenders = await baseQuery
      .select([
        'tenders.id',
        'tenders.tender_no',
        'tenders.organisation_id',
        'tenders.department',
        'tenders.product_id',
        'tenders.requirement_text',
        'tenders.city',
        'tenders.state',
        'tenders.zone_id',
        'tenders.region_id',
        'tenders.category',
        'tenders.quantity',
        'tenders.bidder_turnover',
        'tenders.oem_turnover',
        'tenders.emd_fee',
        'tenders.publish_date',
        'tenders.bid_start_date',
        'tenders.bid_closing_date',
        'tenders.prebid_date',
        'tenders.corrigendum_date',
        'tenders.participated_date',
        'tenders.assigned_to',
        'tenders.tender_owner_id',
        'tenders.status',
        'tenders.remarks',
        'tenders.created_at',
        'tenders.updated_at',
        'organisations.name as organisation_name',
        'products.name as product_name',
        'zones.name as zone_name',
        'zones.code as zone_code',
        'regions.name as region_name',
        'assignee.full_name as assignee_name',
      ])
      .orderBy('tenders.bid_closing_date', 'asc')
      .limit(limit)
      .offset(offset)
      .execute();

    // Attach deadline computation (isUrgent: <= 7 days)
    const enriched = tenders.map((t) => {
      const deadlineInfo = getDeadlineInfo(t.bid_closing_date);
      return {
        ...t,
        deadlineInfo,
        isClosingSoon: deadlineInfo.isUrgent && !['won', 'lost', 'cancelled'].includes(t.status),
      };
    });

    return buildPaginatedResult(enriched, total, page, limit);
  }

  async findOne(id: string) {
    const tender = await this.db
      .selectFrom('tenders')
      .leftJoin('organisations', 'tenders.organisation_id', 'organisations.id')
      .leftJoin('products', 'tenders.product_id', 'products.id')
      .leftJoin('zones', 'tenders.zone_id', 'zones.id')
      .leftJoin('regions', 'tenders.region_id', 'regions.id')
      .leftJoin('users as assignee', 'tenders.assigned_to', 'assignee.id')
      .leftJoin('users as owner', 'tenders.tender_owner_id', 'owner.id')
      .selectAll('tenders')
      .select([
        'organisations.name as organisation_name',
        'products.name as product_name',
        'zones.name as zone_name',
        'zones.code as zone_code',
        'regions.name as region_name',
        'assignee.full_name as assignee_name',
        'owner.full_name as owner_name',
      ])
      .where('tenders.id', '=', id)
      .executeTakeFirst();

    if (!tender) {
      throw new NotFoundException('Tender not found');
    }

    const history = await this.db
      .selectFrom('tender_status_history')
      .leftJoin('users', 'tender_status_history.changed_by', 'users.id')
      .selectAll('tender_status_history')
      .select('users.full_name as changed_by_name')
      .where('tender_id', '=', id)
      .orderBy('created_at', 'desc')
      .execute();

    const outcome = await this.db
      .selectFrom('tender_outcomes')
      .selectAll()
      .where('tender_id', '=', id)
      .executeTakeFirst();

    const deadlineInfo = getDeadlineInfo(tender.bid_closing_date);

    return {
      ...tender,
      deadlineInfo,
      isClosingSoon: deadlineInfo.isUrgent && !['won', 'lost', 'cancelled'].includes(tender.status),
      history,
      outcome,
    };
  }

  async create(dto: CreateTenderDto, user: AuthUser) {
    if (dto.tender_no) {
      const exists = await this.db
        .selectFrom('tenders')
        .select('id')
        .where('tender_no', '=', dto.tender_no.trim())
        .executeTakeFirst();

      if (exists) {
        throw new ConflictException(`Tender number ${dto.tender_no} already exists.`);
      }
    }

    const tender = await this.db
      .insertInto('tenders')
      .values({
        tender_no: dto.tender_no.trim(),
        organisation_id: dto.organisation_id || null,
        department: dto.department || null,
        product_id: dto.product_id || null,
        requirement_text: dto.requirement_text || null,
        city: dto.city || null,
        state: dto.state || null,
        zone_id: dto.zone_id || user.zone_id || null,
        region_id: dto.region_id || user.region_id || null,
        category: dto.category || 'general_mha',
        quantity: dto.quantity || 1,
        bidder_turnover: dto.bidder_turnover || null,
        oem_turnover: dto.oem_turnover || null,
        emd_fee: dto.emd_fee || null,
        publish_date: dto.publish_date || null,
        bid_start_date: dto.bid_start_date || null,
        bid_closing_date: dto.bid_closing_date || null,
        prebid_date: dto.prebid_date || null,
        corrigendum_date: dto.corrigendum_date || null,
        assigned_to: dto.assigned_to || user.id,
        tender_owner_id: user.id,
        status: dto.status || 'identified',
        remarks: dto.remarks || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Add initial status history
    await this.db
      .insertInto('tender_status_history')
      .values({
        tender_id: tender.id,
        from_status: null,
        to_status: tender.status,
        changed_by: user.id,
        remarks: 'Tender created and identified',
      })
      .execute();

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'tender',
      entityId: tender.id,
      action: 'create',
      newValue: tender,
    });

    return tender;
  }

  async update(id: string, dto: UpdateTenderDto, user: AuthUser) {
    const existing = await this.findOne(id);

    const updated = await this.db
      .updateTable('tenders')
      .set({
        ...dto,
        tender_no: dto.tender_no ? dto.tender_no.trim() : undefined,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'tender',
      entityId: id,
      action: 'update',
      previousValue: existing,
      newValue: updated,
    });

    return updated;
  }

  async changeStatus(id: string, dto: ChangeTenderStatusDto, user: AuthUser) {
    const existing = await this.findOne(id);

    if (existing.status === dto.status) {
      return existing; // Idempotent
    }

    // Workflow transition rules:
    // If moving to 'awaiting_approval', emit approval requested event
    // Moving from won/lost to earlier states is disallowed unless admin
    if (['won', 'lost'].includes(existing.status) && user.role !== 'admin') {
      throw new BadRequestException(`Cannot transition a finalized tender from ${existing.status} to ${dto.status}.`);
    }

    const updated = await this.db
      .updateTable('tenders')
      .set({ status: dto.status })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.db
      .insertInto('tender_status_history')
      .values({
        tender_id: id,
        from_status: existing.status,
        to_status: dto.status,
        changed_by: user.id,
        remarks: dto.remarks || `Status moved from ${existing.status} to ${dto.status}`,
      })
      .execute();

    if (dto.status === 'awaiting_approval') {
      this.eventEmitter.emit(AppEvents.TENDER_APPROVAL_REQUESTED, {
        tenderId: id,
        tenderNo: existing.tender_no,
        orgName: existing.organisation_name || existing.department || 'Government Buyer',
        actorId: user.id,
      });
    }

    this.eventEmitter.emit(AppEvents.TENDER_STATUS_CHANGED, {
      tenderId: id,
      tenderNo: existing.tender_no,
      fromStatus: existing.status,
      toStatus: dto.status,
      actorId: user.id,
      tenderOwnerId: existing.tender_owner_id,
    });

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'tender',
      entityId: id,
      action: 'status_change',
      previousValue: { status: existing.status },
      newValue: { status: dto.status, remarks: dto.remarks },
    });

    return updated;
  }

  async approveParticipation(id: string, dto: ApproveTenderDto, user: AuthUser) {
    const existing = await this.findOne(id);

    // Enforce self-approval prevention: Creator/owner cannot approve their own tender!
    if (existing.tender_owner_id) {
      assertNotSelfApproval(user.id, existing.tender_owner_id, 'tender participation approval');
    }

    const nextStatus = dto.decision === 'approved' ? 'under_preparation' : 'rejected_internally';

    const updated = await this.db
      .updateTable('tenders')
      .set({ status: nextStatus })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.db
      .insertInto('tender_status_history')
      .values({
        tender_id: id,
        from_status: existing.status,
        to_status: nextStatus,
        changed_by: user.id,
        remarks: dto.remarks || `Management participation decision: ${dto.decision.toUpperCase()}`,
      })
      .execute();

    this.eventEmitter.emit(AppEvents.TENDER_STATUS_CHANGED, {
      tenderId: id,
      tenderNo: existing.tender_no,
      fromStatus: existing.status,
      toStatus: nextStatus,
      actorId: user.id,
      tenderOwnerId: existing.tender_owner_id,
    });

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'tender',
      entityId: id,
      action: `approval_${dto.decision}`,
      newValue: { decision: dto.decision, remarks: dto.remarks },
    });

    return updated;
  }

  async recordOutcome(id: string, dto: RecordTenderOutcomeDto, user: AuthUser) {
    const existing = await this.findOne(id);

    const outcome = await this.db
      .insertInto('tender_outcomes')
      .values({
        tender_id: id,
        result: dto.result,
        reason: dto.reason || null,
        competitor: dto.competitor || null,
        value_lakh: dto.value_lakh || null,
        result_date: dto.result_date || new Date().toISOString().split('T')[0],
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    // Update tender status
    await this.db
      .updateTable('tenders')
      .set({ status: dto.result })
      .where('id', '=', id)
      .execute();

    await this.db
      .insertInto('tender_status_history')
      .values({
        tender_id: id,
        from_status: existing.status,
        to_status: dto.result,
        changed_by: user.id,
        remarks: `Tender result recorded: ${dto.result.toUpperCase()}. Competitor: ${dto.competitor || 'None'}`,
      })
      .execute();

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'tender',
      entityId: id,
      action: 'record_outcome',
      newValue: outcome,
    });

    return outcome;
  }

  async getStats(user: AuthUser) {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let base = this.db.selectFrom('tenders');
    if (user.role === 'regional_manager' && user.zone_id) {
      base = base.where('zone_id', '=', user.zone_id);
    }

    const totalRes = await base
      .select(sql<number>`count(id)::int`.as('count'))
      .executeTakeFirst();

    const closingSoonRes = await base
      .select(sql<number>`count(id)::int`.as('count'))
      .where('status', 'not in', ['won', 'lost', 'cancelled'])
      .where('bid_closing_date', 'is not', null)
      .where('bid_closing_date', '<=', sevenDaysFromNow.toISOString())
      .where('bid_closing_date', '>=', now.toISOString())
      .executeTakeFirst();

    const awaitingApprovalRes = await base
      .select(sql<number>`count(id)::int`.as('count'))
      .where('status', '=', 'awaiting_approval')
      .executeTakeFirst();

    const underPrepRes = await base
      .select(sql<number>`count(id)::int`.as('count'))
      .where('status', '=', 'under_preparation')
      .executeTakeFirst();

    const wonRes = await base
      .select(sql<number>`count(id)::int`.as('count'))
      .where('status', '=', 'won')
      .executeTakeFirst();

    const lostRes = await base
      .select(sql<number>`count(id)::int`.as('count'))
      .where('status', '=', 'lost')
      .executeTakeFirst();

    const pqCountRes = await base
      .select(sql<number>`count(id)::int`.as('count'))
      .where('category', '=', 'pq')
      .executeTakeFirst();

    const generalMhaCountRes = await base
      .select(sql<number>`count(id)::int`.as('count'))
      .where('category', '=', 'general_mha')
      .executeTakeFirst();

    return {
      total: totalRes?.count || 0,
      closingSoon: closingSoonRes?.count || 0,
      awaitingApproval: awaitingApprovalRes?.count || 0,
      underPreparation: underPrepRes?.count || 0,
      won: wonRes?.count || 0,
      lost: lostRes?.count || 0,
      pqCount: pqCountRes?.count || 0,
      generalMhaCount: generalMhaCountRes?.count || 0,
    };
  }
}
