import type { ColumnType, Generated } from 'kysely';
import type {
  UserRole,
  LeadCategory,
  LeadProbability,
  ChannelType,
  LeadType,
  LeadStatus,
  FollowUpStatus,
  InteractionType,
  TenderCategory,
  TenderStatus,
  VisitStatus,
  TripStatus,
  DemoStatus,
  DemoEquipmentAvailability,
  DemoResult,
  DemoFailureReason,
  DemoCancellationReason,
  ProposalStatus,
  ServiceTicketStatus,
  ServicePriority,
  WarrantyStatus,
  ExpenseStatus,
  ExpenseCategory,
  TaskStatus,
  TaskBlockerType,
  TaskBlockerDecision,
} from './enums.js';

export interface ZonesTable {
  id: Generated<string>;
  code: string;
  name: string;
  created_at: Generated<Date>;
}

export interface RegionsTable {
  id: Generated<string>;
  name: string;
  zone_id: string | null;
  created_at: Generated<Date>;
}

export interface ProductsTable {
  id: Generated<string>;
  name: string;
  category: string | null;
  make: string | null;
  is_mha_qr: Generated<boolean>;
  spec_ref: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface UsersTable {
  id: string; // uuid
  full_name: string;
  email: string;
  phone: string | null;
  role: Generated<UserRole>;
  region_id: string | null;
  zone_id: string | null;
  reporting_manager_id: string | null;
  is_active: Generated<boolean>;
  password_hash?: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface OrganisationsTable {
  id: Generated<string>;
  name: string;
  sector: string | null;
  is_govt: Generated<boolean>;
  city: string | null;
  state: string | null;
  address: string | null;
  zone_id: string | null;
  region_id: string | null;
  created_by: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface ContactsTable {
  id: Generated<string>;
  organisation_id: string;
  full_name: string;
  designation: string | null;
  mobile: string | null;
  email: string | null;
  is_primary: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface LeadsTable {
  id: Generated<string>;
  organisation_id: string;
  primary_contact_id: string | null;
  product_id: string | null;
  source: string | null;
  category: Generated<LeadCategory>;
  probability: Generated<LeadProbability>;
  channel: ChannelType | null;
  status: Generated<string>;
  lead_type: Generated<LeadType>;
  lead_status: Generated<LeadStatus>;
  loss_reason: string | null;
  last_interaction_at: Date | null;
  next_followup_at: Date | null;
  assigned_to: string | null;
  regional_manager_id: string | null;
  bill_qtr: string | null;
  last_contact_date: string | null; // date
  next_followup_date: string | null; // date
  qty: number | null;
  quot_price: number | null;
  order_price: number | null;
  value_lakh: number | null;
  booking_month: string | null;
  billing_month: string | null;
  order_status: string | null;
  remarks: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface LeadProductInterestsTable {
  id: Generated<string>;
  lead_id: string;
  product_id: string;
  created_at: Generated<Date>;
  created_by: string | null;
}

export interface LeadAssignmentHistoryTable {
  id: Generated<string>;
  lead_id: string;
  previous_salesperson_id: string | null;
  new_salesperson_id: string;
  previous_regional_manager_id: string | null;
  new_regional_manager_id: string | null;
  changed_by: string;
  changed_at: Generated<Date>;
  reason: string | null;
}

export interface FollowUpsTable {
  id: Generated<string>;
  organisation_id: string;
  contact_id: string | null;
  lead_id: string | null;
  interaction_id: string | null;
  assigned_to: string;
  due_date: string; // date
  status: Generated<FollowUpStatus>;
  remarks: string | null;
  outcome: string | null;
  completed_at: Date | null;
  completed_by: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface InteractionAttachmentsTable {
  id: Generated<string>;
  interaction_id: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: Generated<Date>;
}

export interface InteractionsTable {
  id: Generated<string>;
  organisation_id: string;
  contact_id: string | null;
  lead_id: string | null;
  visit_id: string | null;
  demo_id: string | null;
  type: string;
  employee_id: string | null;
  occurred_on: Generated<string>;
  remarks: string | null;
  outcome: string | null;
  next_action: string | null;
  followup_date: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TripsTable {
  id: Generated<string>;
  employee_id: string;
  trip_date: string;
  base_location: string;
  status: Generated<TripStatus>;
  notes: string | null;
  created_by: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface VisitsTable {
  id: Generated<string>;
  trip_id: string | null;
  organisation_id: string;
  contact_id: string | null;
  product_id: string | null;
  planned_by: string | null;
  assigned_to: string | null;
  assigned_by_manager: string | null;
  manager_assigned: Generated<boolean>;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  planned_date: string; // date
  start_time: string | null;
  end_time: string | null;
  purpose: string | null;
  demo_required: Generated<boolean>;
  travel_required: Generated<boolean>;
  expected_outcome: string | null;
  status: Generated<VisitStatus>;
  change_reason: string | null;
  rescheduled_from: string | null;
  remarks: string | null;
  contact_person: string | null;
  version: Generated<number>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface VisitUpdatesTable {
  id: Generated<string>;
  visit_id: string;
  met_completed: Generated<boolean>;
  person_met: string | null;
  discussion: string | null;
  product_discussed: string | null;
  outcome: string | null;
  opportunity: string | null;
  tender_opportunity: string | null;
  demo_required: Generated<boolean>;
  next_action: string | null;
  followup_date: string | null;
  remarks: string | null;
  updated_by: string | null;
  created_at: Generated<Date>;
}

export interface EmployeeActivitiesTable {
  id: Generated<string>;
  employee_id: string;
  activity_type: Generated<string>;
  entity_type: Generated<string>;
  entity_id: string;
  activity_date: string;
  title: string;
  status: string;
  outcome: string | null;
  next_action: string | null;
  followup_date: string | null;
  details: unknown | null;
  created_at: Generated<Date>;
}

export interface DemoEquipmentTable {
  id: Generated<string>;
  product_id: string | null;
  model: string | null;
  serial_no: string | null;
  current_location: string | null;
  responsible_person: string | null;
  availability_status: Generated<DemoEquipmentAvailability>;
  condition: string | null;
  reserved_until: string | null;
  remarks: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface DemosTable {
  id: Generated<string>;
  demo_no: Generated<string>;
  organisation_id: string;
  lead_id: string | null;
  product_id: string | null;
  requested_by: string | null;
  coordinator_id: string | null;
  assigned_to: string | null;
  location: string | null;
  requested_date: string | null;
  confirmed_date: string | null;
  expected_audience: string | null;
  equipment_required: string | null;
  special_requirements: string | null;
  status: Generated<DemoStatus>;
  purpose: string | null;
  remarks: string | null;
  visit_id: string | null;
  reschedule_reason: string | null;
  rescheduled_from: string | null;
  cancellation_reason: string | null;
  travel_required: Generated<boolean>;
  travel_from: string | null;
  travel_to: string | null;
  travel_date: string | null;
  travel_remarks: string | null;
  version: Generated<number>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface DemoReservationsTable {
  id: Generated<string>;
  demo_id: string;
  equipment_id: string;
  reserved_from: string | null;
  reserved_to: string | null;
  status: Generated<string>;
  approved_by: string | null;
  alternative_equipment_id: string | null;
  alternative_reason: string | null;
  remarks: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface DemoOutcomesTable {
  id: Generated<string>;
  demo_id: string;
  completed: Generated<boolean>;
  customer_response: string | null;
  technical_performance: string | null;
  product_suitability: string | null;
  decision_maker_present: boolean | null;
  competitor_involved: string | null;
  next_step: string | null;
  opportunity_stage: string | null;
  result: string | null; // success / fail
  failure_reason: string | null;
  remarks: string | null;
  submitted_by: string | null;
  created_at: Generated<Date>;
}

export interface DemoRescheduleHistoryTable {
  id: Generated<string>;
  demo_id: string;
  old_date: string | null;
  new_date: string;
  reason: string;
  changed_by: string | null;
  created_at: Generated<Date>;
}


export interface TendersTable {
  id: Generated<string>;
  tender_no: string | null;
  organisation_id: string | null;
  department: string | null;
  product_id: string | null;
  requirement_text: string | null;
  city: string | null;
  state: string | null;
  zone_id: string | null;
  region_id: string | null;
  category: Generated<TenderCategory>;
  quantity: number | null;
  bidder_turnover: string | null;
  oem_turnover: string | null;
  emd_fee: number | null;
  publish_date: string | null;
  publication_date?: string | null;
  bid_start_date: string | null;
  bid_closing_date: string | null; // timestamptz
  submission_deadline?: string | null; // timestamptz
  prebid_date: string | null;
  corrigendum_date: string | null;
  participated_date: string | null;
  department_id?: string | null;
  assigned_to: string | null;
  assigned_person_id?: string | null;
  tender_owner_id: string | null;
  status: Generated<TenderStatus>;
  remarks: string | null;
  rejection_reason?: string | null;
  portal?: string | null;
  reference_number?: string | null;
  estimated_value?: number | null;
  tender_value?: number | null;
  submission_date?: string | null;
  result_date?: string | null;
  loss_reason?: string | null;
  competitor?: string | null;
  loss_notes?: string | null;
  approval_date?: Date | null;
  internal_approval_by?: string | null;
  internal_approval_at?: Date | null;
  is_deleted?: Generated<boolean>;
  deleted_at?: Date | null;
  deleted_by?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TenderCategoriesTable {
  id: Generated<string>;
  code: string;
  name: string;
  description: string | null;
  is_active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TenderApprovalsTable {
  id: Generated<string>;
  tender_id: string;
  requested_by: string | null;
  approver_id: string | null;
  status: Generated<string>;
  requested_at: Generated<Date>;
  responded_at: Date | null;
  remarks: string | null;
  rejection_reason: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TenderPortalIssuesTable {
  id: Generated<string>;
  tender_id: string;
  issue: string;
  reported_date: string;
  reported_by: string | null;
  responsible_person_id: string | null;
  escalated_to: string | null;
  escalation_date: Date | null;
  resolution_status: Generated<string>;
  resolution: string | null;
  resolved_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TenderActivitiesTable {
  id: Generated<string>;
  tender_id: string;
  event_type: string;
  description: string;
  performed_by: string | null;
  metadata: Generated<any>;
  created_at: Generated<Date>;
}

export interface OutboxEventsTable {
  id: Generated<string>;
  event_id: string;
  event_type: string;
  aggregate_type: Generated<string>;
  aggregate_id: string;
  payload: any;
  status: Generated<string>;
  attempts: Generated<number>;
  max_attempts: Generated<number>;
  available_at: Generated<Date>;
  processed_at: Date | null;
  error_message: string | null;
  created_at: Generated<Date>;
}

export interface ProcessedEventsTable {
  id: Generated<string>;
  event_id: string;
  handler_name: string;
  processed_at: Generated<Date>;
}

export interface TenderStatusHistoryTable {
  id: Generated<string>;
  tender_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  remarks: string | null;
  created_at: Generated<Date>;
}

export interface TenderOutcomesTable {
  id: Generated<string>;
  tender_id: string;
  result: string; // won / lost
  reason: string | null;
  competitor: string | null;
  value_lakh: number | null;
  result_date: string | null;
  technical_issue: string | null;
  pricing_issue: string | null;
  eligibility_issue: string | null;
  documentation_issue: string | null;
  other_reason: string | null;
  notes: string | null;
  created_at: Generated<Date>;
}

export interface ProposalsTable {
  id: Generated<string>;
  proposal_number: Generated<string>;
  organisation_id: string;
  lead_id: string | null;
  product_id: string | null;
  sector: string | null;
  requested_by: string | null;
  responsible_id: string | null;
  followup_owner_id: string | null;
  request_date: string | null;
  required_date: string | null;
  sent_date: string | null;
  approved_at: Date | null;
  approved_by: string | null;
  version: string | null;
  reference: string | null;
  status: Generated<ProposalStatus>;
  last_followup: string | null;
  next_followup: string | null;
  outcome: string | null;
  lost_reason: string | null;
  lost_remarks: string | null;
  converted_to: string | null;
  converted_reference: string | null;
  remarks: string | null;
  created_by: string | null;
  updated_by: string | null;
  is_deleted: Generated<boolean>;
  deleted_at: Date | null;
  deleted_by: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface ProposalFollowupsTable {
  id: Generated<string>;
  proposal_id: string;
  followup_date: string;
  owner_id: string;
  remarks: string;
  outcome: string | null;
  next_followup_date: string | null;
  created_by: string | null;
  created_at: Generated<Date>;
}

export interface ProposalActivitiesTable {
  id: Generated<string>;
  proposal_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  performed_by: string | null;
  metadata: Record<string, any> | null;
  created_at: Generated<Date>;
}


export interface ServiceTicketsTable {
  id: Generated<string>;
  ticket_no: string | null;
  organisation_id: string;
  contact_id: string | null;
  product_id: string | null;
  equipment_serial: string | null;
  location: string | null;
  complaint: string | null;
  received_date: Generated<string>;
  priority: Generated<ServicePriority>;
  warranty_status: WarrantyStatus | null;
  assigned_to: string | null;
  planned_visit_date: string | null;
  status: Generated<ServiceTicketStatus>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface ServiceReportsTable {
  id: Generated<string>;
  ticket_id: string;
  problem_identified: string | null;
  action_taken: string | null;
  parts_replaced: string | null;
  warranty_status: string | null;
  customer_confirmation: boolean | null;
  further_work_required: boolean | null;
  next_visit_date: string | null;
  report_url: string | null;
  submitted_by: string | null;
  created_at: Generated<Date>;
}

export interface ExpensesTable {
  id: Generated<string>;
  employee_id: string;
  visit_id: string | null;
  organisation_id: string | null;
  expense_date: string;
  category: ExpenseCategory;
  amount: number;
  purpose: string | null;
  receipt_url: string | null;
  status: Generated<ExpenseStatus>;
  manager_id: string | null;
  manager_remarks: string | null;
  remarks: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TasksTable {
  id: Generated<string>;
  title: string;
  description: string | null;
  assigned_to: string | null;
  reporting_manager_id: string | null;
  department: string | null;
  priority: Generated<string>;
  task_type: Generated<string>;
  related_entity_type: string | null;
  related_entity_id: string | null;
  start_date: string | null;
  deadline: string | null;
  expected_outcome: string | null;
  evidence_url: string | null;
  status: Generated<TaskStatus>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TaskBlockersTable {
  id: Generated<string>;
  task_id: string;
  blocker_type: TaskBlockerType | null;
  description: string | null;
  raised_by: string | null;
  manager_decision: TaskBlockerDecision | null;
  decided_by: string | null;
  created_at: Generated<Date>;
}

export interface AttachmentsTable {
  id: Generated<string>;
  entity_type: string;
  entity_id: string;
  file_url: string;
  file_name: string | null;
  uploaded_by: string | null;
  created_at: Generated<Date>;
}

export interface NotificationsTable {
  id: Generated<string>;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: Generated<boolean>;
  created_at: Generated<Date>;
}

export interface AuditLogTable {
  id: Generated<string>;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  previous_value: unknown | null;
  new_value: unknown | null;
  created_at: Generated<Date>;
}

export interface DepartmentsTable {
  id: Generated<string>;
  code: string;
  name: string;
  description: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface RolePermissionsTable {
  id: Generated<string>;
  role: UserRole;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface AppUsersTable {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  region_id: string | null;
  zone_id: string | null;
  reporting_manager_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Database {
  zones: ZonesTable;
  regions: RegionsTable;
  products: ProductsTable;
  users: UsersTable;
  app_users: AppUsersTable;
  departments: DepartmentsTable;
  role_permissions: RolePermissionsTable;
  organisations: OrganisationsTable;
  contacts: ContactsTable;
  leads: LeadsTable;
  lead_product_interests: LeadProductInterestsTable;
  lead_assignment_history: LeadAssignmentHistoryTable;
  follow_ups: FollowUpsTable;
  interactions: InteractionsTable;
  interaction_attachments: InteractionAttachmentsTable;
  trips: TripsTable;
  visits: VisitsTable;
  visit_updates: VisitUpdatesTable;
  employee_activities: EmployeeActivitiesTable;
  demo_equipment: DemoEquipmentTable;
  demos: DemosTable;
  demo_reservations: DemoReservationsTable;
  demo_outcomes: DemoOutcomesTable;
  demo_reschedule_history: DemoRescheduleHistoryTable;
  tenders: TendersTable;
  tender_categories: TenderCategoriesTable;
  tender_approvals: TenderApprovalsTable;
  tender_portal_issues: TenderPortalIssuesTable;
  tender_activities: TenderActivitiesTable;
  tender_status_history: TenderStatusHistoryTable;
  tender_outcomes: TenderOutcomesTable;
  outbox_events: OutboxEventsTable;
  processed_events: ProcessedEventsTable;
  proposals: ProposalsTable;
  proposal_followups: ProposalFollowupsTable;
  proposal_activities: ProposalActivitiesTable;
  service_tickets: ServiceTicketsTable;
  service_reports: ServiceReportsTable;
  expenses: ExpensesTable;
  tasks: TasksTable;
  task_blockers: TaskBlockersTable;
  attachments: AttachmentsTable;
  notifications: NotificationsTable;
  audit_log: AuditLogTable;
}

