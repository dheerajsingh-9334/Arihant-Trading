-- =====================================================================
-- ARIHANT BOS — MODULE 2: VISITS, TRIPS & EMPLOYEE ACTIVITY MIGRATION
-- (003_module2_trips_and_activities.sql)
-- =====================================================================

-- 1. Create trips table (Trip ├── Visit 1, Visit 2, Visit 3)
create table if not exists trips (
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

create index if not exists idx_trips_employee_date on trips(employee_id, trip_date);
create index if not exists idx_trips_status on trips(status);

-- Attach updated_at trigger to trips
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_trips_updated'
  ) then
    create trigger trg_trips_updated before update on trips
    for each row execute function set_updated_at();
  end if;
end $$;

-- 2. Alter visits table with Module 2 enhancements
alter table visits add column if not exists trip_id uuid references trips(id) on delete set null;
alter table visits add column if not exists start_time text;
alter table visits add column if not exists end_time text;
alter table visits add column if not exists latitude numeric;
alter table visits add column if not exists longitude numeric;
alter table visits add column if not exists manager_assigned boolean default false;
alter table visits add column if not exists version integer not null default 1;

create index if not exists idx_visits_trip_id on visits(trip_id);
create index if not exists idx_visits_assigned_date on visits(assigned_to, planned_date);
create index if not exists idx_visits_org_date on visits(organisation_id, planned_date);

-- 3. Alter interactions table (customer history timeline anchor)
alter table interactions add column if not exists visit_id uuid references visits(id) on delete set null;

create unique index if not exists idx_interactions_visit_id_unique
  on interactions(visit_id) where visit_id is not null;

-- 4. Ensure visit_updates has unique constraint on visit_id to prevent double post-visit submission
create unique index if not exists idx_visit_updates_visit_id_unique
  on visit_updates(visit_id);

-- 5. Create employee_activities table (chronological employee log & achievements)
create table if not exists employee_activities (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references users(id) on delete cascade,
  activity_type text not null default 'field_visit', -- field_visit, call, demo, task
  entity_type   text not null default 'visit',       -- visit, demo, tender
  entity_id     uuid not null,
  activity_date date not null,
  title         text not null,
  status        text not null,                       -- completed, not_completed, planned
  outcome       text,
  next_action   text,
  followup_date date,
  details       jsonb,
  created_at    timestamptz not null default now(),
  constraint uq_employee_activity unique (employee_id, entity_type, entity_id)
);

create index if not exists idx_employee_activities_emp_date on employee_activities(employee_id, activity_date desc);
create index if not exists idx_employee_activities_date on employee_activities(activity_date desc);
