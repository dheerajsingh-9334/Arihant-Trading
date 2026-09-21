import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Kysely, sql } from 'kysely';
import { KYSELY_DB } from '../../common/database/database.module.js';
import { getPaginationParams, buildPaginatedResult } from '../../common/utils/pagination.js';
import { assertRegionScope, assertNotSelfApproval } from '../../common/utils/scope.util.js';
import {
  TENDER_UPCOMING_DAYS,
  TENDER_URGENT_HOURS,
  type Database,
  type AuthUser,
  type PaginatedResult,
  type TenderStatus,
} from '@arihant/shared';
import { AppEvents } from '../../common/events/event-names.js';
import { OutboxService } from '../../common/outbox/outbox.service.js';
import { TendersWorkflowService } from './tenders.workflow.js';
import {
  CreateTenderDto,
  UpdateTenderDto,
  ChangeTenderStatusDto,
  ApproveTenderDto,
  RecordTenderOutcomeDto,
  CreateTenderPortalIssueDto,
  UpdateTenderPortalIssueDto,
  TenderQueryDto,
} from './tenders.dto.js';

@Injectable()
export class TendersService {
  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<Database>,
    private readonly outboxService: OutboxService,
    private readonly workflowService: TendersWorkflowService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Helper to calculate deadline urgency tag
   */
  private calculateDeadlineTag(bidClosingDate?: string | Date | null, status?: string): string {
    if (!bidClosingDate) return 'normal';
    if (['won', 'lost', 'cancelled'].includes((status || '').toLowerCase())) {
      return 'completed';
    }

    const now = new Date();
    const deadline = new Date(bidClosingDate);
    const diffMs = deadline.getTime() - now.getTime();

    if (diffMs < 0) return 'overdue';
    if (diffMs <= TENDER_URGENT_HOURS * 3600 * 1000) return 'urgent_48h';
    if (diffMs <= TENDER_UPCOMING_DAYS * 24 * 3600 * 1000) return 'upcoming_7d';
    return 'normal';
  }

  /**
   * Active Categories Master Lookup
   */
  async getCategories() {
    return this.db
      .selectFrom('tender_categories')
      .selectAll()
      .where('is_active', '=', true)
      .orderBy('code', 'asc')
      .execute();
  }

