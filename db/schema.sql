-- =====================================================================
-- ARIHANT TRADING CORPORATION — BUSINESS OPERATING SYSTEM (BOS)
-- Supabase / PostgreSQL schema  |  Stack: NestJS + Next.js + Supabase (no Prisma)
-- =====================================================================
-- Design notes:
--  * PKs are UUID (gen_random_uuid). Every table has created_at/updated_at.
--  * Statuses that the blueprint says "will be finalised before dev" are
--    text + CHECK so you can tune them without a type migration.
--  * Role, category, probability are stable -> enum types.
--  * RBAC + region scoping is enforced in the NestJS layer (backend uses the
--    Supabase service_role key, which bypasses RLS). RLS below is optional
--    defence-in-depth; keep it OFF while building, turn on before handover.
--  * Grain of `leads`: one row = one opportunity line (organisation + product),
--    which matches your Funnel / Bill&Book sheets exactly.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- updated_at helper ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- =====================================================================
-- 0. ENUMS
-- =====================================================================
create type user_role as enum
  ('management','regional_manager','sales','tender_team','demo_team',
   'service_team','accounts','admin');

create type lead_category   as enum ('active','expected','follow_up');      -- A / E / F
create type lead_probability as enum ('high','medium','low');               -- H / M / L
create type channel_type    as enum ('direct','partner');
create type tender_category as enum ('pq','general_mha','other');

-- =====================================================================
-- 1. MASTERS  (Stage 1)
-- =====================================================================
create table zones (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,          -- 'N','NE','S','E','W'
  name        text not null,
  created_at  timestamptz not null default now()
);

create table regions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  zone_id     uuid references zones(id),
  created_at  timestamptz not null default now(),
  unique (name, zone_id)
);

