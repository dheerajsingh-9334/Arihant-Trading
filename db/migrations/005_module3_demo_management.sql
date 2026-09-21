-- =====================================================================
-- ARIHANT BOS — MODULE 3: DEMO MANAGEMENT ENHANCEMENTS MIGRATION
-- (005_module3_demo_management.sql)
-- =====================================================================

-- 1. Create a sequence for human-readable demo codes (DEM-1001, DEM-1002, etc.)
create sequence if not exists demo_no_seq start with 1001;

-- 2. Enhance demos table with Module 3 fields
alter table demos add column if not exists demo_no text unique default ('DEM-' || nextval('demo_no_seq')::text);
alter table demos add column if not exists purpose text;
alter table demos add column if not exists remarks text;
alter table demos add column if not exists visit_id uuid references visits(id) on delete set null;
alter table demos add column if not exists reschedule_reason text;
alter table demos add column if not exists rescheduled_from date;
alter table demos add column if not exists cancellation_reason text;
alter table demos add column if not exists travel_required boolean default false;
alter table demos add column if not exists travel_from text;
alter table demos add column if not exists travel_to text;
alter table demos add column if not exists travel_date date;
alter table demos add column if not exists travel_remarks text;
alter table demos add column if not exists version integer not null default 1;

-- Backfill any existing demos without demo_no
update demos set demo_no = 'DEM-' || nextval('demo_no_seq')::text where demo_no is null;

-- Indexes for fast filtering and relationship lookups
create index if not exists idx_demos_demo_no on demos(demo_no);
create index if not exists idx_demos_visit_id on demos(visit_id);
create index if not exists idx_demos_org_id on demos(organisation_id);
create index if not exists idx_demos_assigned_to on demos(assigned_to);
create index if not exists idx_demos_requested_by on demos(requested_by);
create index if not exists idx_demos_requested_date on demos(requested_date);
create index if not exists idx_demos_confirmed_date on demos(confirmed_date);
create index if not exists idx_demos_status on demos(status);

-- 3. Enhance demo_equipment table
create unique index if not exists idx_demo_equipment_serial_no 
  on demo_equipment(serial_no) where serial_no is not null;

-- 4. Enhance demo_reservations table
alter table demo_reservations add column if not exists alternative_equipment_id uuid references demo_equipment(id) on delete set null;
alter table demo_reservations add column if not exists alternative_reason text;
alter table demo_reservations add column if not exists remarks text;
alter table demo_reservations add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_demo_reservations_equipment_dates 
  on demo_reservations(equipment_id, reserved_from, reserved_to);
create index if not exists idx_demo_reservations_demo_id 
  on demo_reservations(demo_id);

-- 5. Enhance demo_outcomes table
alter table demo_outcomes add column if not exists submitted_by uuid references users(id);
-- Ensure one outcome per demo
create unique index if not exists idx_demo_outcomes_demo_id_unique 
  on demo_outcomes(demo_id);

-- 6. Link demos to customer interactions timeline (avoid duplicate history entries on retry)
alter table interactions add column if not exists demo_id uuid references demos(id) on delete set null;
create unique index if not exists idx_interactions_demo_id_unique 
  on interactions(demo_id) where demo_id is not null;

-- 7. Create demo_reschedule_history table
create table if not exists demo_reschedule_history (
  id          uuid primary key default gen_random_uuid(),
  demo_id     uuid not null references demos(id) on delete cascade,
  old_date    date,
  new_date    date not null,
  reason      text not null,
  changed_by  uuid references users(id),
  created_at  timestamptz not null default now()
);

create index if not exists idx_demo_reschedule_history_demo_id 
  on demo_reschedule_history(demo_id, created_at desc);

-- 8. Seed additional demo fleet equipment if needed for realistic testing across Delhi, Patna, Kolkata
do $$
declare
  dfmd_prod_id uuid;
  hhmd_prod_id uuid;
  ti_prod_id   uuid;
  admin_id     uuid;
begin
  select id into dfmd_prod_id from products where name ilike '%DFMD%' limit 1;
  select id into hhmd_prod_id from products where name ilike '%Hand Held%' or name ilike '%HHMD%' limit 1;
  select id into ti_prod_id from products where name ilike '%Thermal%' limit 1;
  select id into admin_id from users where role = 'admin' limit 1;

  if dfmd_prod_id is not null then
    insert into demo_equipment (product_id, model, serial_no, current_location, responsible_person, availability_status, condition, remarks)
    values
      (dfmd_prod_id, 'DFMD-MULTI-9', 'DFMD-PAT-01', 'Patna', admin_id, 'available', 'Operational', 'Patna field demo depot unit'),
      (dfmd_prod_id, 'DFMD-MULTI-9', 'DFMD-DEL-02', 'Delhi', admin_id, 'available', 'Operational', 'Delhi primary backup unit')
    on conflict do nothing;
  end if;
end $$;