  /**
   * List tenders with multi-parameter server-side search, filtering, and sorting
   */
  async findAll(query: TenderQueryDto, user: AuthUser): Promise<PaginatedResult<any>> {
    const { page, limit, offset } = getPaginationParams({
      page: Number(query.page || 1),
      limit: Number(query.limit || 20),
    });

    let baseQuery = this.db
      .selectFrom('tenders')
      .leftJoin('organisations', 'tenders.organisation_id', 'organisations.id')
      .leftJoin('products', 'tenders.product_id', 'products.id')
      .leftJoin('zones', 'tenders.zone_id', 'zones.id')
      .leftJoin('regions', 'tenders.region_id', 'regions.id')
      .leftJoin('users as assignee', 'tenders.assigned_to', 'assignee.id')
      .leftJoin('users as owner', 'tenders.tender_owner_id', 'owner.id')
      .where('tenders.is_deleted', '=', false);

    // Territorial scoping
    if (user.role === 'regional_manager' && user.zone_id) {
      baseQuery = baseQuery.where('tenders.zone_id', '=', user.zone_id);
    } else if (user.role === 'sales' && user.region_id) {
      // Sales executive views tenders in their region or assigned to them
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb('tenders.region_id', '=', user.region_id),
          eb('tenders.assigned_to', '=', user.id),
          eb('tenders.tender_owner_id', '=', user.id),
        ]),
      );
    }

    // Direct filters
    const zoneId = query.zone_id || query.zone;
    if (zoneId) baseQuery = baseQuery.where('tenders.zone_id', '=', zoneId);

    const regionId = query.region_id || query.region;
    if (regionId) baseQuery = baseQuery.where('tenders.region_id', '=', regionId);

    const orgId = query.organisation_id || query.organisation;
    if (orgId) baseQuery = baseQuery.where('tenders.organisation_id', '=', orgId);

    if (query.product_id) baseQuery = baseQuery.where('tenders.product_id', '=', query.product_id);
    if (query.department) baseQuery = baseQuery.where('tenders.department', '=', query.department);
    if (query.city) baseQuery = baseQuery.where('tenders.city', '=', query.city);
    if (query.state) baseQuery = baseQuery.where('tenders.state', '=', query.state);

    const assignedTo = query.assigned_to || query.assignedPerson;
    if (assignedTo) baseQuery = baseQuery.where('tenders.assigned_to', '=', assignedTo);

    const tenderOwner = query.tender_owner_id || query.tenderOwner;
    if (tenderOwner) baseQuery = baseQuery.where('tenders.tender_owner_id', '=', tenderOwner);

    if (query.status && query.status !== 'all') {
      try {
        const normStatus = this.workflowService.normalizeStatus(query.status);
        baseQuery = baseQuery.where('tenders.status', '=', normStatus as any);
      } catch {
        baseQuery = baseQuery.where('tenders.status', '=', query.status as any);
      }
    }

    if (query.category && query.category !== 'all') {
      const cat = query.category.toLowerCase().trim();
      baseQuery = baseQuery.where(sql<boolean>`lower(tenders.category::text) = ${cat}`);
    }

    // Deadline filter
    if (query.deadline) {
      const now = new Date();
      if (query.deadline === 'due_today') {
        baseQuery = baseQuery.where(sql<boolean>`tenders.bid_closing_date::date = CURRENT_DATE`);
      } else if (query.deadline === 'urgent_48h') {
        const urgent48 = new Date(now.getTime() + TENDER_URGENT_HOURS * 3600 * 1000);
        baseQuery = baseQuery
          .where('tenders.status', 'not in', ['won', 'lost', 'cancelled'])
          .where('tenders.bid_closing_date', '>=', now.toISOString())
          .where('tenders.bid_closing_date', '<=', urgent48.toISOString());
      } else if (query.deadline === 'upcoming_7d') {
        const upcoming7d = new Date(now.getTime() + TENDER_UPCOMING_DAYS * 24 * 3600 * 1000);
        baseQuery = baseQuery
          .where('tenders.status', 'not in', ['won', 'lost', 'cancelled'])
          .where('tenders.bid_closing_date', '>=', now.toISOString())
          .where('tenders.bid_closing_date', '<=', upcoming7d.toISOString());
      } else if (query.deadline === 'overdue') {
        baseQuery = baseQuery
          .where('tenders.status', 'not in', ['won', 'lost', 'cancelled'])
          .where('tenders.bid_closing_date', '<', now.toISOString());
      }
    }

    // Backwards compatibility for closingSoonOnly flag
    if (query.closingSoonOnly === true || query.closingSoonOnly === 'true') {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      baseQuery = baseQuery
        .where('tenders.status', 'not in', ['won', 'lost', 'cancelled'])
        .where('tenders.bid_closing_date', 'is not', null)
        .where('tenders.bid_closing_date', '<=', sevenDaysFromNow.toISOString())
        .where('tenders.bid_closing_date', '>=', now.toISOString());
    }

    // Date range filter
    if (query.from_date || query.to_date) {
      const dateCol = query.date_field === 'publish_date' ? 'tenders.publish_date' : 'tenders.bid_closing_date';
      if (query.from_date) {
        baseQuery = baseQuery.where(sql<boolean>`${sql.ref(dateCol)} >= ${query.from_date}`);
      }
      if (query.to_date) {
        baseQuery = baseQuery.where(sql<boolean>`${sql.ref(dateCol)} <= ${query.to_date}`);
      }
    }

    // Search query across number, description, customer, city, and reference
    if (query.search && query.search.trim()) {
      const s = `%${query.search.toLowerCase().trim()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          sql<boolean>`lower(tenders.tender_no) like ${s}`,
          sql<boolean>`lower(tenders.requirement_text) like ${s}`,
          sql<boolean>`lower(organisations.name) like ${s}`,
          sql<boolean>`lower(tenders.city) like ${s}`,
          sql<boolean>`lower(tenders.reference_number) like ${s}`,
          sql<boolean>`lower(assignee.full_name) like ${s}`,
        ]),
      );
    }

    // Total count
    const countRes = await baseQuery
      .select(sql<number>`count(tenders.id)::int`.as('total'))
      .executeTakeFirst();
    const total = countRes?.total || 0;

    // Sorting
    const sortField = query.sortBy || 'bid_closing_date';
    const sortDirection = (query.sortOrder || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

    let orderQuery = baseQuery.orderBy(
      sql`case when tenders.bid_closing_date is null then 1 else 0 end`,
      'asc',
    );

    if (sortField === 'tender_no') {
      orderQuery = orderQuery.orderBy('tenders.tender_no', sortDirection);
    } else if (sortField === 'publish_date') {
      orderQuery = orderQuery.orderBy('tenders.publish_date', sortDirection);
    } else if (sortField === 'created_at') {
      orderQuery = orderQuery.orderBy('tenders.created_at', sortDirection);
    } else if (sortField === 'updated_at') {
      orderQuery = orderQuery.orderBy('tenders.updated_at', sortDirection);
    } else if (sortField === 'tender_value' || sortField === 'estimated_value') {
      orderQuery = orderQuery.orderBy('tenders.estimated_value', sortDirection);
    } else {
      orderQuery = orderQuery.orderBy('tenders.bid_closing_date', sortDirection);
    }

    const tenders = await orderQuery
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
        'tenders.portal',
        'tenders.reference_number',
        'tenders.estimated_value',
        'tenders.tender_value',
        'tenders.publish_date',
        'tenders.bid_start_date',
        'tenders.bid_closing_date',
        'tenders.submission_date',
        'tenders.result_date',
        'tenders.prebid_date',
        'tenders.corrigendum_date',
        'tenders.participated_date',
        'tenders.assigned_to',
        'tenders.tender_owner_id',
        'tenders.status',
        'tenders.remarks',
        'tenders.rejection_reason',
        'tenders.created_at',
        'tenders.updated_at',
        'organisations.name as organisation_name',
        'products.name as product_name',
        'zones.name as zone_name',
        'regions.name as region_name',
        'assignee.full_name as assigned_to_name',
        'owner.full_name as tender_owner_name',
      ])
      .limit(limit)
      .offset(offset)
      .execute();

    // Map deadline urgency tags
    const enrichedTenders = tenders.map((t) => ({
      ...t,
      deadline_tag: this.calculateDeadlineTag(t.bid_closing_date, t.status),
      current_stage: t.status,
    }));

    return buildPaginatedResult(enrichedTenders, total, page, limit);
  }

  /**
   * Find a single tender with approvals, portal issues, outcome, and activity timeline
   */
  async findOne(id: string) {
    const tender = await this.db
      .selectFrom('tenders')
      .leftJoin('organisations', 'tenders.organisation_id', 'organisations.id')
      .leftJoin('products', 'tenders.product_id', 'products.id')
      .leftJoin('zones', 'tenders.zone_id', 'zones.id')
      .leftJoin('regions', 'tenders.region_id', 'regions.id')
      .leftJoin('users as assignee', 'tenders.assigned_to', 'assignee.id')
      .leftJoin('users as owner', 'tenders.tender_owner_id', 'owner.id')
      .leftJoin('users as approver', 'tenders.internal_approval_by', 'approver.id')
      .selectAll('tenders')
      .select([
        'organisations.name as organisation_name',
        'products.name as product_name',
        'zones.name as zone_name',
        'regions.name as region_name',
        'assignee.full_name as assigned_to_name',
        'owner.full_name as tender_owner_name',
        'approver.full_name as internal_approval_by_name',
      ])
      .where('tenders.id', '=', id)
      .where('tenders.is_deleted', '=', false)
      .executeTakeFirst();

    if (!tender) {
      throw new NotFoundException(`Tender with ID ${id} not found`);
    }

    // Fetch related records in parallel
    const [history, outcomes, approvals, portalIssues, activities] = await Promise.all([
      this.db
        .selectFrom('tender_status_history')
        .leftJoin('users', 'tender_status_history.changed_by', 'users.id')
        .selectAll('tender_status_history')
        .select('users.full_name as changed_by_name')
        .where('tender_id', '=', id)
        .orderBy('tender_status_history.created_at', 'desc')
        .execute(),
      this.db
        .selectFrom('tender_outcomes')
        .selectAll()
        .where('tender_id', '=', id)
        .executeTakeFirst(),
      this.db
        .selectFrom('tender_approvals')
        .leftJoin('users as req', 'tender_approvals.requested_by', 'req.id')
        .leftJoin('users as app', 'tender_approvals.approver_id', 'app.id')
        .selectAll('tender_approvals')
        .select([
          'req.full_name as requested_by_name',
          'app.full_name as approver_name',
        ])
        .where('tender_id', '=', id)
        .orderBy('tender_approvals.created_at', 'desc')
        .execute(),
      this.db
        .selectFrom('tender_portal_issues')
        .leftJoin('users as rep', 'tender_portal_issues.reported_by', 'rep.id')
        .leftJoin('users as resp', 'tender_portal_issues.responsible_person_id', 'resp.id')
        .selectAll('tender_portal_issues')
        .select([
          'rep.full_name as reported_by_name',
          'resp.full_name as responsible_name',
          'tender_portal_issues.escalated_to as escalated_to_name',
        ])
        .where('tender_id', '=', id)
        .orderBy('tender_portal_issues.created_at', 'desc')
        .execute(),
      this.db
        .selectFrom('tender_activities')
        .leftJoin('users', 'tender_activities.performed_by', 'users.id')
        .selectAll('tender_activities')
        .select('users.full_name as performed_by_name')
        .where('tender_id', '=', id)
        .orderBy('tender_activities.created_at', 'desc')
        .execute(),
    ]);

    return {
      ...tender,
      deadline_tag: this.calculateDeadlineTag(tender.bid_closing_date, tender.status),
      history,
      outcome: outcomes || null,
      approvals,
      portal_issues: portalIssues,
      activities,
    };
  }

  /**
   * Create a tender transactionally with Outbox domain event emission
   */
  async create(dto: CreateTenderDto, user: AuthUser) {
    // 1. Required fields validation
    if (!dto.tender_no || !dto.tender_no.trim()) {
      throw new BadRequestException('Tender number is required for tender registration');
    }
    if (!dto.organisation_id) {
      throw new BadRequestException('Organisation ID is required for tender registration');
    }

    // 2. Validate duplicate tender number
    if (dto.tender_no && dto.tender_no.trim()) {
      const existing = await this.db
        .selectFrom('tenders')
        .select('id')
        .where('tender_no', '=', dto.tender_no.trim())
        .where('is_deleted', '=', false)
        .executeTakeFirst();
      if (existing) {
        throw new ConflictException(
          `Tender with number "${dto.tender_no.trim()}" is already registered.`,
        );
      }
    }

    // 3. Validate dates
    const pubDate = dto.publish_date || dto.publication_date;
    const closeDate = dto.bid_closing_date || dto.submission_deadline;
    if (pubDate && closeDate && new Date(closeDate) < new Date(pubDate)) {
      throw new BadRequestException('Submission deadline cannot be earlier than publication date.');
    }

    const assignedTo = dto.assigned_to || dto.assigned_person_id;
    const tenderOwner = dto.tender_owner_id || assignedTo || user.id;
    const category = (dto.category || 'general_mha').toLowerCase() as any;
    const status = dto.status ? this.workflowService.normalizeStatus(dto.status) : 'identified';

    const tender = await this.db.transaction().execute(async (trx) => {
      const created = await trx
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
          category,
          quantity: dto.quantity || 1,
          bidder_turnover: dto.bidder_turnover || null,
          oem_turnover: dto.oem_turnover || null,
          emd_fee: dto.emd_fee || 0,
          portal: dto.portal || 'GeM',
          reference_number: dto.reference_number || null,
          estimated_value: dto.estimated_value || null,
          tender_value: dto.tender_value || null,
          publish_date: pubDate || null,
          bid_start_date: dto.bid_start_date || null,
          bid_closing_date: closeDate || null,
          prebid_date: dto.prebid_date || null,
          corrigendum_date: dto.corrigendum_date || null,
          assigned_to: assignedTo || null,
          tender_owner_id: tenderOwner || null,
          status,
          remarks: dto.remarks || null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Activity record
      await trx
        .insertInto('tender_activities')
        .values({
          tender_id: created.id,
          event_type: 'IDENTIFIED',
          description: `Tender ${created.tender_no} registered in pipeline`,
          performed_by: user.id,
          metadata: { category: created.category, status: created.status },
        })
        .execute();

      // Transactional Outbox Event
      await this.outboxService.queueEvent(trx, {
        eventType: AppEvents.TENDER_CREATED,
        aggregateType: 'TENDER',
        aggregateId: created.id,
        actorId: user.id,
        payload: {
          tenderId: created.id,
          tenderNo: created.tender_no,
          organisationId: created.organisation_id,
          assignedTo: created.assigned_to,
          tenderOwnerId: created.tender_owner_id,
          category: created.category,
          status: created.status,
          bidClosingDate: created.bid_closing_date,
        },
      });

      return created;
    });

    // Trigger immediate outbox dispatch
    this.outboxService.triggerImmediate();

    return this.findOne(tender.id);
  }

  /**
   * Update tender details transactionally with Outbox event emission
   */
  async update(id: string, dto: UpdateTenderDto, user: AuthUser) {
    const existing = await this.findOne(id);

    // Validate dates
    const pubDate = dto.publish_date || dto.publication_date || existing.publish_date;
    const closeDate = dto.bid_closing_date || dto.submission_deadline || existing.bid_closing_date;
    if (pubDate && closeDate && new Date(closeDate) < new Date(pubDate)) {
      throw new BadRequestException('Submission deadline cannot be before publication date.');
    }

    const assignedTo = dto.assigned_to || dto.assigned_person_id;
    const isNewAssignment = assignedTo && assignedTo !== existing.assigned_to;

    const updatePayload: any = {
      updated_at: sql`NOW()`,
    };

    if (dto.tender_no !== undefined) updatePayload.tender_no = dto.tender_no.trim();
    if (dto.organisation_id !== undefined) updatePayload.organisation_id = dto.organisation_id;
    if (dto.department !== undefined) updatePayload.department = dto.department;
    if (dto.product_id !== undefined) updatePayload.product_id = dto.product_id;
    if (dto.requirement_text !== undefined) updatePayload.requirement_text = dto.requirement_text;
    if (dto.city !== undefined) updatePayload.city = dto.city;
    if (dto.state !== undefined) updatePayload.state = dto.state;
    if (dto.zone_id !== undefined) updatePayload.zone_id = dto.zone_id;
    if (dto.region_id !== undefined) updatePayload.region_id = dto.region_id;
    if (dto.category !== undefined) updatePayload.category = dto.category.toLowerCase();
    if (dto.quantity !== undefined) updatePayload.quantity = dto.quantity;
    if (dto.bidder_turnover !== undefined) updatePayload.bidder_turnover = dto.bidder_turnover;
    if (dto.oem_turnover !== undefined) updatePayload.oem_turnover = dto.oem_turnover;
    if (dto.emd_fee !== undefined) updatePayload.emd_fee = dto.emd_fee;
    if (dto.portal !== undefined) updatePayload.portal = dto.portal;
    if (dto.reference_number !== undefined) updatePayload.reference_number = dto.reference_number;
    if (dto.estimated_value !== undefined) updatePayload.estimated_value = dto.estimated_value;
    if (dto.tender_value !== undefined) updatePayload.tender_value = dto.tender_value;
    if (pubDate !== undefined) updatePayload.publish_date = pubDate;
    if (dto.bid_start_date !== undefined) updatePayload.bid_start_date = dto.bid_start_date;
    if (closeDate !== undefined) updatePayload.bid_closing_date = closeDate;
    if (dto.submission_date !== undefined) updatePayload.submission_date = dto.submission_date;
    if (dto.result_date !== undefined) updatePayload.result_date = dto.result_date;
    if (dto.prebid_date !== undefined) updatePayload.prebid_date = dto.prebid_date;
    if (dto.corrigendum_date !== undefined) updatePayload.corrigendum_date = dto.corrigendum_date;
    if (assignedTo !== undefined) updatePayload.assigned_to = assignedTo;
    if (dto.tender_owner_id !== undefined) updatePayload.tender_owner_id = dto.tender_owner_id;
    if (dto.remarks !== undefined) updatePayload.remarks = dto.remarks;
    if (dto.rejection_reason !== undefined) updatePayload.rejection_reason = dto.rejection_reason;

    const updated = await this.db.transaction().execute(async (trx) => {
      const res = await trx
        .updateTable('tenders')
        .set(updatePayload)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Activity record
      await trx
        .insertInto('tender_activities')
        .values({
          tender_id: id,
          event_type: isNewAssignment ? 'ASSIGNED' : 'UPDATED',
          description: isNewAssignment
            ? `Tender assigned to user ID ${assignedTo}`
            : `Tender details updated`,
          performed_by: user.id,
          metadata: { changes: Object.keys(dto) },
        })
        .execute();

      // Outbox Event
      await this.outboxService.queueEvent(trx, {
        eventType: isNewAssignment ? AppEvents.TENDER_ASSIGNED : AppEvents.TENDER_UPDATED,
        aggregateType: 'TENDER',
        aggregateId: id,
        actorId: user.id,
        payload: {
          tenderId: id,
          tenderNo: res.tender_no,
          assignedTo: res.assigned_to,
          tenderOwnerId: res.tender_owner_id,
          changes: Object.keys(dto),
        },
      });

      return res;
    });

    this.outboxService.triggerImmediate();
    return this.findOne(id);
  }

  /**
   * Advance tender lifecycle stage with centralized state machine validation
   */
  async changeStatus(id: string, dto: ChangeTenderStatusDto, user: AuthUser) {
    const existing = await this.findOne(id);
    const requestedStatus = dto.status || dto.target_status;
    if (!requestedStatus) {
      throw new BadRequestException('Tender status is required');
    }

    // Validate state transition through workflow engine
    const { from, to } = this.workflowService.assertValidTransition(
      existing.status,
      requestedStatus,
      user,
      {
        rejection_reason: dto.rejection_reason || dto.remarks,
        loss_reason: dto.loss_reason,
        value_lakh: dto.value_lakh,
      },
    );

    const updatePayload: any = {
      status: to,
      updated_at: sql`NOW()`,
    };

    if (dto.remarks) updatePayload.remarks = dto.remarks;
    if (dto.rejection_reason) updatePayload.rejection_reason = dto.rejection_reason;
    if (dto.submission_date) updatePayload.submission_date = dto.submission_date;
    if (to === 'submitted' && !updatePayload.submission_date) {
      updatePayload.submission_date = new Date().toISOString().split('T')[0];
    }
    if (dto.result_date) updatePayload.result_date = dto.result_date;
    if (['won', 'lost'].includes(to) && !updatePayload.result_date) {
      updatePayload.result_date = new Date().toISOString().split('T')[0];
    }

    const updated = await this.db.transaction().execute(async (trx) => {
      const res = await trx
        .updateTable('tenders')
        .set(updatePayload)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Record in tender_status_history
      await trx
        .insertInto('tender_status_history')
        .values({
          tender_id: id,
          from_status: from,
          to_status: to,
          changed_by: user.id,
          remarks: dto.remarks || null,
        })
        .execute();

      // Activity record
      await trx
        .insertInto('tender_activities')
        .values({
          tender_id: id,
          event_type: 'STATUS_CHANGE',
          description: `Stage changed: ${this.workflowService.getStatusLabel(from)} → ${this.workflowService.getStatusLabel(to)}`,
          performed_by: user.id,
          metadata: {
            from_status: from,
            to_status: to,
            remarks: dto.remarks || null,
            loss_reason: dto.loss_reason || null,
          },
        })
        .execute();

      // Record outcome if transitioning to won/lost
      if (['won', 'lost'].includes(to)) {
        await trx
          .insertInto('tender_outcomes')
          .values({
            tender_id: id,
            result: to,
            reason: dto.loss_reason || dto.remarks || null,
            competitor: dto.competitor || null,
            value_lakh: dto.value_lakh || null,
            result_date: updatePayload.result_date,
          })
          .execute();
      }

      // Determine specific event type
      let specificEventType: string = AppEvents.TENDER_STATUS_CHANGED;
      if (to === 'submitted') specificEventType = AppEvents.TENDER_SUBMITTED;
      else if (to === 'won') specificEventType = AppEvents.TENDER_WON;
      else if (to === 'lost') specificEventType = AppEvents.TENDER_LOST;
      else if (to === 'cancelled') specificEventType = AppEvents.TENDER_CANCELLED;
      else if (to === 'on_hold') specificEventType = AppEvents.TENDER_ON_HOLD;
      else if (to === 'under_preparation') specificEventType = AppEvents.TENDER_PREPARATION_STARTED;
      else if (to === 'pq_submitted') specificEventType = AppEvents.TENDER_PQ_SUBMITTED;
      else if (to === 'pq_qualified') specificEventType = AppEvents.TENDER_PQ_QUALIFIED;

      // Queue Outbox Events
      await this.outboxService.queueEvent(trx, {
        eventType: AppEvents.TENDER_STATUS_CHANGED,
        aggregateType: 'TENDER',
        aggregateId: id,
        actorId: user.id,
        payload: {
          tenderId: id,
          tenderNo: existing.tender_no,
          fromStatus: from,
          toStatus: to,
          remarks: dto.remarks,
        },
      });

      if (specificEventType !== AppEvents.TENDER_STATUS_CHANGED) {
        await this.outboxService.queueEvent(trx, {
          eventType: specificEventType,
          aggregateType: 'TENDER',
          aggregateId: id,
          actorId: user.id,
          payload: {
            tenderId: id,
            tenderNo: existing.tender_no,
            status: to,
            lossReason: dto.loss_reason,
            valueLakh: dto.value_lakh,
          },
        });
      }

      return res;
    });

    this.outboxService.triggerImmediate();
    return this.findOne(id);
  }

  /**
   * Request internal participation approval
   */
  async requestApproval(id: string, remarks: string | undefined, user: AuthUser) {
    const existing = await this.findOne(id);

    if (existing.status !== 'identified' && existing.status !== 'rejected_internally') {
      throw new BadRequestException(
        `Cannot request approval from stage "${this.workflowService.getStatusLabel(existing.status)}"`,
      );
    }

    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('tenders')
        .set({
          status: 'awaiting_approval',
          updated_at: sql`NOW()`,
        })
        .where('id', '=', id)
        .execute();

      await trx
        .insertInto('tender_approvals')
        .values({
          tender_id: id,
          requested_by: user.id,
          status: 'PENDING',
          remarks: remarks || null,
        })
        .execute();

      await trx
        .insertInto('tender_activities')
        .values({
          tender_id: id,
          event_type: 'APPROVAL_REQUESTED',
          description: `Internal participation approval requested by ${user.full_name}`,
          performed_by: user.id,
          metadata: { remarks },
        })
        .execute();

      await this.outboxService.queueEvent(trx, {
        eventType: AppEvents.TENDER_APPROVAL_REQUESTED,
        aggregateType: 'TENDER',
        aggregateId: id,
        actorId: user.id,
        payload: {
          tenderId: id,
          tenderNo: existing.tender_no,
          orgName: existing.organisation_name,
          actorId: user.id,
        },
      });
    });

    this.outboxService.triggerImmediate();
    return this.findOne(id);
  }

  /**
   * Approve or reject tender participation decision
   */
  async approveParticipation(id: string, dto: ApproveTenderDto, user: AuthUser) {
    const tender = await this.findOne(id);

    // Self-approval prohibition
    assertNotSelfApproval(user.id, tender.assigned_to);

    // Regional scope check
    if (user.role === 'regional_manager') {
      assertRegionScope(user, tender.region_id, tender.zone_id);
    }

    const decision = dto.decision.toLowerCase().trim();
    if (decision !== 'approved' && decision !== 'rejected') {
      throw new BadRequestException('Decision must be either "approved" or "rejected"');
    }

    if (decision === 'rejected' && !dto.rejection_reason?.trim() && !dto.remarks?.trim()) {
      throw new BadRequestException('A reason is mandatory when rejecting tender participation');
    }

    const toStatus: TenderStatus = decision === 'approved' ? 'under_preparation' : 'rejected_internally';
    const reason = dto.rejection_reason || dto.remarks || null;

    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('tenders')
        .set({
          status: toStatus,
          approval_date: decision === 'approved' ? sql`NOW()` : null,
          internal_approval_by: user.id,
          internal_approval_at: sql`NOW()`,
          rejection_reason: decision === 'rejected' ? reason : null,
          updated_at: sql`NOW()`,
        })
        .where('id', '=', id)
        .execute();

      // Record approval entry
      await trx
        .insertInto('tender_approvals')
        .values({
          tender_id: id,
          requested_by: tender.assigned_to || tender.created_by || user.id,
          approver_id: user.id,
          status: decision.toUpperCase(),
          responded_at: new Date(),
          remarks: dto.remarks || null,
          rejection_reason: decision === 'rejected' ? reason : null,
        })
        .execute();

      // Record in status history
      await trx
        .insertInto('tender_status_history')
        .values({
          tender_id: id,
          from_status: tender.status,
          to_status: toStatus,
          changed_by: user.id,
          remarks: `Internal decision: ${decision.toUpperCase()}. ${dto.remarks || ''}`,
        })
        .execute();

      // Activity entry
      await trx
        .insertInto('tender_activities')
        .values({
          tender_id: id,
          event_type: decision === 'approved' ? 'APPROVED' : 'REJECTED',
          description: `Tender participation ${decision.toUpperCase()} by ${user.full_name}`,
          performed_by: user.id,
          metadata: { decision, remarks: dto.remarks, reason },
        })
        .execute();

      // Queue outbox domain event
      const eventType = decision === 'approved' ? AppEvents.TENDER_APPROVED : AppEvents.TENDER_REJECTED;
      await this.outboxService.queueEvent(trx, {
        eventType,
        aggregateType: 'TENDER',
        aggregateId: id,
        actorId: user.id,
        payload: {
          tenderId: id,
          tenderNo: tender.tender_no,
          approverId: user.id,
          approverName: user.full_name,
          decision,
          rejectionReason: reason,
          remarks: dto.remarks,
          tenderOwnerId: tender.tender_owner_id || tender.assigned_to,
        },
      });
    });

    this.outboxService.triggerImmediate();
    return this.findOne(id);
  }

  /**
   * Record structured win/loss outcome with mandatory loss reasoning
   */
  async recordOutcome(id: string, dto: RecordTenderOutcomeDto, user: AuthUser) {
    const tender = await this.findOne(id);
    const result = dto.result.toLowerCase().trim();

    if (result !== 'won' && result !== 'lost') {
      throw new BadRequestException('Result must be either "won" or "lost"');
    }

    const lossReason = dto.loss_reason || dto.reason;
    if (result === 'lost' && !lossReason?.trim()) {
      throw new BadRequestException('A structured loss reason is mandatory when recording a lost tender');
    }

    const resultDate = dto.result_date || new Date().toISOString().split('T')[0];

    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('tenders')
        .set({
          status: result as any,
          result_date: resultDate,
          tender_value: dto.value_lakh ? dto.value_lakh * 100000 : null,
          updated_at: sql`NOW()`,
        })
        .where('id', '=', id)
        .execute();

      // Check existing outcome record
      const existingOutcome = await trx
        .selectFrom('tender_outcomes')
        .select('id')
        .where('tender_id', '=', id)
        .executeTakeFirst();

      if (existingOutcome) {
        await trx
          .updateTable('tender_outcomes')
          .set({
            result,
            reason: lossReason || null,
            competitor: dto.competitor || null,
            value_lakh: dto.value_lakh || null,
            result_date: resultDate,
          })
          .where('id', '=', existingOutcome.id)
          .execute();
      } else {
        await trx
          .insertInto('tender_outcomes')
          .values({
            tender_id: id,
            result,
            reason: lossReason || null,
            competitor: dto.competitor || null,
            value_lakh: dto.value_lakh || null,
            result_date: resultDate,
          })
          .execute();
      }

      await trx
        .insertInto('tender_status_history')
        .values({
          tender_id: id,
          from_status: tender.status,
          to_status: result,
          changed_by: user.id,
          remarks: `Outcome: ${result.toUpperCase()}${lossReason ? ` - ${lossReason}` : ''}`,
        })
        .execute();

      await trx
        .insertInto('tender_activities')
        .values({
          tender_id: id,
          event_type: result === 'won' ? 'WON' : 'LOST',
          description: `Tender recorded as ${result.toUpperCase()}`,
          performed_by: user.id,
          metadata: {
            result,
            loss_reason: lossReason,
            competitor: dto.competitor,
            value_lakh: dto.value_lakh,
          },
        })
        .execute();

      const eventType = result === 'won' ? AppEvents.TENDER_WON : AppEvents.TENDER_LOST;
      await this.outboxService.queueEvent(trx, {
        eventType,
        aggregateType: 'TENDER',
        aggregateId: id,
        actorId: user.id,
        payload: {
          tenderId: id,
          tenderNo: tender.tender_no,
          result,
          lossReason,
          competitor: dto.competitor,
          valueLakh: dto.value_lakh,
          resultDate,
        },
      });
    });

    this.outboxService.triggerImmediate();
    const updated = await this.findOne(id);
    return {
      ...updated,
      result,
      reason: lossReason,
      competitor: dto.competitor,
      value_lakh: dto.value_lakh,
    };
  }

  /**
   * Log external portal issue (GeM / CPPP glitches, spec discrepancy)
   */
  async createPortalIssue(tenderId: string, dto: CreateTenderPortalIssueDto, user: AuthUser) {
    await this.findOne(tenderId);

    const issue = await this.db.transaction().execute(async (trx) => {
      const created = await trx
        .insertInto('tender_portal_issues')
        .values({
          tender_id: tenderId,
          issue: dto.issue.trim(),
          reported_date: dto.reported_date || new Date().toISOString().split('T')[0],
          reported_by: user.id,
          responsible_person_id: dto.responsible_person_id || user.id,
          escalated_to: dto.escalated_to || null,
          escalation_date: dto.escalated_to ? new Date() : null,
          resolution_status: (dto.resolution_status || 'OPEN').toUpperCase(),
          resolution: dto.resolution || null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('tender_activities')
        .values({
          tender_id: tenderId,
          event_type: 'PORTAL_ISSUE_CREATED',
          description: `Portal issue reported: ${dto.issue.slice(0, 80)}`,
          performed_by: user.id,
          metadata: { issueId: created.id, status: created.resolution_status },
        })
        .execute();

      await this.outboxService.queueEvent(trx, {
        eventType: AppEvents.TENDER_PORTAL_ISSUE_CREATED,
        aggregateType: 'TENDER',
        aggregateId: tenderId,
        actorId: user.id,
        payload: {
          tenderId,
          issueId: created.id,
          issue: created.issue,
          reportedBy: user.id,
        },
      });

      return created;
    });

    this.outboxService.triggerImmediate();
    return issue;
  }

  /**
   * Update or escalate/resolve external portal issue
   */
  async updatePortalIssue(
    tenderId: string,
    issueId: string,
    dto: UpdateTenderPortalIssueDto,
    user: AuthUser,
  ) {
    const tender = await this.findOne(tenderId);

    const existingIssue = await this.db
      .selectFrom('tender_portal_issues')
      .selectAll()
      .where('id', '=', issueId)
      .where('tender_id', '=', tenderId)
      .executeTakeFirst();

    if (!existingIssue) {
      throw new NotFoundException(`Portal issue ${issueId} not found on tender ${tenderId}`);
    }

    const updatePayload: any = {
      updated_at: sql`NOW()`,
    };

    if (dto.issue) updatePayload.issue = dto.issue;
    if (dto.responsible_person_id) updatePayload.responsible_person_id = dto.responsible_person_id;
    if (dto.resolution_status) {
      updatePayload.resolution_status = dto.resolution_status.toUpperCase();
      if (['RESOLVED', 'CLOSED'].includes(updatePayload.resolution_status)) {
        updatePayload.resolved_at = new Date();
      }
    }
    if (dto.resolution) updatePayload.resolution = dto.resolution;
    if (dto.escalated_to && dto.escalated_to !== existingIssue.escalated_to) {
      updatePayload.escalated_to = dto.escalated_to;
      updatePayload.escalation_date = new Date();
      updatePayload.resolution_status = 'ESCALATED';
    }

    const updatedIssue = await this.db.transaction().execute(async (trx) => {
      const res = await trx
        .updateTable('tender_portal_issues')
        .set(updatePayload)
        .where('id', '=', issueId)
        .returningAll()
        .executeTakeFirstOrThrow();

      const isResolved = ['RESOLVED', 'CLOSED'].includes(res.resolution_status);
      const isEscalated = res.resolution_status === 'ESCALATED';

      let eventType: string = AppEvents.TENDER_PORTAL_ISSUE_CREATED;
      if (isResolved) eventType = AppEvents.TENDER_PORTAL_ISSUE_RESOLVED;
      else if (isEscalated) eventType = AppEvents.TENDER_PORTAL_ISSUE_ESCALATED;

      await trx
        .insertInto('tender_activities')
        .values({
          tender_id: tenderId,
          event_type: eventType,
          description: `Portal issue updated: status=${res.resolution_status}`,
          performed_by: user.id,
          metadata: { issueId, resolution_status: res.resolution_status },
        })
        .execute();

      await this.outboxService.queueEvent(trx, {
        eventType,
        aggregateType: 'TENDER',
        aggregateId: tenderId,
        actorId: user.id,
        payload: {
          tenderId,
          tenderNo: tender.tender_no,
          issueId,
          status: res.resolution_status,
          escalatedTo: res.escalated_to,
        },
      });

      return res;
    });

    this.outboxService.triggerImmediate();
    return updatedIssue;
  }

  /**
   * Get all portal issues for a tender
   */
  async getPortalIssues(tenderId: string) {
    await this.findOne(tenderId);
    return this.db
      .selectFrom('tender_portal_issues')
      .leftJoin('users as rep', 'tender_portal_issues.reported_by', 'rep.id')
      .leftJoin('users as resp', 'tender_portal_issues.responsible_person_id', 'resp.id')
      .selectAll('tender_portal_issues')
      .select([
        'rep.full_name as reported_by_name',
        'resp.full_name as responsible_name',
        'tender_portal_issues.escalated_to as escalated_to_name',
      ])
      .where('tender_id', '=', tenderId)
      .orderBy('tender_portal_issues.created_at', 'desc')
      .execute();
  }

  /**
   * Get complete audit history / activity timeline for a tender
   */
  async getActivities(tenderId: string) {
    await this.findOne(tenderId);
    return this.db
      .selectFrom('tender_activities')
      .leftJoin('users', 'tender_activities.performed_by', 'users.id')
      .selectAll('tender_activities')
      .select('users.full_name as performed_by_name')
      .where('tender_id', '=', tenderId)
      .orderBy('tender_activities.created_at', 'desc')
      .execute();
  }

  /**
   * Backwards compatible stats endpoint (/api/tenders/stats)
   */
  async getStats(user: AuthUser) {
    const dash = await this.getDashboard(user);
    return {
      total: dash.total_tenders,
      active: dash.worked_upon,
      closingSoon: dash.upcoming_deadlines,
      awaitingApproval: dash.pending_approvals,
      pqCount: dash.pq_tenders,
      generalMhaCount: dash.general_mha_tenders,
      generalCount: dash.general_mha_tenders,
    };
  }

  /**
   * Comprehensive Executive Dashboard Metrics with Win Rate calculation
   */
  async getDashboard(user: AuthUser) {
    let baseQuery = this.db
      .selectFrom('tenders')
      .where('tenders.is_deleted', '=', false);

    if (user.role === 'regional_manager' && user.zone_id) {
      baseQuery = baseQuery.where('tenders.zone_id', '=', user.zone_id);
    } else if (user.role === 'sales' && user.region_id) {
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb('tenders.region_id', '=', user.region_id),
          eb('tenders.assigned_to', '=', user.id),
        ]),
      );
    }

    const metrics = await baseQuery
      .select([
        sql<number>`count(tenders.id)::int`.as('total_tenders'),
        sql<number>`count(case when tenders.category::text ilike 'pq%' then 1 end)::int`.as('pq_tenders'),
        sql<number>`count(case when tenders.category::text ilike 'general%' then 1 end)::int`.as('general_mha_tenders'),
        sql<number>`count(case when tenders.category::text not ilike 'pq%' and tenders.category::text not ilike 'general%' then 1 end)::int`.as('other_tenders'),
        sql<number>`count(case when tenders.status in ('under_preparation', 'pq_submitted', 'pq_qualified', 'submitted', 'technical_eval', 'commercial_eval') then 1 end)::int`.as('worked_upon'),
        sql<number>`count(case when tenders.status in ('submitted', 'technical_eval', 'commercial_eval') then 1 end)::int`.as('tenders_submitted'),
        sql<number>`count(case when tenders.status in ('won') then 1 end)::int`.as('tenders_won'),
        sql<number>`count(case when tenders.status in ('lost') then 1 end)::int`.as('tenders_lost'),
        sql<number>`count(case when tenders.status not in ('won', 'lost', 'cancelled') then 1 end)::int`.as('pending_tenders'),
        sql<number>`count(case when tenders.status in ('awaiting_approval') then 1 end)::int`.as('pending_approvals'),
        sql<number>`count(case when tenders.status in ('submitted', 'technical_eval', 'commercial_eval') then 1 end)::int`.as('result_followups'),
        // Deadlines
        sql<number>`count(case when tenders.status not in ('won', 'lost', 'cancelled') and tenders.bid_closing_date is not null and tenders.bid_closing_date >= NOW() and tenders.bid_closing_date <= NOW() + make_interval(days => ${TENDER_UPCOMING_DAYS}) then 1 end)::int`.as('upcoming_deadlines'),
        sql<number>`count(case when tenders.status not in ('won', 'lost', 'cancelled') and tenders.bid_closing_date is not null and tenders.bid_closing_date >= NOW() and tenders.bid_closing_date <= NOW() + make_interval(hours => ${TENDER_URGENT_HOURS}) then 1 end)::int`.as('urgent_deadlines'),
        sql<number>`count(case when tenders.status not in ('won', 'lost', 'cancelled') and tenders.bid_closing_date is not null and tenders.bid_closing_date < NOW() then 1 end)::int`.as('overdue_tenders'),
      ])
      .executeTakeFirst();

    // Open portal issues count
    const portalIssuesCount = await this.db
      .selectFrom('tender_portal_issues')
      .select(sql<number>`count(id)::int`.as('count'))
      .where('resolution_status', 'in', ['OPEN', 'IN_PROGRESS', 'ESCALATED'])
      .executeTakeFirst();

    const won = metrics?.tenders_won || 0;
    const lost = metrics?.tenders_lost || 0;
    const denominator = won + lost;
    const winRate = denominator > 0 ? Math.round((won / denominator) * 100) : 0;

    return {
      total_tenders: metrics?.total_tenders || 0,
      pq_tenders: metrics?.pq_tenders || 0,
      general_mha_tenders: metrics?.general_mha_tenders || 0,
      other_tenders: metrics?.other_tenders || 0,
      worked_upon: metrics?.worked_upon || 0,
      tenders_submitted: metrics?.tenders_submitted || 0,
      tenders_won: won,
      tenders_lost: lost,
      pending_tenders: metrics?.pending_tenders || 0,
      pending_approvals: metrics?.pending_approvals || 0,
      upcoming_deadlines: metrics?.upcoming_deadlines || 0,
      urgent_deadlines: metrics?.urgent_deadlines || 0,
      overdue_tenders: metrics?.overdue_tenders || 0,
      result_followups: metrics?.result_followups || 0,
      open_portal_issues: portalIssuesCount?.count || 0,
      win_rate: winRate,
    };
  }

  /**
   * Pipeline report: breakdown across all lifecycle stages with counts and values
   */
  async getPipelineReport(user: AuthUser) {
    let baseQuery = this.db
      .selectFrom('tenders')
      .where('tenders.is_deleted', '=', false);

    if (user.role === 'regional_manager' && user.zone_id) {
      baseQuery = baseQuery.where('tenders.zone_id', '=', user.zone_id);
    }

    const stages = await baseQuery
      .select([
        'tenders.status',
        sql<number>`count(tenders.id)::int`.as('count'),
        sql<number>`coalesce(sum(tenders.estimated_value), 0)::numeric`.as('total_estimated_value'),
        sql<number>`coalesce(sum(tenders.tender_value), 0)::numeric`.as('total_tender_value'),
      ])
      .groupBy('tenders.status')
      .execute();

    const categories = await baseQuery
      .select([
        sql<string>`tenders.category::text`.as('category'),
        sql<number>`count(tenders.id)::int`.as('count'),
      ])
      .groupBy(sql`tenders.category::text`)
      .execute();

    const total = stages.reduce((sum, s) => sum + Number(s.count), 0);
    return {
      total,
      stages,
      categories,
    };
  }

  /**
   * Win/Loss Report with loss reason distribution and competitor insights
   */
  async getWinLossReport(user: AuthUser) {
    const outcomes = await this.db
      .selectFrom('tender_outcomes')
      .leftJoin('tenders', 'tender_outcomes.tender_id', 'tenders.id')
      .select([
        'tender_outcomes.result',
        'tender_outcomes.reason',
        'tender_outcomes.competitor',
        'tender_outcomes.value_lakh',
        'tenders.category',
      ])
      .where('tenders.is_deleted', '=', false)
      .execute();

    let wonCount = 0;
    let lostCount = 0;
    const lossReasons: Record<string, number> = {};
    const competitors: Record<string, number> = {};

    for (const o of outcomes) {
      if (o.result === 'won') {
        wonCount++;
      } else if (o.result === 'lost') {
        lostCount++;
        const r = o.reason || 'UNSPECIFIED';
        lossReasons[r] = (lossReasons[r] || 0) + 1;
        if (o.competitor) {
          competitors[o.competitor] = (competitors[o.competitor] || 0) + 1;
        }
      }
    }

    const totalDecided = wonCount + lostCount;
    const winRate = totalDecided > 0 ? Math.round((wonCount / totalDecided) * 100) : 0;

    return {
      won: wonCount,
      won_count: wonCount,
      lost: lostCount,
      lost_count: lostCount,
      total_decided: totalDecided,
      win_rate: winRate,
      reasons: lossReasons,
      loss_reasons: lossReasons,
      competitors,
    };
  }

  /**
   * Zone-wise pipeline report
   */
  async getZoneReport(user: AuthUser) {
    return this.db
      .selectFrom('zones')
      .leftJoin('tenders', (join) =>
        join.onRef('zones.id', '=', 'tenders.zone_id').on('tenders.is_deleted', '=', false),
      )
      .select([
        'zones.id as zone_id',
        'zones.name as zone_name',
        sql<number>`count(tenders.id)::int`.as('total'),
        sql<number>`count(tenders.id)::int`.as('total_tenders'),
        sql<number>`count(case when tenders.status in ('under_preparation', 'awaiting_approval', 'identified') then 1 end)::int`.as('pending'),
        sql<number>`count(case when tenders.status in ('under_preparation', 'awaiting_approval', 'identified') then 1 end)::int`.as('pending_tenders'),
        sql<number>`count(case when tenders.status in ('submitted', 'technical_eval', 'commercial_eval') then 1 end)::int`.as('submitted'),
        sql<number>`count(case when tenders.status in ('submitted', 'technical_eval', 'commercial_eval') then 1 end)::int`.as('submitted_tenders'),
        sql<number>`count(case when tenders.status = 'won' then 1 end)::int`.as('won'),
        sql<number>`count(case when tenders.status = 'won' then 1 end)::int`.as('won_tenders'),
        sql<number>`count(case when tenders.status = 'lost' then 1 end)::int`.as('lost'),
        sql<number>`count(case when tenders.status = 'lost' then 1 end)::int`.as('lost_tenders'),
      ])
      .groupBy(['zones.id', 'zones.name'])
      .orderBy('zones.name', 'asc')
      .execute();
  }

  /**
   * Region-wise pipeline report
   */
  async getRegionReport(user: AuthUser) {
    return this.db
      .selectFrom('regions')
      .leftJoin('zones', 'regions.zone_id', 'zones.id')
      .leftJoin('tenders', (join) =>
        join.onRef('regions.id', '=', 'tenders.region_id').on('tenders.is_deleted', '=', false),
      )
      .select([
        'regions.id as region_id',
        'regions.name as region_name',
        'zones.name as zone_name',
        sql<number>`count(tenders.id)::int`.as('total'),
        sql<number>`count(tenders.id)::int`.as('total_tenders'),
        sql<number>`count(case when tenders.status in ('under_preparation', 'awaiting_approval', 'identified') then 1 end)::int`.as('pending'),
        sql<number>`count(case when tenders.status in ('under_preparation', 'awaiting_approval', 'identified') then 1 end)::int`.as('pending_tenders'),
        sql<number>`count(case when tenders.status in ('submitted', 'technical_eval', 'commercial_eval') then 1 end)::int`.as('submitted'),
        sql<number>`count(case when tenders.status in ('submitted', 'technical_eval', 'commercial_eval') then 1 end)::int`.as('submitted_tenders'),
        sql<number>`count(case when tenders.status = 'won' then 1 end)::int`.as('won'),
        sql<number>`count(case when tenders.status = 'won' then 1 end)::int`.as('won_tenders'),
        sql<number>`count(case when tenders.status = 'lost' then 1 end)::int`.as('lost'),
        sql<number>`count(case when tenders.status = 'lost' then 1 end)::int`.as('lost_tenders'),
      ])
      .groupBy(['regions.id', 'regions.name', 'zones.name'])
      .orderBy('regions.name', 'asc')
      .execute();
  }

  /**
   * Salesperson / Tender Owner pipeline report
   */
  async getSalespersonReport(user: AuthUser) {
    return this.db
      .selectFrom('users')
      .innerJoin('tenders', (join) =>
        join
          .on((eb) =>
            eb.or([
              eb('users.id', '=', eb.ref('tenders.assigned_to')),
              eb('users.id', '=', eb.ref('tenders.tender_owner_id')),
            ]),
          )
          .on('tenders.is_deleted', '=', false),
      )
      .select([
        'users.id as user_id',
        'users.full_name as salesperson_name',
        'users.role',
        sql<number>`count(distinct tenders.id)::int`.as('total'),
        sql<number>`count(distinct tenders.id)::int`.as('total_tenders'),
        sql<number>`count(distinct case when tenders.status in ('under_preparation', 'awaiting_approval', 'identified') then tenders.id end)::int`.as('pending'),
        sql<number>`count(distinct case when tenders.status in ('under_preparation', 'awaiting_approval', 'identified') then tenders.id end)::int`.as('pending_tenders'),
        sql<number>`count(distinct case when tenders.status in ('submitted', 'technical_eval', 'commercial_eval') then tenders.id end)::int`.as('submitted'),
        sql<number>`count(distinct case when tenders.status in ('submitted', 'technical_eval', 'commercial_eval') then tenders.id end)::int`.as('submitted_tenders'),
        sql<number>`count(distinct case when tenders.status = 'won' then tenders.id end)::int`.as('won'),
        sql<number>`count(distinct case when tenders.status = 'won' then tenders.id end)::int`.as('won_tenders'),
        sql<number>`count(distinct case when tenders.status = 'lost' then tenders.id end)::int`.as('lost'),
        sql<number>`count(distinct case when tenders.status = 'lost' then tenders.id end)::int`.as('lost_tenders'),
      ])
      .groupBy(['users.id', 'users.full_name', 'users.role'])
      .orderBy('total', 'desc')
      .execute();
  }
}
