import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Kysely, sql } from 'kysely';
import { KYSELY_DB } from '../../common/database/database.module.js';
import { getPaginationParams, buildPaginatedResult } from '../../common/utils/pagination.js';
import {
  PROPOSAL_INACTIVITY_DAYS,
  type Database,
  type AuthUser,
  type PaginatedResult,
  type ProposalStatus,
} from '@arihant/shared';
import { ProposalsWorkflowService } from './proposals.workflow.js';
import { AppEvents } from '../../common/events/event-names.js';
import {
  CreateProposalDto,
  UpdateProposalDto,
  ChangeProposalStatusDto,
  CreateProposalFollowupDto,
  ProposalQueryDto,
} from './proposals.dto.js';

@Injectable()
export class ProposalsService {
  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<Database>,
    private readonly eventEmitter: EventEmitter2,
    private readonly workflowService: ProposalsWorkflowService,
  ) {}

  /**
   * Helper to normalize statuses in SQL matching
   */
  private getStatusArray(status: string): string[] {
    const norm = this.workflowService.normalizeStatus(status);
    const legacyMap: Record<string, string[]> = {
      PROPOSAL_REQUESTED: ['PROPOSAL_REQUESTED', 'requested'],
      UNDER_PREPARATION: ['UNDER_PREPARATION', 'under_preparation'],
      READY_FOR_REVIEW: ['READY_FOR_REVIEW', 'ready_for_review'],
      APPROVED: ['APPROVED', 'approved'],
      SENT_TO_CUSTOMER: ['SENT_TO_CUSTOMER', 'sent'],
      FOLLOW_UP_REQUIRED: ['FOLLOW_UP_REQUIRED', 'followup_required'],
      CONVERTED: ['CONVERTED', 'converted'],
      CLOSED: ['CLOSED', 'closed'],
      LOST: ['LOST', 'lost'],
    };
    return legacyMap[norm] || [norm];
  }

  /**
   * List proposals with server-side search, filtering, territorial scoping, and sorting
   */
  async findAll(query: ProposalQueryDto, user: AuthUser): Promise<PaginatedResult<any>> {
    const { page, limit, offset } = getPaginationParams(query);

    let baseQuery = this.db
      .selectFrom('proposals')
      .innerJoin('organisations', 'proposals.organisation_id', 'organisations.id')
      .leftJoin('products', 'proposals.product_id', 'products.id')
      .leftJoin('users as requested_user', 'proposals.requested_by', 'requested_user.id')
      .leftJoin('users as responsible_user', 'proposals.responsible_id', 'responsible_user.id')
      .leftJoin('users as followup_user', 'proposals.followup_owner_id', 'followup_user.id')
      .where('proposals.is_deleted', '=', false);

    // Territorial Scoping / RBAC
    const isGlobalRole = ['admin', 'management', 'tender_team'].includes(user.role);
    if (!isGlobalRole) {
      if (user.role === 'regional_manager' && user.region_id) {
        baseQuery = baseQuery.where('organisations.region_id', '=', user.region_id);
      } else {
        // Sales person sees assigned proposals or those in their region
        baseQuery = baseQuery.where((eb) => {
          const conditions = [
            eb('proposals.responsible_id', '=', user.id),
            eb('proposals.requested_by', '=', user.id),
            eb('proposals.followup_owner_id', '=', user.id),
          ];
          if (user.region_id) {
            conditions.push(eb('organisations.region_id', '=', user.region_id));
          }
          return eb.or(conditions);
        });
      }
    }

    // Parameter normalization
    const sectorFilter = query.sector || query.sectorId;
    const responsibleIdFilter = query.responsible_id || query.responsiblePersonId;
    const followupOwnerFilter = query.followup_owner_id || query.followUpOwnerId;
    const followupCondition = query.followup || query.followUp;

    // Status filter
    if (query.status && query.status !== 'all') {
      const statuses = this.getStatusArray(query.status);
      baseQuery = baseQuery.where('proposals.status', 'in', statuses as any);
    }

    // Sector filter
    if (sectorFilter && sectorFilter !== 'all') {
      baseQuery = baseQuery.where('proposals.sector', '=', sectorFilter);
    }

    // Responsible person filter
    if (responsibleIdFilter) {
      baseQuery = baseQuery.where('proposals.responsible_id', '=', responsibleIdFilter);
    }

    // Follow-up owner filter
    if (followupOwnerFilter) {
      baseQuery = baseQuery.where('proposals.followup_owner_id', '=', followupOwnerFilter);
    }

    // Follow-up condition filters
    const closedStatuses = ['CONVERTED', 'converted', 'CLOSED', 'closed', 'LOST', 'lost'];
    const activeFollowupStatuses = ['SENT_TO_CUSTOMER', 'sent', 'FOLLOW_UP_REQUIRED', 'followup_required'];

    if (followupCondition && followupCondition !== 'all') {
      switch (followupCondition) {
        case 'due_today':
          baseQuery = baseQuery
            .where('proposals.status', 'not in', closedStatuses as any)
            .where(sql<boolean>`proposals.next_followup = CURRENT_DATE`);
          break;
        case 'overdue':
          baseQuery = baseQuery
            .where('proposals.status', 'not in', closedStatuses as any)
            .where(sql<boolean>`proposals.next_followup < CURRENT_DATE`);
          break;
        case 'upcoming':
          baseQuery = baseQuery
            .where('proposals.status', 'not in', closedStatuses as any)
            .where(sql<boolean>`proposals.next_followup > CURRENT_DATE`);
          break;
        case 'no_followup':
          baseQuery = baseQuery
            .where('proposals.status', 'in', activeFollowupStatuses as any)
            .where('proposals.next_followup', 'is', null);
          break;
        case 'old_inactivity':
          baseQuery = baseQuery
            .where('proposals.status', 'not in', closedStatuses as any)
            .where(sql<boolean>`proposals.updated_at <= NOW() - make_interval(days => ${PROPOSAL_INACTIVITY_DAYS})`);
          break;
      }
    }

    // Date range filter
    const rawDateField = query.date_field;
    const dateFieldMap: Record<string, string> = {
      request_date: 'request_date',
      requestDate: 'request_date',
      required_date: 'required_date',
      requiredDate: 'required_date',
      sent_date: 'sent_date',
      sentDate: 'sent_date',
      next_followup: 'next_followup',
      nextFollowup: 'next_followup',
    };
    const dateField = rawDateField ? dateFieldMap[rawDateField] || 'request_date' : 'request_date';

    if (query.from_date) {
      baseQuery = baseQuery.where(`proposals.${dateField}` as any, '>=', query.from_date);
    }
    if (query.to_date) {
      baseQuery = baseQuery.where(`proposals.${dateField}` as any, '<=', query.to_date);
    }

    // Search filter across proposal number, customer, product, requested by, responsible person, and reference
    if (query.search && query.search.trim()) {
      const s = `%${query.search.trim().toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          sql<boolean>`LOWER(proposals.proposal_number) LIKE ${s}`,
          sql<boolean>`LOWER(organisations.name) LIKE ${s}`,
          sql<boolean>`LOWER(products.name) LIKE ${s}`,
          sql<boolean>`LOWER(proposals.reference) LIKE ${s}`,
          sql<boolean>`LOWER(requested_user.full_name) LIKE ${s}`,
          sql<boolean>`LOWER(responsible_user.full_name) LIKE ${s}`,
        ]),
      );
    }

    // Total count query
    const countRes = await baseQuery
      .select(sql<number>`count(proposals.id)::int`.as('total'))
      .executeTakeFirst();
    const total = countRes?.total || 0;

    // Sorting
    const rawSort = query.sort_by || query.sortBy || 'updated_at';
    const sortMap: Record<string, string> = {
      updated_at: 'updated_at',
      updatedAt: 'updated_at',
      created_at: 'created_at',
      createdAt: 'created_at',
      request_date: 'request_date',
      requestDate: 'request_date',
      required_date: 'required_date',
      requiredDate: 'required_date',
      sent_date: 'sent_date',
      sentDate: 'sent_date',
      next_followup: 'next_followup',
      nextFollowUp: 'next_followup',
      nextFollowup: 'next_followup',
    };
    const sortBy = sortMap[rawSort] || 'updated_at';
    const rawOrder = (query.sort_order || query.sortOrder || 'desc').toLowerCase();
    const sortOrder = rawOrder === 'asc' ? 'asc' : 'desc';

    const proposals = await baseQuery
      .select([
        'proposals.id',
        'proposals.proposal_number',
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
        'proposals.approved_at',
        'proposals.approved_by',
        'proposals.version',
        'proposals.reference',
        'proposals.status',
        'proposals.last_followup',
        'proposals.next_followup',
        'proposals.outcome',
        'proposals.lost_reason',
        'proposals.lost_remarks',
        'proposals.converted_to',
        'proposals.converted_reference',
        'proposals.remarks',
        'proposals.created_at',
        'proposals.updated_at',
        'organisations.name as organisation_name',
        'organisations.city as organisation_city',
        'products.name as product_name',
        'requested_user.full_name as requested_by_name',
        'responsible_user.full_name as responsible_name',
        'followup_user.full_name as followup_owner_name',
      ])
      .orderBy(`proposals.${sortBy}` as any, sortOrder)
      .limit(limit)
      .offset(offset)
      .execute();

    return buildPaginatedResult(proposals, total, page, limit);
  }

  /**
   * Get single proposal by ID with complete relations
   */
  async findOne(id: string) {
    const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !UUID_PATTERN.test(id)) {
      throw new NotFoundException('Proposal not found');
    }

    const proposal = await this.db
      .selectFrom('proposals')
      .innerJoin('organisations', 'proposals.organisation_id', 'organisations.id')
      .leftJoin('products', 'proposals.product_id', 'products.id')
      .leftJoin('users as requested_user', 'proposals.requested_by', 'requested_user.id')
      .leftJoin('users as responsible_user', 'proposals.responsible_id', 'responsible_user.id')
      .leftJoin('users as followup_user', 'proposals.followup_owner_id', 'followup_user.id')
      .leftJoin('users as approver_user', 'proposals.approved_by', 'approver_user.id')
      .leftJoin('users as creator_user', 'proposals.created_by', 'creator_user.id')
      .selectAll('proposals')
      .select([
        'organisations.name as organisation_name',
        'organisations.city as organisation_city',
        'organisations.state as organisation_state',
        'products.name as product_name',
        'products.category as product_category',
        'requested_user.full_name as requested_by_name',
        'responsible_user.full_name as responsible_name',
        'followup_user.full_name as followup_owner_name',
        'approver_user.full_name as approved_by_name',
        'creator_user.full_name as created_by_name',
      ])
      .where('proposals.id', '=', id)
      .where('proposals.is_deleted', '=', false)
      .executeTakeFirst();

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    return proposal;
  }

  /**
   * Create proposal request with validation, safe sequence number, and audit logging
   */
  async create(dto: CreateProposalDto, user: AuthUser) {
    // 1. Validate customer existence
    const org = await this.db
      .selectFrom('organisations')
      .select(['id', 'name'])
      .where('id', '=', dto.organisation_id)
      .executeTakeFirst();
    if (!org) {
      throw new NotFoundException(`Customer organisation with ID ${dto.organisation_id} not found`);
    }

    // 2. Validate product existence
    const product = await this.db
      .selectFrom('products')
      .select(['id', 'name'])
      .where('id', '=', dto.product_id)
      .executeTakeFirst();
    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.product_id} not found`);
    }

    // 3. Validate responsible person existence
    const responsible = await this.db
      .selectFrom('users')
      .select(['id', 'full_name'])
      .where('id', '=', dto.responsible_id)
      .executeTakeFirst();
    if (!responsible) {
      throw new NotFoundException(`Responsible proposal person with ID ${dto.responsible_id} not found`);
    }

    // 4. Validate dates
    const requestDate = dto.request_date || new Date().toISOString().split('T')[0];
    if (dto.required_date && dto.required_date < requestDate) {
      throw new BadRequestException('Required completion date cannot be before request date');
    }

    const requestedBy = dto.requested_by || user.id;
    const followupOwner = dto.followup_owner_id || dto.responsible_id || user.id;

    // 5. Generate proposal number & insert proposal atomically in transaction
    const proposal = await this.db.transaction().execute(async (trx) => {
      // Get next proposal sequence number safely, ensuring no duplicate collision
      let proposalNumber = '';
      for (let attempt = 0; attempt < 50; attempt++) {
        const seqRes = await sql<{ next_num: string }>`SELECT ('PROP-2026-' || LPAD(nextval('proposal_no_seq')::text, 4, '0')) as next_num`.execute(trx);
        const candidate = seqRes.rows[0]?.next_num;
        const exists = await trx
          .selectFrom('proposals')
          .select('id')
          .where('proposal_number', '=', candidate)
          .executeTakeFirst();
        if (!exists) {
          proposalNumber = candidate;
          break;
        }
      }
      if (!proposalNumber) {
        throw new Error('Failed to generate unique proposal number');
      }

      const created = await trx
        .insertInto('proposals')
        .values({
          proposal_number: proposalNumber,
          organisation_id: dto.organisation_id,
          lead_id: dto.lead_id || null,
          product_id: dto.product_id,
          sector: dto.sector,
          requested_by: requestedBy,
          responsible_id: dto.responsible_id,
          followup_owner_id: followupOwner,
          request_date: requestDate,
          required_date: dto.required_date,
          sent_date: dto.sent_date || null,
          version: dto.version || 'v1.0',
          reference: dto.reference || null,
          status: 'PROPOSAL_REQUESTED',
          next_followup: dto.next_followup || null,
          remarks: dto.remarks || null,
          created_by: user.id,
          updated_by: user.id,
          is_deleted: false,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Record activity history
      await trx
        .insertInto('proposal_activities')
        .values({
          proposal_id: created.id,
          action: 'CREATED',
          old_value: null,
          new_value: `Proposal ${created.proposal_number} created`,
          performed_by: user.id,
          metadata: {
            proposal_number: created.proposal_number,
            customer: org.name,
            product: product.name,
            required_date: created.required_date,
          },
        })
        .execute();

      return created;
    });

    const foundProposal = await this.findOne(proposal.id);

    this.eventEmitter.emit(AppEvents.PROPOSAL_CREATED, {
      proposalId: proposal.id,
      proposalNumber: foundProposal.proposal_number,
      customerName: foundProposal.organisation_name,
      responsibleId: foundProposal.responsible_id,
      requestedBy: foundProposal.requested_by,
      followUpOwnerId: foundProposal.followup_owner_id,
      actorId: user.id,
      actorName: user.full_name,
      proposal: foundProposal,
      user,
    });
    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'proposal',
      entityId: proposal.id,
      action: 'create',
      newValue: proposal,
    });

    return foundProposal;
  }

  /**
   * Update proposal details
   */
  async update(id: string, dto: UpdateProposalDto, user: AuthUser) {
    const existing = await this.findOne(id);

    // Validate dates if updated
    const reqDate = existing.request_date ? String(existing.request_date).split('T')[0] : '';
    const reqTargetDate = dto.request_date || reqDate;
    const reqRequiredDate = dto.required_date || (existing.required_date ? String(existing.required_date).split('T')[0] : '');

    if (reqTargetDate && reqRequiredDate && reqRequiredDate < reqTargetDate) {
      throw new BadRequestException('Required date cannot be before request date');
    }

    const updateData: any = {
      updated_at: sql`NOW()`,
      updated_by: user.id,
    };

    if (dto.customer_id) updateData.organisation_id = dto.customer_id;
    if (dto.sector) updateData.sector = dto.sector;
    if (dto.product_id) updateData.product_id = dto.product_id;
    if (dto.responsible_id) updateData.responsible_id = dto.responsible_id;
    if (dto.followup_owner_id !== undefined) updateData.followup_owner_id = dto.followup_owner_id;
    if (dto.request_date) updateData.request_date = dto.request_date;
    if (dto.required_date) updateData.required_date = dto.required_date;
    if (dto.version) updateData.version = dto.version;
    if (dto.reference !== undefined) updateData.reference = dto.reference;
    if (dto.remarks !== undefined) updateData.remarks = dto.remarks;
    if (dto.next_followup !== undefined) updateData.next_followup = dto.next_followup;

    const updated = await this.db.transaction().execute(async (trx) => {
      const res = await trx
        .updateTable('proposals')
        .set(updateData)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('proposal_activities')
        .values({
          proposal_id: id,
          action: 'UPDATED',
          old_value: null,
          new_value: `Proposal ${existing.proposal_number} updated`,
          performed_by: user.id,
          metadata: { changes: Object.keys(dto) },
        })
        .execute();

      return res;
    });

    this.eventEmitter.emit(AppEvents.PROPOSAL_STATUS_CHANGED, {
      proposalId: id,
      proposalNumber: existing.proposal_number,
      actorId: user.id,
      actorName: user.full_name,
      newStatus: existing.status,
    });

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'proposal',
      entityId: id,
      action: 'update',
      previousValue: existing,
      newValue: updated,
    });

    return this.findOne(id);
  }

  /**
   * Change proposal workflow status with validation, role checks, and atomic activity logging
   */
  async changeStatus(id: string, dto: ChangeProposalStatusDto, user: AuthUser) {
    const existing = await this.findOne(id);

    // Workflow validation
    const { targetStatus } = this.workflowService.validateTransition(
      existing.status,
      dto.status,
      user.role,
      {
        lost_reason: dto.lost_reason,
        sent_date: dto.sent_date,
      },
    );

    const updatePayload: any = {
      status: targetStatus,
      updated_by: user.id,
      updated_at: sql`NOW()`,
    };

    if (dto.remarks) {
      updatePayload.remarks = dto.remarks;
    }

    if (targetStatus === 'APPROVED') {
      updatePayload.approved_at = sql`NOW()`;
      updatePayload.approved_by = user.id;
    }

    if (targetStatus === 'SENT_TO_CUSTOMER') {
      updatePayload.sent_date = dto.sent_date || new Date().toISOString().split('T')[0];
    }

    if (targetStatus === 'LOST') {
      updatePayload.outcome = 'LOST';
      updatePayload.lost_reason = dto.lost_reason;
      if (dto.lost_remarks) {
        updatePayload.lost_remarks = dto.lost_remarks;
      }
    }

    if (targetStatus === 'CONVERTED') {
      updatePayload.outcome = 'CONVERTED';
      if (dto.converted_to) {
        updatePayload.converted_to = dto.converted_to;
      }
      if (dto.converted_reference) {
        updatePayload.converted_reference = dto.converted_reference;
      }
    }

    if (targetStatus === 'CLOSED') {
      updatePayload.outcome = 'CLOSED';
    }

    const updated = await this.db.transaction().execute(async (trx) => {
      const res = await trx
        .updateTable('proposals')
        .set(updatePayload)
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx
        .insertInto('proposal_activities')
        .values({
          proposal_id: id,
          action: 'STATUS_CHANGE',
          old_value: existing.status,
          new_value: targetStatus,
          performed_by: user.id,
          metadata: {
            remarks: dto.remarks || null,
            lost_reason: dto.lost_reason || null,
            converted_to: dto.converted_to || null,
            approved_by: targetStatus === 'APPROVED' ? user.full_name : null,
          },
        })
        .execute();

      return res;
    });

    const eventPayload = {
      proposalId: id,
      proposalNumber: existing.proposal_number,
      customerName: existing.organisation_name,
      oldStatus: existing.status,
      newStatus: targetStatus,
      responsibleId: existing.responsible_id,
      requestedBy: existing.requested_by,
      followUpOwnerId: existing.followup_owner_id,
      outcome: updatePayload.outcome || null,
      lostReason: dto.lost_reason || null,
      actorId: user.id,
      actorName: user.full_name,
      user,
    };

    // Generic status changed event
    this.eventEmitter.emit(AppEvents.PROPOSAL_STATUS_CHANGED, eventPayload);

    // Specific domain events
    if (targetStatus === 'READY_FOR_REVIEW') {
      this.eventEmitter.emit(AppEvents.PROPOSAL_REVIEW_REQUESTED, eventPayload);
    } else if (targetStatus === 'APPROVED') {
      this.eventEmitter.emit(AppEvents.PROPOSAL_APPROVED, eventPayload);
    } else if (targetStatus === 'SENT_TO_CUSTOMER') {
      this.eventEmitter.emit(AppEvents.PROPOSAL_SENT, eventPayload);
    } else if (['CONVERTED', 'CLOSED', 'LOST'].includes(targetStatus)) {
      this.eventEmitter.emit(AppEvents.PROPOSAL_OUTCOME_RECORDED, eventPayload);
    }

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'proposal',
      entityId: id,
      action: 'status_change',
      previousValue: { status: existing.status },
      newValue: { status: targetStatus, remarks: dto.remarks },
    });

    return this.findOne(id);
  }

  /**
   * Add a follow-up record to a proposal and update proposal follow-up metadata
   */
  async addFollowup(id: string, dto: CreateProposalFollowupDto, user: AuthUser) {
    const existing = await this.findOne(id);

    // Validate owner exists
    const owner = await this.db
      .selectFrom('users')
      .select(['id', 'full_name'])
      .where('id', '=', dto.owner_id)
      .executeTakeFirst();
    if (!owner) {
      throw new NotFoundException(`Follow-up owner with ID ${dto.owner_id} not found`);
    }

    const followupDate = dto.followup_date || new Date().toISOString().split('T')[0];
    const normStatus = this.workflowService.normalizeStatus(existing.status);
    const shouldShiftToFollowup = normStatus === 'SENT_TO_CUSTOMER';

    const followup = await this.db.transaction().execute(async (trx) => {
      const createdFollowup = await trx
        .insertInto('proposal_followups')
        .values({
          proposal_id: id,
          followup_date: followupDate,
          owner_id: dto.owner_id,
          remarks: dto.remarks,
          outcome: dto.outcome || null,
          next_followup_date: dto.next_followup_date || null,
          created_by: user.id,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const updateData: any = {
        last_followup: followupDate,
        followup_owner_id: dto.owner_id,
        updated_by: user.id,
        updated_at: sql`NOW()`,
      };

      if (dto.next_followup_date) {
        updateData.next_followup = dto.next_followup_date;
      }

      if (shouldShiftToFollowup) {
        updateData.status = 'FOLLOW_UP_REQUIRED';
      }

      await trx
        .updateTable('proposals')
        .set(updateData)
        .where('id', '=', id)
        .execute();

      await trx
        .insertInto('proposal_activities')
        .values({
          proposal_id: id,
          action: 'FOLLOWUP_ADDED',
          old_value: null,
          new_value: `Follow-up logged by ${owner.full_name}`,
          performed_by: user.id,
          metadata: {
            followup_date: followupDate,
            next_followup: dto.next_followup_date || null,
            outcome: dto.outcome || null,
            remarks: dto.remarks,
          },
        })
        .execute();

      return createdFollowup;
    });

    this.eventEmitter.emit(AppEvents.PROPOSAL_FOLLOWUP_LOGGED, {
      proposalId: id,
      proposalNumber: existing.proposal_number,
      customerName: existing.organisation_name,
      followupId: followup.id,
      followupDate,
      ownerId: dto.owner_id,
      ownerName: owner.full_name,
      nextFollowupDate: dto.next_followup_date || null,
      remarks: dto.remarks,
      outcome: dto.outcome || null,
      actorId: user.id,
      actorName: user.full_name,
    });

    this.eventEmitter.emit(AppEvents.PROPOSAL_STATUS_CHANGED, {
      proposalId: id,
      proposalNumber: existing.proposal_number,
      actorId: user.id,
      newStatus: shouldShiftToFollowup ? 'FOLLOW_UP_REQUIRED' : existing.status,
    });

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'proposal',
      entityId: id,
      action: 'followup_added',
      newValue: {
        followup_date: followupDate,
        owner_id: dto.owner_id,
        remarks: dto.remarks,
        next_followup_date: dto.next_followup_date,
      },
    });

    return {
      followup,
      proposal: await this.findOne(id),
    };
  }

  /**
   * Get all follow-ups for a proposal
   */
  async getFollowups(id: string) {
    await this.findOne(id); // validates existence

    return this.db
      .selectFrom('proposal_followups')
      .innerJoin('users as owner', 'proposal_followups.owner_id', 'owner.id')
      .leftJoin('users as creator', 'proposal_followups.created_by', 'creator.id')
      .selectAll('proposal_followups')
      .select([
        'owner.full_name as owner_name',
        'creator.full_name as created_by_name',
      ])
      .where('proposal_followups.proposal_id', '=', id)
      .orderBy('proposal_followups.followup_date', 'desc')
      .orderBy('proposal_followups.created_at', 'desc')
      .execute();
  }

  /**
   * Get activity history audit trail for a proposal
   */
  async getHistory(id: string) {
    await this.findOne(id); // validates existence

    return this.db
      .selectFrom('proposal_activities')
      .leftJoin('users as actor', 'proposal_activities.performed_by', 'actor.id')
      .selectAll('proposal_activities')
      .select(['actor.full_name as performed_by_name'])
      .where('proposal_activities.proposal_id', '=', id)
      .orderBy('proposal_activities.created_at', 'desc')
      .execute();
  }

  /**
   * Get dashboard summary counts & alert indicators
   */
  async getDashboardStats(user: AuthUser) {
    let baseQuery = this.db
      .selectFrom('proposals')
      .innerJoin('organisations', 'proposals.organisation_id', 'organisations.id')
      .where('proposals.is_deleted', '=', false);

    // Territorial Scoping
    const isGlobalRole = ['admin', 'management', 'tender_team'].includes(user.role);
    if (!isGlobalRole) {
      if (user.role === 'regional_manager' && user.region_id) {
        baseQuery = baseQuery.where('organisations.region_id', '=', user.region_id);
      } else {
        baseQuery = baseQuery.where((eb) => {
          const conditions = [
            eb('proposals.responsible_id', '=', user.id),
            eb('proposals.requested_by', '=', user.id),
            eb('proposals.followup_owner_id', '=', user.id),
          ];
          if (user.region_id) {
            conditions.push(eb('organisations.region_id', '=', user.region_id));
          }
          return eb.or(conditions);
        });
      }
    }

    const stats = await baseQuery
      .select([
        sql<number>`count(proposals.id)::int`.as('total_proposals'),
        sql<number>`count(case when proposals.status in ('PROPOSAL_REQUESTED', 'requested') then 1 end)::int`.as('proposal_requested'),
        sql<number>`count(case when proposals.status in ('UNDER_PREPARATION', 'under_preparation') then 1 end)::int`.as('pending_preparation'),
        sql<number>`count(case when proposals.status in ('READY_FOR_REVIEW', 'ready_for_review') then 1 end)::int`.as('ready_for_review'),
        sql<number>`count(case when proposals.status in ('APPROVED', 'approved') then 1 end)::int`.as('approved'),
        sql<number>`count(case when proposals.status in ('SENT_TO_CUSTOMER', 'sent') then 1 end)::int`.as('sent_to_customer'),
        sql<number>`count(case when proposals.status in ('FOLLOW_UP_REQUIRED', 'followup_required') then 1 end)::int`.as('followup_required'),
        sql<number>`count(case when proposals.status in ('CONVERTED', 'converted') then 1 end)::int`.as('converted'),
        sql<number>`count(case when proposals.status in ('CLOSED', 'closed') then 1 end)::int`.as('closed'),
        sql<number>`count(case when proposals.status in ('LOST', 'lost') then 1 end)::int`.as('lost'),
        // Alerts
        sql<number>`count(case when proposals.status not in ('CONVERTED', 'converted', 'CLOSED', 'closed', 'LOST', 'lost') and proposals.next_followup = CURRENT_DATE then 1 end)::int`.as('due_today'),
        sql<number>`count(case when proposals.status not in ('CONVERTED', 'converted', 'CLOSED', 'closed', 'LOST', 'lost') and proposals.next_followup < CURRENT_DATE then 1 end)::int`.as('overdue'),
        sql<number>`count(case when proposals.status in ('SENT_TO_CUSTOMER', 'sent', 'FOLLOW_UP_REQUIRED', 'followup_required') and proposals.next_followup is null then 1 end)::int`.as('no_followup'),
        sql<number>`count(case when proposals.status not in ('CONVERTED', 'converted', 'CLOSED', 'closed', 'LOST', 'lost') and proposals.updated_at <= NOW() - make_interval(days => ${PROPOSAL_INACTIVITY_DAYS}) then 1 end)::int`.as('old_no_movement'),
      ])
      .executeTakeFirst();

    return stats || {
      total_proposals: 0,
      proposal_requested: 0,
      pending_preparation: 0,
      ready_for_review: 0,
      approved: 0,
      sent_to_customer: 0,
      followup_required: 0,
      converted: 0,
      closed: 0,
      lost: 0,
      due_today: 0,
      overdue: 0,
      no_followup: 0,
      old_no_movement: 0,
    };
  }

  /**
   * Soft delete proposal preserving history
   */
  async softDelete(id: string, user: AuthUser) {
    const existing = await this.findOne(id);

    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('proposals')
        .set({
          is_deleted: true,
          deleted_at: sql`NOW()`,
          deleted_by: user.id,
          updated_at: sql`NOW()`,
          updated_by: user.id,
        })
        .where('id', '=', id)
        .execute();

      await trx
        .insertInto('proposal_activities')
        .values({
          proposal_id: id,
          action: 'DELETED',
          old_value: existing.proposal_number,
          new_value: 'Proposal soft-deleted',
          performed_by: user.id,
          metadata: { deleted_at: new Date().toISOString() },
        })
        .execute();
    });

    this.eventEmitter.emit(AppEvents.PROPOSAL_STATUS_CHANGED, {
      proposalId: id,
      proposalNumber: existing.proposal_number,
      actorId: user.id,
      isDeleted: true,
    });

    this.eventEmitter.emit('audit.log', {
      actorId: user.id,
      entityType: 'proposal',
      entityId: id,
      action: 'delete',
      previousValue: { id, proposal_number: existing.proposal_number },
    });

    return { success: true, message: `Proposal ${existing.proposal_number} deleted` };
  }
}
