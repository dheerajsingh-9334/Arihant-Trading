export const AppEvents = {
  TENDER_STATUS_CHANGED: 'tender.status_changed',
  TENDER_DEADLINE_SOON: 'tender.deadline_soon',
  TENDER_APPROVAL_REQUESTED: 'tender.approval_requested',
  TENDER_APPROVED: 'tender.approved',

  EXPENSE_SUBMITTED: 'expense.submitted',
  EXPENSE_MANAGER_APPROVED: 'expense.manager_approved',
  EXPENSE_PROCESSED: 'expense.processed',
  EXPENSE_REJECTED: 'expense.rejected',

  TASK_ASSIGNED: 'task.assigned',
  TASK_BLOCKED: 'task.blocked',
  TASK_OVERDUE: 'task.overdue',

  VISIT_CANCELLED: 'visit.cancelled',
  VISIT_RESCHEDULED: 'visit.rescheduled',
  VISIT_MODIFIED: 'visit.modified',
  VISIT_COMPLETED: 'visit.completed',
  VISIT_ALSO_MEET: 'visit.also_meet',
  TRIP_CREATED: 'trip.created',
  TRIP_VISIT_ADDED: 'trip.visit_added',

  SERVICE_CREATED: 'service.created',
  SERVICE_RESOLVED: 'service.resolved',

  DEMO_REQUESTED: 'demo.requested',
  DEMO_TEAM_ASSIGNED: 'demo.team_assigned',
  DEMO_EQUIPMENT_RESERVED: 'demo.equipment_reserved',
  DEMO_CONFIRMED: 'demo.confirmed',
  DEMO_RESCHEDULED: 'demo.rescheduled',
  DEMO_CANCELLED: 'demo.cancelled',
  DEMO_COMPLETED: 'demo.completed',
} as const;
