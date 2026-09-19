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
  VISIT_ALSO_MEET: 'visit.also_meet',

  SERVICE_CREATED: 'service.created',
  SERVICE_RESOLVED: 'service.resolved',
} as const;