create table products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                 -- 'Hand Held Metal Detector as per MHA QR'
  category    text,                          -- 'Metal Detection','X-Ray','Surveillance'...
  make        text,                          -- OEM / brand
  is_mha_qr   boolean default false,         -- MHA Quality Requirement item?
  spec_ref    text,                          -- 'Q2','Q3','V2'...
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- users mirror Supabase auth.users (id = auth uid). Created via a trigger or on invite.
create table users (
  id                   uuid primary key,              -- = auth.users.id
  full_name            text not null,
  email                text unique not null,
  phone                text,
  role                 user_role not null default 'sales',
  region_id            uuid references regions(id),
  zone_id              uuid references zones(id),
  reporting_manager_id uuid references users(id),
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index on users(role);
create index on users(region_id);
create index on users(reporting_manager_id);

-- =====================================================================
-- 2. LEAD & CUSTOMER MANAGEMENT  (Module 1, Stage 2)
--    organisations = the dedupe anchor (fresh vs re-approached)
-- =====================================================================
create table organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                 -- 'Force Head Quarter BSF New Delhi'
  sector      text,                          -- Defence / Police / Railways / Nuclear...
  department  text,                          -- Procurement & Ordnance Branch
  is_govt     boolean default true,
  city        text,
  state       text,
  address     text,
  zone_id     uuid references zones(id),
  region_id   uuid references regions(id),
  created_by  uuid references users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on organisations(name);
create index on organisations(region_id);

create table contacts (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisations(id) on delete cascade,
  full_name        text not null,
  designation      text,
  mobile           text,
  email            text,
  is_primary       boolean default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on contacts(organisation_id);

-- leads / pipeline (Funnel sheet)  — one row per organisation+product opportunity
create table leads (
  id                  uuid primary key default gen_random_uuid(),
  organisation_id     uuid not null references organisations(id),
  primary_contact_id  uuid references contacts(id),
  product_id          uuid references products(id),
  department          text,                              -- Procurement & Ordnance Branch
  source              text,                              -- referral / GeM / cold / partner
  category            lead_category   default 'follow_up',   -- A / E / F
  probability         lead_probability default 'medium',     -- H / M / L
  channel             channel_type,                      -- Direct / Partner
  status              text default 'open',               -- open/qualified/quoted/negotiation/won/lost/dropped
  assigned_to         uuid references users(id),
  regional_manager_id uuid references users(id),
  bill_qtr            text,                              -- 'Q1 26-27'
  last_contact_date   date,
  next_followup_date  date,
  qty                 numeric,
  quot_price          numeric,                           -- quoted price
  order_price         numeric,                           -- won price
  value_lakh          numeric,                           -- deal value in lakh
  -- Bill&Book fields (won deals):
  booking_month       text,
  billing_month       text,
  order_status        text,                              -- booked / billed / dispatched
  remarks             text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on leads(organisation_id);
create index on leads(assigned_to);
create index on leads(status);
create index on leads(next_followup_date);

-- unified customer timeline (Module: Customer Interaction Timeline)
create table interactions (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisations(id),
  contact_id       uuid references contacts(id),
  lead_id          uuid references leads(id),
  type             text not null,   -- call/email/whatsapp/visit/demo/proposal/follow_up/tender/service
  employee_id      uuid references users(id),
  occurred_on      date not null default current_date,
  remarks          text,
  outcome          text,
  next_action      text,
  followup_date    date,
  created_at       timestamptz not null default now()
);
create index on interactions(organisation_id);
create index on interactions(lead_id);
create index on interactions(occurred_on);

-- =====================================================================
-- 3. VISIT & FIELD PLANNING  (Module 2)
-- =====================================================================
create table trips (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references users(id),
  trip_date     date not null,
  base_location text not null,
  status        text not null default 'planned',   -- planned, active, completed, cancelled
  notes         text,
  created_by    uuid references users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on trips(employee_id, trip_date);
create index on trips(status);

create table visits (
  id                 uuid primary key default gen_random_uuid(),
  trip_id            uuid references trips(id) on delete set null,
  organisation_id    uuid not null references organisations(id),
  contact_id         uuid references contacts(id),
  product_id         uuid references products(id),
  planned_by         uuid references users(id),
  assigned_to        uuid references users(id),
  assigned_by_manager uuid references users(id),   -- manager "also meet X" intervention
  manager_assigned   boolean default false,
  location           text,
  latitude           numeric,
  longitude          numeric,
  planned_date       date not null,
  start_time         text,
  end_time           text,
  purpose            text,
  demo_required      boolean default false,
  travel_required    boolean default false,
  expected_outcome   text,
  status             text default 'planned',   -- planned/modified/cancelled/completed/not_completed/rescheduled
  change_reason      text,                     -- required on cancel/reschedule/modify
  rescheduled_from   date,
  remarks            text,
  version            integer not null default 1,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index on visits(assigned_to);
create index on visits(planned_date);
create index on visits(status);
create index on visits(trip_id);

create table visit_updates (               -- post-visit
  id                uuid primary key default gen_random_uuid(),
  visit_id          uuid not null unique references visits(id) on delete cascade,
  met_completed     boolean default true,
  person_met        text,
  discussion        text,
  product_discussed text,
  outcome           text,
  opportunity       text,
  tender_opportunity text,
  demo_required     boolean default false,
  next_action       text,
  followup_date     date,
  remarks           text,
  updated_by        uuid references users(id),
  created_at        timestamptz not null default now()
);

create table employee_activities (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references users(id) on delete cascade,
  activity_type text not null default 'field_visit',
  entity_type   text not null default 'visit',
  entity_id     uuid not null,
  activity_date date not null,
  title         text not null,
  status        text not null,
  outcome       text,
  next_action   text,
  followup_date date,
  details       jsonb,
  created_at    timestamptz not null default now(),
  constraint uq_employee_activity unique (employee_id, entity_type, entity_id)
);
create index on employee_activities(employee_id, activity_date desc);
create index on employee_activities(activity_date desc);

-- =====================================================================
-- 4. DEMO MANAGEMENT  (Module 3)
-- =====================================================================
create table demo_equipment (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid references products(id),
  model               text,
  serial_no           text,
  current_location    text,                 -- Patna / Delhi / Kolkata
  responsible_person  uuid references users(id),
  availability_status text default 'available',   -- available/reserved/in_use/maintenance
  condition           text,
  reserved_until      date,
  remarks             text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table demos (
  id                  uuid primary key default gen_random_uuid(),
  organisation_id     uuid not null references organisations(id),
  lead_id             uuid references leads(id),
  product_id          uuid references products(id),
  requested_by        uuid references users(id),
  coordinator_id      uuid references users(id),
  assigned_to         uuid references users(id),
  location            text,
  requested_date      date,
  confirmed_date      date,
  expected_audience   text,
  equipment_required  text,
  special_requirements text,
  status              text default 'requested',
  -- requested/under_planning/confirmed/equipment_reserved/team_assigned/completed/cancelled/rescheduled
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on demos(status);
create index on demos(requested_date);

create table demo_reservations (
  id            uuid primary key default gen_random_uuid(),
  demo_id       uuid not null references demos(id) on delete cascade,
  equipment_id  uuid not null references demo_equipment(id),
  reserved_from date,
  reserved_to   date,
  status        text default 'requested',   -- requested/approved/rejected/alternative_suggested
  approved_by   uuid references users(id),
  created_at    timestamptz not null default now()
);

create table demo_outcomes (
  id                    uuid primary key default gen_random_uuid(),
  demo_id               uuid not null references demos(id) on delete cascade,
  completed             boolean default true,
  customer_response     text,
  technical_performance text,
  product_suitability   text,
  decision_maker_present boolean,
  competitor_involved   text,
  next_step             text,
  opportunity_stage     text,
  result                text,   -- success / fail
  failure_reason        text,   -- product_limitation/equipment_issue/tech_failure/mismatch/pricing/dm_unavailable/competitor/prep_issue/other
  remarks               text,
  created_at            timestamptz not null default now()
);

-- =====================================================================
-- 5. TENDER MANAGEMENT  (Module 4)  — grounded in your North Tender Sheet
-- =====================================================================
create table tenders (
  id                  uuid primary key default gen_random_uuid(),
  tender_no           text,                 -- 'GEM/2026/B/7783548'
  organisation_id     uuid references organisations(id),
  department          text,
  product_id          uuid references products(id),
  requirement_text    text,                 -- raw product/requirement line
  city                text,
  state               text,
  zone_id             uuid references zones(id),
  region_id           uuid references regions(id),
  category            tender_category default 'general_mha',   -- PQ / General-MHA / Other
  quantity            numeric,
  bidder_turnover     text,                 -- '46 Lakh' / 'NA'
  oem_turnover        text,
  emd_fee             numeric,
  publish_date        date,
  bid_start_date      date,
  bid_closing_date    timestamptz,          -- has time component in sheet
  prebid_date         date,
  corrigendum_date    text,
  participated_date   date,
  assigned_to         uuid references users(id),
  tender_owner_id     uuid references users(id),
  status              text default 'identified',
  -- identified/awaiting_approval/rejected_internally/under_preparation/pq_submitted/
  -- pq_qualified/submitted/technical_eval/commercial_eval/won/lost/cancelled/on_hold
  remarks             text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on tenders(status);
create index on tenders(bid_closing_date);
create index on tenders(zone_id);
create index on tenders(assigned_to);

create table tender_status_history (      -- approval workflow + audit
  id          uuid primary key default gen_random_uuid(),
  tender_id   uuid not null references tenders(id) on delete cascade,
  from_status text,
  to_status   text not null,
  changed_by  uuid references users(id),
  remarks     text,
  created_at  timestamptz not null default now()
);

create table tender_outcomes (
  id            uuid primary key default gen_random_uuid(),
  tender_id     uuid not null references tenders(id) on delete cascade,
  result        text not null,   -- won / lost
  reason        text,            -- pricing/technical/eligibility/documentation/other
  competitor    text,
  value_lakh    numeric,
  result_date   date,
  created_at    timestamptz not null default now()
);

-- =====================================================================
-- 6. PROPOSAL MANAGEMENT  (Module 5)
-- =====================================================================
create table proposals (
  id                uuid primary key default gen_random_uuid(),
  organisation_id   uuid not null references organisations(id),
  lead_id           uuid references leads(id),
  product_id        uuid references products(id),
  sector            text,
  requested_by      uuid references users(id),
  responsible_id    uuid references users(id),
  followup_owner_id uuid references users(id),
  request_date      date,
  required_date     date,
  sent_date         date,
  version           text,
  reference         text,               -- email/ref no
  status            text default 'requested',
  -- requested/under_preparation/ready_for_review/approved/sent/followup_required/converted/closed/lost
  next_followup     date,
  remarks           text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on proposals(status);
create index on proposals(next_followup);

-- =====================================================================
-- 7. SERVICE & AFTER-SALES  (Module 6)
-- =====================================================================
create table service_tickets (
  id                uuid primary key default gen_random_uuid(),
  ticket_no         text unique,
  organisation_id   uuid not null references organisations(id),
  contact_id        uuid references contacts(id),
  product_id        uuid references products(id),
  equipment_serial  text,
  location          text,
  complaint         text,
  received_date     date default current_date,
  priority          text default 'medium',   -- low/medium/high/critical
  warranty_status   text,                    -- in_warranty/out_of_warranty/amc
  assigned_to       uuid references users(id),
  planned_visit_date date,
  status            text default 'received',
  -- received/created/assigned/visit_scheduled/in_progress/awaiting_part/awaiting_customer/escalated/revisit/resolved/closed
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on service_tickets(status);
create index on service_tickets(assigned_to);

create table service_reports (
  id                     uuid primary key default gen_random_uuid(),
  ticket_id              uuid not null references service_tickets(id) on delete cascade,
  problem_identified     text,
  action_taken           text,
  parts_replaced         text,
  warranty_status        text,
  customer_confirmation  boolean,
  further_work_required  boolean,
  next_visit_date        date,
  report_url             text,
  submitted_by           uuid references users(id),
  created_at             timestamptz not null default now()
);

-- =====================================================================
-- 8. EXPENSE SUBMISSION & APPROVAL  (Module 7)
-- =====================================================================
create table expenses (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references users(id),
  visit_id      uuid references visits(id),
  organisation_id uuid references organisations(id),
  expense_date  date not null,
  category      text not null,   -- travel/hotel/local_conveyance/food/demo/service/other
  amount        numeric not null,
  purpose       text,
  receipt_url   text,
  status        text default 'submitted',
  -- submitted/manager_approved/rejected/clarification_required/accounts_processed
  manager_id    uuid references users(id),
  manager_remarks text,
  remarks       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on expenses(employee_id);
create index on expenses(status);

-- =====================================================================
-- 9. TASK & PRODUCTIVITY  (Module 8)
-- =====================================================================
create table tasks (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text,
  assigned_to         uuid references users(id),
  reporting_manager_id uuid references users(id),
  department          text,
  priority            text default 'medium',
  task_type           text default 'one_time',
  -- one_time/daily/weekly/monthly/recurring/customer/tender/demo/service
  related_entity_type text,     -- 'lead'/'tender'/'demo'/'service_ticket'...
  related_entity_id   uuid,
  start_date          date,
  deadline            date,
  expected_outcome    text,
  evidence_url        text,
  status              text default 'not_started',
  -- not_started/in_progress/completed/blocked/awaiting_approval/overdue
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on tasks(assigned_to);
create index on tasks(status);
create index on tasks(deadline);

create table task_blockers (
  id               uuid primary key default gen_random_uuid(),
  task_id          uuid not null references tasks(id) on delete cascade,
  blocker_type     text,   -- mgmt_approval/customer/vendor/other_employee/missing_info/portal/technical/leave
  description      text,
  raised_by        uuid references users(id),
  manager_decision text,   -- accepted/rejected/extended/reassigned/escalated
  decided_by       uuid references users(id),
  created_at       timestamptz not null default now()
);

-- =====================================================================
-- 10. CROSS-CUTTING: attachments, notifications, audit
-- =====================================================================
create table attachments (
  id            uuid primary key default gen_random_uuid(),
  entity_type   text not null,     -- 'lead','tender','service_report','expense'...
  entity_id     uuid not null,
  file_url      text not null,     -- Supabase Storage path
  file_name     text,
  uploaded_by   uuid references users(id),
  created_at    timestamptz not null default now()
);
create index on attachments(entity_type, entity_id);

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  type        text not null,      -- task_due/followup_due/tender_deadline/expense_approval...
  title       text not null,
  body        text,
  entity_type text,
  entity_id   uuid,
  is_read     boolean default false,
  created_at  timestamptz not null default now()
);
create index on notifications(user_id, is_read);

create table audit_log (
  id             uuid primary key default gen_random_uuid(),
  actor_id       uuid references users(id),
  entity_type    text not null,
  entity_id      uuid not null,
  action         text not null,    -- create/update/delete/status_change/approve/reject
  previous_value jsonb,
  new_value      jsonb,
  created_at     timestamptz not null default now()
);
create index on audit_log(entity_type, entity_id);
create index on audit_log(created_at);

-- =====================================================================
-- updated_at triggers (attach to tables that have updated_at)
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'products','users','organisations','contacts','leads','visits','trips',
    'demo_equipment','demos','tenders','proposals','service_tickets',
    'expenses','tasks'] loop
    execute format(
      'create trigger trg_%1$s_updated before update on %1$s
       for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- =====================================================================
-- SEED (optional starters — expand from your sheets)
-- =====================================================================
insert into zones(code,name) values
  ('N','North'),('NE','North East'),('S','South'),('E','East'),('W','West')
on conflict do nothing;

-- =====================================================================
-- END
-- =====================================================================
