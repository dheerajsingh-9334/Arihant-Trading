-- =====================================================================
-- Migration: 007_tender_management_eda.sql
-- Module 4: Tender Management — Full Event-Driven Architecture (EDA),
-- Transactional Outbox Pattern, Portal Issues, Approvals, & Activity Auditing
-- =====================================================================

-- 1. Tender Categories Lookup Table
create table if not exists tender_categories (
  id uuid primary key default gen_random_uuid(),
  code varchar(50) unique not null,
  name varchar(100) not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into tender_categories (code, name, description)
values
  ('pq', 'PQ', 'Prequalification / Eligibility Bids for Institutional Contracts'),
  ('general_mha', 'General / MHA', 'General MHA QR Standard Security & Defence Equipment Procurement'),
  ('other', 'Other', 'State Police, Railways, Healthcare & Institutional Bids')
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description;

-- 2. Enhance Tenders Table with additional specification columns
alter table tenders add column if not exists rejection_reason text;
alter table tenders add column if not exists portal varchar(100) default 'GeM';
alter table tenders add column if not exists reference_number varchar(100);
alter table tenders add column if not exists estimated_value numeric;
alter table tenders add column if not exists tender_value numeric;
alter table tenders add column if not exists submission_date date;
alter table tenders add column if not exists result_date date;
alter table tenders add column if not exists approval_date timestamptz;
alter table tenders add column if not exists internal_approval_by uuid references users(id);
alter table tenders add column if not exists internal_approval_at timestamptz;
alter table tenders add column if not exists is_deleted boolean not null default false;
alter table tenders add column if not exists deleted_at timestamptz;
alter table tenders add column if not exists deleted_by uuid references users(id);

-- 3. Structured Internal Tender Approvals Table
create table if not exists tender_approvals (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid not null references tenders(id) on delete cascade,
  requested_by uuid references users(id),
  approver_id uuid references users(id),
  status varchar(50) not null default 'PENDING',
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  remarks text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. External Portal Issue Tracking Table (GeM / CPPP glitches, spec discrepancy)
create table if not exists tender_portal_issues (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid not null references tenders(id) on delete cascade,
  issue text not null,
  reported_date date not null default current_date,
  reported_by uuid references users(id),
  responsible_person_id uuid references users(id),
  escalated_to uuid references users(id),
  escalation_date timestamptz,
  resolution_status varchar(50) not null default 'OPEN',
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Complete Tender Activity Audit Timeline Table
create table if not exists tender_activities (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid not null references tenders(id) on delete cascade,
  event_type varchar(100) not null,
  description text not null,
  performed_by uuid references users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 6. Transactional Outbox Pattern Table for Reliable Event-Driven Architecture
create table if not exists outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_id varchar(100) unique not null,
  event_type varchar(100) not null,
  aggregate_type varchar(50) not null default 'TENDER',
  aggregate_id varchar(100) not null,
  payload jsonb not null,
  status varchar(50) not null default 'PENDING',
  attempts int not null default 0,
  max_attempts int not null default 5,
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

-- 7. Idempotency Table for Event Handlers
create table if not exists processed_events (
  id uuid primary key default gen_random_uuid(),
  event_id varchar(100) not null,
  handler_name varchar(100) not null,
  processed_at timestamptz not null default now(),
  unique (event_id, handler_name)
);

-- 8. Performance Indexes
create index if not exists idx_tenders_status_closing on tenders(status, bid_closing_date) where is_deleted = false;
create index if not exists idx_tenders_category_status on tenders(category, status) where is_deleted = false;
create index if not exists idx_tenders_zone_status on tenders(zone_id, status) where is_deleted = false;
create index if not exists idx_tenders_region_status on tenders(region_id, status) where is_deleted = false;
create index if not exists idx_tenders_tender_no on tenders(tender_no);
create index if not exists idx_tenders_assigned on tenders(assigned_to) where is_deleted = false;
create index if not exists idx_tenders_owner on tenders(tender_owner_id) where is_deleted = false;

create index if not exists idx_tender_approvals_tid on tender_approvals(tender_id, created_at desc);
create index if not exists idx_tender_portal_issues_tid on tender_portal_issues(tender_id, created_at desc);
create index if not exists idx_tender_activities_tid on tender_activities(tender_id, created_at desc);
create index if not exists idx_outbox_events_status on outbox_events(status, available_at);
create index if not exists idx_processed_events_key on processed_events(event_id, handler_name);

-- 9. Seed Sample Approvals, Portal Issues, and Activities for existing tenders
do $$
declare
  t_record record;
  admin_user uuid;
  tender_user uuid;
begin
  select id into admin_user from users where role in ('admin', 'management') limit 1;
  select id into tender_user from users where role in ('tender_team', 'sales') limit 1;
  if tender_user is null then tender_user := admin_user; end if;

  for t_record in select id, tender_no, status, requirement_text from tenders limit 10 loop
    -- Activity entry
    insert into tender_activities (tender_id, event_type, description, performed_by, metadata)
    values (
      t_record.id,
      'IDENTIFIED',
      'Tender ' || coalesce(t_record.tender_no, 'record') || ' registered in system',
      tender_user,
      json_build_object('status', t_record.status)
    ) on conflict do nothing;

    -- Approvals for awaiting_approval / approved
    if t_record.status = 'awaiting_approval' then
      insert into tender_approvals (tender_id, requested_by, approver_id, status, remarks)
      values (
        t_record.id,
        tender_user,
        admin_user,
        'PENDING',
        'Requesting internal participation decision per technical feasibility.'
      ) on conflict do nothing;
    end if;

    -- Sample portal issue
    if t_record.status in ('under_preparation', 'submitted') and not exists (select 1 from tender_portal_issues where tender_id = t_record.id) then
      insert into tender_portal_issues (
        tender_id, issue, reported_date, reported_by, responsible_person_id,
        resolution_status, resolution
      ) values (
        t_record.id,
        'GeM OEM authorization validation error for product catalog.',
        current_date - 1,
        tender_user,
        tender_user,
        'IN_PROGRESS',
        'Ticket raised with GeM Helpdesk #GM-8821.'
      ) on conflict do nothing;
    end if;
  end loop;
end $$;

ALTER TABLE tender_portal_issues DROP CONSTRAINT IF EXISTS tender_portal_issues_escalated_to_fkey;
ALTER TABLE tender_portal_issues ALTER COLUMN escalated_to TYPE TEXT;
