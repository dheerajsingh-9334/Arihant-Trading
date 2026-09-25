-- =====================================================================
-- Migration: 011_tender_management_specification.sql
-- Module 4: Tender Management — Production Spec Implementation
-- Additive, reversible migration for Configuration Tables, Workflow State
-- Machine, Main Table Constraints, Result Snapshots, Deadlines & Auditing
-- =====================================================================

-- 1. Configuration: tender_categories additions
alter table tender_categories add column if not exists requires_pq boolean not null default false;
alter table tender_categories add column if not exists active boolean not null default true;
alter table tender_categories add column if not exists sort_order integer not null default 0;

update tender_categories set requires_pq = true, sort_order = 1 where code in ('pq', 'PQ');
update tender_categories set requires_pq = false, sort_order = 2 where code in ('general_mha', 'GENERAL_MHA');
update tender_categories set requires_pq = false, sort_order = 3 where code in ('other', 'OTHER');

-- 2. Configuration: zones & regions active flag
alter table zones add column if not exists active boolean not null default true;
alter table regions add column if not exists active boolean not null default true;

-- 3. Configuration: tender_statuses lookup table
create table if not exists tender_statuses (
  code text primary key,
  label text not null,
  sort_order integer not null,
  is_terminal boolean not null default false,
  color text not null default 'default',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into tender_statuses (code, label, sort_order, is_terminal, color) values
  ('IDENTIFIED', 'Identified', 1, false, 'default'),
  ('AWAITING_INTERNAL_APPROVAL', 'Awaiting Internal Approval', 2, false, 'warning'),
  ('REJECTED_INTERNALLY', 'Rejected Internally', 3, true, 'danger'),
  ('UNDER_PREPARATION', 'Under Preparation', 4, false, 'info'),
  ('PQ_SUBMITTED', 'PQ Submitted', 5, false, 'info'),
  ('PQ_QUALIFIED', 'PQ Qualified', 6, false, 'success'),
  ('TENDER_SUBMITTED', 'Tender Submitted', 7, false, 'info'),
  ('TECHNICAL_EVALUATION', 'Technical Evaluation', 8, false, 'cyber'),
  ('COMMERCIAL_EVALUATION', 'Commercial Evaluation', 9, false, 'cyber'),
  ('WON', 'Won', 10, true, 'success'),
  ('LOST', 'Lost', 11, true, 'danger'),
  ('CANCELLED', 'Cancelled', 12, true, 'default')
on conflict (code) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_terminal = excluded.is_terminal,
  color = excluded.color;

-- 4. Configuration: tender_settings (single row)
create table if not exists tender_settings (
  id integer primary key default 1 check (id = 1),
  upcoming_days integer not null default 7,
  approaching_days integer not null default 3,
  approval_sla_hours integer not null default 24,
  result_followup_days integer not null default 15,
  allow_self_approval boolean not null default false,
  require_won_value boolean not null default true,
  escalation_user_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into tender_settings (id, upcoming_days, approaching_days, approval_sla_hours, result_followup_days, allow_self_approval, require_won_value)
values (1, 7, 3, 24, 15, false, true)
on conflict (id) do nothing;

-- 5. Configuration: tender_approvers table
create table if not exists tender_approvers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Seed existing management and admin users into tender_approvers
insert into tender_approvers (user_id)
select id from users where role in ('management', 'admin', 'regional_manager')
on conflict (user_id) do nothing;

-- 6. Configuration: loss_reasons table
create table if not exists loss_reasons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into loss_reasons (code, label, active, sort_order) values
  ('TECHNICAL', 'Technical / Specification Mismatch', true, 1),
  ('PRICING', 'Pricing / L1 Price Difference', true, 2),
  ('ELIGIBILITY', 'Turnover / Financial Eligibility', true, 3),
  ('DOCUMENTATION', 'Documentation / Compliance Deficiency', true, 4),
  ('PQ_NOT_QUALIFIED', 'PQ Not Qualified', true, 5),
  ('OTHER', 'Other Reason', true, 6)
on conflict (code) do update set
  label = excluded.label,
  active = excluded.active,
  sort_order = excluded.sort_order;

-- 7. Main table: tenders specification extensions
alter table tenders add column if not exists tender_number text;
alter table tenders add column if not exists organisation text;
alter table tenders add column if not exists category_id uuid references tender_categories(id);
alter table tenders add column if not exists owner uuid references users(id);
alter table tenders add column if not exists on_hold boolean not null default false;
alter table tenders add column if not exists status_before_hold text;
alter table tenders add column if not exists prep_checklist_done boolean not null default false;
alter table tenders add column if not exists tender_url text;
alter table tenders add column if not exists parent_tender_id uuid references tenders(id);
alter table tenders add column if not exists last_activity_at timestamptz not null default now();
alter table tenders add column if not exists version integer not null default 1;
alter table tenders add column if not exists extra_fields jsonb not null default '{}'::jsonb;
alter table tenders add column if not exists created_by uuid references users(id);

-- Backfill tender columns
update tenders set tender_number = tender_no where tender_number is null and tender_no is not null;
update tenders set tender_no = tender_number where tender_no is null and tender_number is not null;

update tenders set organisation = (select name from organisations where id = tenders.organisation_id)
where organisation is null and organisation_id is not null;
update tenders set organisation = 'Arihant Customer' where organisation is null;

update tenders set category_id = (select id from tender_categories where code = tenders.category::text limit 1)
where category_id is null;

update tenders set owner = coalesce(tender_owner_id, assigned_to) where owner is null;
update tenders set tender_owner_id = owner where tender_owner_id is null and owner is not null;

update tenders set last_activity_at = coalesce(updated_at, created_at, now()) where last_activity_at is null;

-- Trigger to sync tender_number, organisation, category, owner, dates, and enforce integrity
create or replace function trg_tender_integrity_sync()
returns trigger as $$
declare
  matched_zone uuid;
  cat_code text;
begin
  -- 1. Trim strings & handle empty strings as null
  if new.tender_number is not null then
    new.tender_number := trim(new.tender_number);
    if new.tender_number = '' then
      raise exception 'Tender number cannot be blank or whitespace only';
    end if;
  end if;

  if new.tender_no is not null then
    new.tender_no := trim(new.tender_no);
  end if;

  if new.tender_number is null and new.tender_no is not null then
    new.tender_number := new.tender_no;
  elsif new.tender_no is null and new.tender_number is not null then
    new.tender_no := new.tender_number;
  end if;

  if new.organisation is not null then
    new.organisation := trim(new.organisation);
    if new.organisation = '' then
      raise exception 'Organisation cannot be blank or whitespace only';
    end if;
  end if;

  if new.department is not null and trim(new.department) = '' then
    new.department := null;
  end if;

  if new.city is not null and trim(new.city) = '' then
    new.city := null;
  end if;

  if new.state is not null and trim(new.state) = '' then
    new.state := null;
  end if;

  -- 2. Sync category and category_id
  if new.category_id is not null and new.category is null then
    select code into cat_code from tender_categories where id = new.category_id;
    if cat_code in ('pq', 'general_mha', 'other') then
      new.category := cat_code::tender_category;
    end if;
  elsif new.category is not null and new.category_id is null then
    select id into new.category_id from tender_categories where code = new.category::text limit 1;
  end if;

  -- 3. Sync owner and tender_owner_id
  if new.owner is not null and new.tender_owner_id is null then
    new.tender_owner_id := new.owner;
  elsif new.tender_owner_id is not null and new.owner is null then
    new.owner := new.tender_owner_id;
  end if;

  -- Default owner to created_by or assigned_to if null
  if new.owner is null then
    new.owner := coalesce(new.created_by, new.assigned_to);
  end if;

  -- 4. Zone and Region validation
  -- "Region without zone is rejected. An empty string is stored as NULL. Region must belong to selected zone."
  if new.region_id is not null then
    if new.zone_id is null then
      raise exception 'Region without zone is rejected. Please select the zone for this region.';
    end if;
    select zone_id into matched_zone from regions where id = new.region_id;
    if matched_zone is null or matched_zone <> new.zone_id then
      raise exception 'Selected region does not belong to the selected zone.';
    end if;
  end if;

  -- 5. Publication date vs submission deadline check
  if new.publication_date is not null and new.submission_deadline is not null then
    if (TG_OP = 'INSERT' or new.publication_date is distinct from old.publication_date or new.submission_deadline is distinct from old.submission_deadline) then
      if new.publication_date > new.submission_deadline::date then
        raise exception 'Submission deadline cannot be earlier than publication date';
      end if;
    end if;
  end if;

  -- 6. Block creating a tender with deadline in the past, unless in import/historical mode
  if TG_OP = 'INSERT' and new.submission_deadline is not null then
    if new.submission_deadline < now() and (new.extra_fields is null or coalesce((new.extra_fields->>'is_historical')::boolean, false) = false) then
      raise exception 'Cannot create a tender with a submission deadline already in the past';
    end if;
  end if;

  -- 7. Normalize status casing if needed (e.g. UPPERCASE vs lowercase compatibility)
  if new.status is not null then
    new.status := lower(trim(new.status));
  end if;

  new.last_activity_at := now();

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tender_integrity_sync on tenders;
create trigger trg_tender_integrity_sync
before insert or update on tenders
for each row execute function trg_tender_integrity_sync();

-- Unique constraint: lower(trim(tender_number)), lower(trim(organisation)) WHERE is_deleted = false
drop index if exists uq_tenders_number_org;
create unique index uq_tenders_number_org on tenders (
  lower(trim(coalesce(tender_number, tender_no))),
  lower(trim(coalesce(organisation, '')))
) where is_deleted = false;

-- 8. Child table: tender_deadline_changes
create table if not exists tender_deadline_changes (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid not null references tenders(id) on delete cascade,
  old_deadline timestamptz not null,
  new_deadline timestamptz not null,
  reason text not null,
  changed_by uuid references users(id),
  changed_at timestamptz not null default now()
);

create index if not exists idx_tender_deadline_changes_tid on tender_deadline_changes(tender_id, changed_at desc);

-- 9. Child table: tender_results (with immutable snapshot at time of result)
create table if not exists tender_results (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid not null unique references tenders(id) on delete cascade,
  outcome text not null check (outcome in ('won', 'lost', 'WON', 'LOST')),
  result_date date not null,
  value numeric,
  loss_reasons text[] not null default '{}',
  other_reason_text text,
  competitor text,
  notes text,
  -- Snapshot columns
  zone_id uuid references zones(id),
  region_id uuid references regions(id),
  assigned_to uuid references users(id),
  category_id uuid references tender_categories(id),
  product_id uuid references products(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tender_results_tid on tender_results(tender_id);
create index if not exists idx_tender_results_outcome_date on tender_results(outcome, result_date desc);
create index if not exists idx_tender_results_zone on tender_results(zone_id);
create index if not exists idx_tender_results_region on tender_results(region_id);
create index if not exists idx_tender_results_assigned on tender_results(assigned_to);

-- 10. Alert deduplication: tender_notifications_log
create table if not exists tender_notifications_log (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid not null references tenders(id) on delete cascade,
  alert_type text not null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (tender_id, alert_type)
);

create index if not exists idx_tender_notifications_log_key on tender_notifications_log(tender_id, alert_type);

-- 11. Enable RLS on all new tables
do $$
declare
  tbl text;
  tables text[] := array[
    'tender_statuses', 'tender_settings', 'tender_approvers', 'loss_reasons',
    'tender_deadline_changes', 'tender_results', 'tender_notifications_log'
  ];
begin
  foreach tbl in array tables loop
    execute format('alter table %I enable row level security;', tbl);
  end loop;
end $$;
