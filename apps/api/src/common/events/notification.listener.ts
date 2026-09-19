import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Kysely } from 'kysely';
import { KYSELY_DB } from '../database/database.module.js';
import { EventsGateway } from '../realtime/events.gateway.js';
import { AppEvents } from './event-names.js';
import type { Database, UserRole } from '@arihant/shared';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(
    @Inject(KYSELY_DB) private readonly db: Kysely<Database>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private async createAndPushNotification(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    entityType?: string;
    entityId?: string;
  }) {
    try {
      const res = await this.db
        .insertInto('notifications')
        .values({
          user_id: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          entity_type: data.entityType || null,
          entity_id: data.entityId || null,
          is_read: false,
        })
        .returningAll()
        .executeTakeFirst();

      if (res) {
        this.eventsGateway.sendToUser(data.userId, 'notification:new', res);
        this.logger.log(`Pushed notification to user ${data.userId}: ${data.title}`);
      }
    } catch (err: any) {
      this.logger.error(`Error creating notification: ${err.message}`);
    }
  }

  @OnEvent(AppEvents.TENDER_APPROVAL_REQUESTED)
  async handleTenderApprovalRequested(payload: { tenderId: string; tenderNo: string; orgName: string; actorId: string }) {
    // Notify management users
    const mgmtUsers = await this.db
      .selectFrom('users')
      .select('id')
      .where('role', '=', 'management')
      .where('is_active', '=', true)
      .execute();

    for (const u of mgmtUsers) {
      await this.createAndPushNotification({
        userId: u.id,
        type: 'tender_approval',
        title: 'Tender Participation Approval Required',
        body: `Tender ${payload.tenderNo} for ${payload.orgName} requires participation decision.`,
        entityType: 'tender',
        entityId: payload.tenderId,
      });
    }
  }

  @OnEvent(AppEvents.TENDER_STATUS_CHANGED)
  async handleTenderStatusChanged(payload: { tenderId: string; tenderNo: string; toStatus: string; actorId: string; tenderOwnerId?: string }) {
    if (payload.tenderOwnerId && payload.tenderOwnerId !== payload.actorId) {
      await this.createAndPushNotification({
        userId: payload.tenderOwnerId,
        type: 'tender_status',
        title: `Tender ${payload.tenderNo} Status Updated`,
        body: `Status changed to: ${payload.toStatus}`,
        entityType: 'tender',
        entityId: payload.tenderId,
      });
    }
    // Broadcast status change to role:tender_team and role:management
    this.eventsGateway.sendToRole('tender_team', 'tender:updated', payload);
    this.eventsGateway.sendToRole('management', 'tender:updated', payload);
  }

  @OnEvent(AppEvents.EXPENSE_SUBMITTED)
  async handleExpenseSubmitted(payload: { expenseId: string; employeeId: string; employeeName: string; amount: number; managerId: string }) {
    await this.createAndPushNotification({
      userId: payload.managerId,
      type: 'expense_approval',
      title: 'New Expense Awaiting 1st-Stage Approval',
      body: `${payload.employeeName} submitted an expense of ₹ ${payload.amount.toLocaleString('en-IN')}.`,
      entityType: 'expense',
      entityId: payload.expenseId,
    });
  }

  @OnEvent(AppEvents.EXPENSE_MANAGER_APPROVED)
  async handleExpenseManagerApproved(payload: { expenseId: string; employeeId: string; amount: number }) {
    // Notify accounts users
    const accountsUsers = await this.db
      .selectFrom('users')
      .select('id')
      .where('role', '=', 'accounts')
      .where('is_active', '=', true)
      .execute();

    for (const u of accountsUsers) {
      await this.createAndPushNotification({
        userId: u.id,
        type: 'expense_accounts',
        title: 'Manager Approved Expense Ready for Processing',
        body: `Expense of ₹ ${payload.amount.toLocaleString('en-IN')} approved by manager, ready for accounts signoff.`,
        entityType: 'expense',
        entityId: payload.expenseId,
      });
    }

    // Also notify employee
    await this.createAndPushNotification({
      userId: payload.employeeId,
      type: 'expense_status',
      title: 'Expense Approved by Manager',
      body: `Your expense of ₹ ${payload.amount.toLocaleString('en-IN')} was approved by your manager and forwarded to Accounts.`,
      entityType: 'expense',
      entityId: payload.expenseId,
    });
  }

  @OnEvent(AppEvents.TASK_BLOCKED)
  async handleTaskBlocked(payload: { taskId: string; title: string; raisedById: string; managerId: string; blockerType: string; description: string }) {
    await this.createAndPushNotification({
      userId: payload.managerId,
      type: 'task_blocked',
      title: 'Task Execution Blocked',
      body: `Task "${payload.title}" is blocked: ${payload.description}`,
      entityType: 'task',
      entityId: payload.taskId,
    });
  }

  @OnEvent(AppEvents.VISIT_ALSO_MEET)
  async handleVisitAlsoMeet(payload: { visitId: string; employeeId: string; managerName: string; instructions: string }) {
    await this.createAndPushNotification({
      userId: payload.employeeId,
      type: 'visit_intervention',
      title: 'Manager "Also-Meet" Intervention Added',
      body: `${payload.managerName} added an instruction to your planned visit: ${payload.instructions}`,
      entityType: 'visit',
      entityId: payload.visitId,
    });
  }

  @OnEvent(AppEvents.TASK_ASSIGNED)
  async handleTaskAssigned(payload: { taskId: string; title: string; assignedTo: string; deadline?: string }) {
    await this.createAndPushNotification({
      userId: payload.assignedTo,
      type: 'task_assigned',
      title: 'New Operational Task Assigned',
      body: `You have been assigned: "${payload.title}" (Due: ${payload.deadline || 'Immediate'})`,
      entityType: 'task',
      entityId: payload.taskId,
    });
  }

  @OnEvent(AppEvents.SERVICE_CREATED)
  async handleServiceCreated(payload: { ticketId: string; ticketNo: string; complaint: string; assignedTo?: string }) {
    if (payload.assignedTo) {
      await this.createAndPushNotification({
        userId: payload.assignedTo,
        type: 'service_ticket',
        title: `Service Breakdown Ticket ${payload.ticketNo}`,
        body: `Assigned breakdown complaint: ${payload.complaint}`,
        entityType: 'service_ticket',
        entityId: payload.ticketId,
      });
    }
  }

  @OnEvent(AppEvents.SERVICE_RESOLVED)
  async handleServiceResolved(payload: { ticketId: string; ticketNo: string; actorId: string }) {
    this.eventsGateway.sendToRole('service_team', 'service:resolved', payload);
  }

  @OnEvent(AppEvents.TENDER_DEADLINE_SOON)
  async handleTenderDeadlineSoon(payload: { tenderId: string; tenderNo: string; daysLeft: number; ownerId?: string }) {
    if (payload.ownerId) {
      await this.createAndPushNotification({
        userId: payload.ownerId,
        type: 'tender_deadline',
        title: `CRITICAL DEADLINE: Tender ${payload.tenderNo}`,
        body: `Submission window closes in ${payload.daysLeft} days! Immediate action required.`,
        entityType: 'tender',
        entityId: payload.tenderId,
      });
    }
  }
}
