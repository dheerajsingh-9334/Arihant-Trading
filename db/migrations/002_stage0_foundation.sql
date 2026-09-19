-- =====================================================================
-- ARIHANT BOS — STAGE 0 FOUNDATION MIGRATION (002_stage0_foundation.sql)
-- =====================================================================
-- Creates:
--  1. departments master table
--  2. role_permissions granular matrix table
--  3. app_users view for Supabase user compatibility
--  4. Seeds default departments & role permissions for all 8 roles
--  5. Enables Row Level Security (RLS) on all tables as defence-in-depth safety net
-- =====================================================================

create table if not exists departments (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists role_permissions (
  id          uuid primary key default gen_random_uuid(),
  role        user_role not null,
  module      text not null,
  can_view    boolean not null default false,
  can_create  boolean not null default false,
  can_edit    boolean not null default false,
  can_delete  boolean not null default false,
  can_approve boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(role, module)
);

-- app_users view mirrors users with role and department info for Supabase alignment
create or replace view app_users as
select 
  u.id,
  u.full_name,
  u.email,
  u.phone,
  u.role,
  u.region_id,
  u.zone_id,
  u.reporting_manager_id,
  u.is_active,
  u.created_at,
  u.updated_at
from users u;

-- Seed default departments
insert into departments (code, name, description) values
  ('management', 'Executive Leadership', 'Board of Directors and Top Corporate Management'),
  ('sales', 'Field Sales & Business Development', 'Regional and territory security equipment sales'),
  ('tenders', 'National GeM Tenders Cell', 'GeM portal tracking, qualification criteria, and bid submission'),
  ('demos', 'Demonstrations & Field Trials', 'Depot asset deployment, field trial staging, and failure analysis'),
  ('service', 'Service & Breakdown Support', 'Technical repairs, warranty SLA, and maintenance engineers'),
  ('accounts', 'Corporate Finance & Accounts', 'Financial audit, invoice settlement, and expense approvals'),
  ('admin', 'Systems & Platform Infrastructure', 'Enterprise security, identity governance, and access control')
on conflict (code) do update set name = excluded.name, description = excluded.description;

-- Seed role_permissions matrix for all 8 roles across modules
insert into role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve) values
  -- 1. Management (Unrestricted visibility & strategic approvals)
  ('management', 'dashboard', true, false, false, false, false),
  ('management', 'tenders', true, true, true, true, true),
  ('management', 'leads', true, true, true, true, true),
  ('management', 'visits', true, true, true, true, true),
  ('management', 'demos', true, true, true, true, true),
  ('management', 'proposals', true, true, true, true, true),
  ('management', 'service', true, true, true, true, true),
  ('management', 'expenses', true, false, true, false, true),
  ('management', 'tasks', true, true, true, true, true),
  ('management', 'regional', true, false, true, false, true),
  ('management', 'reports', true, true, true, false, true),
  ('management', 'admin', true, false, false, false, false),

  -- 2. Regional Manager (Zonal command & Stage-1 Approvals)
  ('regional_manager', 'dashboard', true, false, false, false, false),
  ('regional_manager', 'tenders', true, true, true, false, true),
  ('regional_manager', 'leads', true, true, true, false, false),
  ('regional_manager', 'visits', true, true, true, false, true),
  ('regional_manager', 'demos', true, true, true, false, true),
  ('regional_manager', 'proposals', true, true, true, false, true),
  ('regional_manager', 'service', true, false, false, false, false),
  ('regional_manager', 'expenses', true, false, true, false, true),
  ('regional_manager', 'tasks', true, true, true, false, true),
  ('regional_manager', 'regional', true, true, true, false, true),
  ('regional_manager', 'reports', true, false, false, false, false),
  ('regional_manager', 'admin', false, false, false, false, false),

  -- 3. Sales Executive (Customer touchpoints & deal origination)
  ('sales', 'dashboard', true, false, false, false, false),
  ('sales', 'tenders', true, false, false, false, false),
  ('sales', 'leads', true, true, true, false, false),
  ('sales', 'visits', true, true, true, false, false),
  ('sales', 'demos', true, true, false, false, false),
  ('sales', 'proposals', true, true, true, false, false),
  ('sales', 'service', false, false, false, false, false),
  ('sales', 'expenses', true, true, true, false, false),
  ('sales', 'tasks', true, true, true, false, false),
  ('sales', 'regional', false, false, false, false, false),
  ('sales', 'reports', false, false, false, false, false),
  ('sales', 'admin', false, false, false, false, false),

  -- 4. Tender Team (Bid qualification, compliance, commercial outcome)
  ('tender_team', 'dashboard', true, false, false, false, false),
  ('tender_team', 'tenders', true, true, true, false, false),
  ('tender_team', 'leads', true, false, false, false, false),
  ('tender_team', 'visits', false, false, false, false, false),
  ('tender_team', 'demos', true, false, false, false, false),
  ('tender_team', 'proposals', true, false, false, false, false),
  ('tender_team', 'service', false, false, false, false, false),
  ('tender_team', 'expenses', true, true, true, false, false),
  ('tender_team', 'tasks', true, true, true, false, false),
  ('tender_team', 'regional', false, false, false, false, false),
  ('tender_team', 'reports', true, true, false, false, false),
  ('tender_team', 'admin', false, false, false, false, false),

  -- 5. Demo Team (Equipment trials & failure analysis)
  ('demo_team', 'dashboard', true, false, false, false, false),
  ('demo_team', 'tenders', false, false, false, false, false),
  ('demo_team', 'leads', true, false, false, false, false),
  ('demo_team', 'visits', true, false, false, false, false),
  ('demo_team', 'demos', true, true, true, false, true),
  ('demo_team', 'proposals', false, false, false, false, false),
  ('demo_team', 'service', true, false, false, false, false),
  ('demo_team', 'expenses', true, true, true, false, false),
  ('demo_team', 'tasks', true, true, true, false, false),
  ('demo_team', 'regional', false, false, false, false, false),
  ('demo_team', 'reports', false, false, false, false, false),
  ('demo_team', 'admin', false, false, false, false, false),

  -- 6. Service Team (Ticket breakdown & repair sign-offs)
  ('service_team', 'dashboard', true, false, false, false, false),
  ('service_team', 'tenders', false, false, false, false, false),
  ('service_team', 'leads', false, false, false, false, false),
  ('service_team', 'visits', true, false, false, false, false),
  ('service_team', 'demos', false, false, false, false, false),
  ('service_team', 'proposals', false, false, false, false, false),
  ('service_team', 'service', true, true, true, false, true),
  ('service_team', 'expenses', true, true, true, false, false),
  ('service_team', 'tasks', true, true, true, false, false),
  ('service_team', 'regional', false, false, false, false, false),
  ('service_team', 'reports', false, false, false, false, false),
  ('service_team', 'admin', false, false, false, false, false),

  -- 7. Accounts (Stage-2 Expense settlement & financial compliance)
  ('accounts', 'dashboard', true, false, false, false, false),
  ('accounts', 'tenders', true, false, false, false, false),
  ('accounts', 'leads', false, false, false, false, false),
  ('accounts', 'visits', false, false, false, false, false),
  ('accounts', 'demos', false, false, false, false, false),
  ('accounts', 'proposals', true, false, false, false, false),
  ('accounts', 'service', false, false, false, false, false),
  ('accounts', 'expenses', true, true, true, false, true),
  ('accounts', 'tasks', true, true, true, false, false),
  ('accounts', 'regional', false, false, false, false, false),
  ('accounts', 'reports', true, true, true, false, true),
  ('accounts', 'admin', false, false, false, false, false),

  -- 8. Admin (Full operational & structural administration)
  ('admin', 'dashboard', true, true, true, true, true),
  ('admin', 'tenders', true, true, true, true, true),
  ('admin', 'leads', true, true, true, true, true),
  ('admin', 'visits', true, true, true, true, true),
  ('admin', 'demos', true, true, true, true, true),
  ('admin', 'proposals', true, true, true, true, true),
  ('admin', 'service', true, true, true, true, true),
  ('admin', 'expenses', true, true, true, true, true),
  ('admin', 'tasks', true, true, true, true, true),
  ('admin', 'regional', true, true, true, true, true),
  ('admin', 'reports', true, true, true, true, true),
  ('admin', 'admin', true, true, true, true, true)
on conflict (role, module) do update set
  can_view = excluded.can_view,
  can_create = excluded.can_create,
  can_edit = excluded.can_edit,
  can_delete = excluded.can_delete,
  can_approve = excluded.can_approve;

-- =====================================================================
-- RLS DENY-ALL SAFETY NET
-- =====================================================================
-- Enable RLS on every table. NestJS uses service-role / superuser credentials
-- to bypass RLS, ensuring zero accidental leakage for client-side direct calls.
-- =====================================================================
do $$
declare
  tbl text;
  tables text[] := array[
    'zones', 'regions', 'products', 'users', 'organisations', 'contacts',
    'leads', 'interactions', 'visits', 'visit_updates', 'demo_equipment',
    'demos', 'demo_reservations', 'demo_outcomes', 'tenders',
    'tender_status_history', 'tender_outcomes', 'proposals', 'service_tickets',
    'service_reports', 'expenses', 'tasks', 'task_blockers', 'attachments',
    'notifications', 'audit_log', 'departments', 'role_permissions'
  ];
begin
  foreach tbl in array tables loop
    execute format('alter table %I enable row level security;', tbl);
  end loop;
end $$;
