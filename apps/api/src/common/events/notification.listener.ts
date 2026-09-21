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

  @OnEvent(AppEvents.TRIP_VISIT_ADDED)
  async handleTripVisitAdded(payload: {
    tripId: string;
    visitId: string;
    employeeId: string;
    managerName: string;
    organisationName: string;
    location?: string;
    instructions?: string;
  }) {
    await this.createAndPushNotification({
      userId: payload.employeeId,
      type: 'trip_visit_added',
      title: 'New Customer Visit Added to Your Trip Plan',
      body: `${payload.managerName} added a visit to ${payload.organisationName} (${payload.location || 'Site'}) to your trip.${payload.instructions ? ` Note: ${payload.instructions}` : ''}`,
      entityType: 'trip',
      entityId: payload.tripId,
    });
  }

  @OnEvent(AppEvents.VISIT_CANCELLED)
  async handleVisitCancelled(payload: {
    visitId: string;
    employeeId: string;
    employeeName: string;
    organisationName: string;
    plannedDate: string;
    reason: string;
    managerId?: string;
  }) {
    if (payload.managerId && payload.managerId !== payload.employeeId) {
      await this.createAndPushNotification({
        userId: payload.managerId,
        type: 'visit_cancelled',
        title: 'Field Visit Cancelled by Employee',
        body: `${payload.employeeName} cancelled visit to ${payload.organisationName} on ${payload.plannedDate}. Reason: "${payload.reason}"`,
        entityType: 'visit',
        entityId: payload.visitId,
      });
    }
  }

  @OnEvent(AppEvents.VISIT_RESCHEDULED)
  async handleVisitRescheduled(payload: {
    visitId: string;
    employeeId: string;
    employeeName: string;
    organisationName: string;
    oldDate: string;
    newDate: string;
    reason: string;
    managerId?: string;
  }) {
    if (payload.managerId && payload.managerId !== payload.employeeId) {
      await this.createAndPushNotification({
        userId: payload.managerId,
        type: 'visit_rescheduled',
        title: 'Field Visit Rescheduled by Employee',
        body: `${payload.employeeName} rescheduled visit to ${payload.organisationName} from ${payload.oldDate} to ${payload.newDate}. Reason: "${payload.reason}"`,
        entityType: 'visit',
        entityId: payload.visitId,
      });
    }
  }

  @OnEvent(AppEvents.VISIT_MODIFIED)
  async handleVisitModified(payload: {
    visitId: string;
    employeeId: string;
    employeeName: string;
    organisationName: string;
    changeDetails: string;
    reason?: string;
    managerId?: string;
  }) {
    if (payload.managerId && payload.managerId !== payload.employeeId) {
      await this.createAndPushNotification({
        userId: payload.managerId,
        type: 'visit_modified',
        title: 'Field Visit Modified by Employee',
        body: `${payload.employeeName} updated visit to ${payload.organisationName}: ${payload.changeDetails}.${payload.reason ? ` Reason: "${payload.reason}"` : ''}`,
        entityType: 'visit',
        entityId: payload.visitId,
      });
    }
  }

  @OnEvent(AppEvents.VISIT_COMPLETED)
  async handleVisitCompleted(payload: {
    visitId: string;
    employeeId: string;
    employeeName: string;
    organisationName: string;
    outcome?: string;
    personMet?: string;
    managerId?: string;
  }) {
    if (payload.managerId && payload.managerId !== payload.employeeId) {
      await this.createAndPushNotification({
        userId: payload.managerId,
        type: 'visit_completed',
        title: 'Field Visit Completed',
        body: `${payload.employeeName} completed visit to ${payload.organisationName}. Outcome: ${payload.outcome || 'Completed'}. Person met: ${payload.personMet || 'N/A'}.`,
        entityType: 'visit',
        entityId: payload.visitId,
      });
    }
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

  @OnEvent(AppEvents.DEMO_REQUESTED)
  async handleDemoRequested(payload: {
    demoId: string;
    demoNo: string;
    organisationName: string;
    requestedBy: string;
    requestedByName: string;
    location?: string;
  }) {
    // Notify demo coordinators (demo_team & management)
    const coordinators = await this.db
      .selectFrom('users')
      .select('id')
      .where('role', 'in', ['demo_team', 'management'])
      .where('is_active', '=', true)
      .execute();

    for (const u of coordinators) {
      if (u.id !== payload.requestedBy) {
        await this.createAndPushNotification({
          userId: u.id,
          type: 'demo_requested',
          title: `New Demo Request: ${payload.demoNo}`,
          body: `${payload.requestedByName} requested a client demonstration for ${payload.organisationName} (${payload.location || 'Site'}).`,
          entityType: 'demo',
          entityId: payload.demoId,
        });
      }
    }
    this.eventsGateway.sendToRole('demo_team', 'demo:requested', payload);
  }

  @OnEvent(AppEvents.DEMO_TEAM_ASSIGNED)
  async handleDemoTeamAssigned(payload: {
    demoId: string;
    demoNo: string;
    assignedToId: string;
    organisationName: string;
    demoDate?: string;
    location?: string;
  }) {
    await this.createAndPushNotification({
      userId: payload.assignedToId,
      type: 'demo_assigned',
      title: `Assigned to Client Demo: ${payload.demoNo}`,
      body: `You have been assigned to conduct demonstration for ${payload.organisationName} on ${payload.demoDate || 'TBD'} at ${payload.location || 'Site'}.`,
      entityType: 'demo',
      entityId: payload.demoId,
    });
    this.eventsGateway.sendToUser(payload.assignedToId, 'demo:assigned', payload);
  }

  @OnEvent(AppEvents.DEMO_EQUIPMENT_RESERVED)
  async handleDemoEquipmentReserved(payload: {
    demoId: string;
    demoNo: string;
    equipmentModel: string;
    serialNo?: string;
    salespersonId?: string;
    assignedToId?: string;
  }) {
    const recipients = new Set<string>();
    if (payload.salespersonId) recipients.add(payload.salespersonId);
    if (payload.assignedToId) recipients.add(payload.assignedToId);

    for (const userId of recipients) {
      await this.createAndPushNotification({
        userId,
        type: 'demo_equipment_reserved',
        title: `Demo Unit Reserved: ${payload.demoNo}`,
        body: `Equipment unit ${payload.equipmentModel} (${payload.serialNo || 'Standard'}) reserved for demo ${payload.demoNo}.`,
        entityType: 'demo',
        entityId: payload.demoId,
      });
    }
  }

  @OnEvent(AppEvents.DEMO_CONFIRMED)
  async handleDemoConfirmed(payload: {
    demoId: string;
    demoNo: string;
    organisationName: string;
    confirmedDate: string;
    salespersonId?: string;
    assignedToId?: string;
  }) {
    const recipients = new Set<string>();
    if (payload.salespersonId) recipients.add(payload.salespersonId);
    if (payload.assignedToId) recipients.add(payload.assignedToId);

    for (const userId of recipients) {
      await this.createAndPushNotification({
        userId,
        type: 'demo_confirmed',
        title: `Demo Confirmed: ${payload.demoNo}`,
        body: `Demonstration for ${payload.organisationName} confirmed for ${payload.confirmedDate}.`,
        entityType: 'demo',
        entityId: payload.demoId,
      });
    }
  }

  @OnEvent(AppEvents.DEMO_RESCHEDULED)
  async handleDemoRescheduled(payload: {
    demoId: string;
    demoNo: string;
    organisationName: string;
    oldDate?: string;
    newDate: string;
    reason: string;
    salespersonId?: string;
    assignedToId?: string;
  }) {
    const recipients = new Set<string>();
    if (payload.salespersonId) recipients.add(payload.salespersonId);
    if (payload.assignedToId) recipients.add(payload.assignedToId);

    for (const userId of recipients) {
      await this.createAndPushNotification({
        userId,
        type: 'demo_rescheduled',
        title: `Demo Rescheduled: ${payload.demoNo}`,
        body: `Demonstration for ${payload.organisationName} moved to ${payload.newDate}. Reason: "${payload.reason}".`,
        entityType: 'demo',
        entityId: payload.demoId,
      });
    }
  }

  @OnEvent(AppEvents.DEMO_CANCELLED)
  async handleDemoCancelled(payload: {
    demoId: string;
    demoNo: string;
    organisationName: string;
    reason: string;
    salespersonId?: string;
    assignedToId?: string;
  }) {
    const recipients = new Set<string>();
    if (payload.salespersonId) recipients.add(payload.salespersonId);
    if (payload.assignedToId) recipients.add(payload.assignedToId);

    for (const userId of recipients) {
      await this.createAndPushNotification({
        userId,
        type: 'demo_cancelled',
        title: `Demo Cancelled: ${payload.demoNo}`,
        body: `Demonstration for ${payload.organisationName} has been cancelled. Reason: "${payload.reason}". Equipment and personnel reservations released.`,
        entityType: 'demo',
        entityId: payload.demoId,
      });
    }
  }

  @OnEvent(AppEvents.DEMO_COMPLETED)
  async handleDemoCompleted(payload: {
    demoId: string;
    demoNo: string;
    organisationName: string;
    result: string;
    failureReason?: string;
    actorName?: string;
  }) {
    this.eventsGateway.sendToRole('demo_team', 'demo:completed', payload);
    this.eventsGateway.sendToRole('management', 'demo:completed', payload);
  }
}
