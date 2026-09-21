-- =====================================================================
-- Migration: 009_tender_compatibility_columns.sql
-- Module 4: Tender Management — Compatibility Columns & Triggers
-- Ensures submission_deadline, publication_date, and assigned_person_id
-- are always synchronized with bid_closing_date, publish_date, assigned_to
-- =====================================================================

alter table tenders add column if not exists submission_deadline timestamptz;
alter table tenders add column if not exists publication_date date;
alter table tenders add column if not exists assigned_person_id uuid references users(id);
alter table tenders add column if not exists department_id uuid references departments(id);
alter table tenders add column if not exists loss_reason varchar(100);
alter table tenders add column if not exists competitor varchar(200);
alter table tenders add column if not exists loss_notes text;

-- Synchronize existing values
update tenders set submission_deadline = coalesce(submission_deadline, bid_closing_date);
update tenders set publication_date = coalesce(publication_date, case when publish_date is not null then publish_date::date else null end);
update tenders set assigned_person_id = coalesce(assigned_person_id, assigned_to);

-- Keep submission_deadline and bid_closing_date synchronized via a trigger
create or replace function sync_tender_deadlines()
returns trigger as $$
begin
  if new.submission_deadline is not null and new.bid_closing_date is null then
    new.bid_closing_date := new.submission_deadline;
  elsif new.bid_closing_date is not null and new.submission_deadline is null then
    new.submission_deadline := new.bid_closing_date;
  end if;

  if new.publication_date is not null and new.publish_date is null then
    new.publish_date := new.publication_date::text;
  elsif new.publish_date is not null and new.publication_date is null then
    begin
      new.publication_date := new.publish_date::date;
    exception when others then
      -- ignore invalid date cast
    end;
  end if;

  if new.assigned_person_id is not null and new.assigned_to is null then
    new.assigned_to := new.assigned_person_id;
  elsif new.assigned_to is not null and new.assigned_person_id is null then
    new.assigned_person_id := new.assigned_to;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_sync_tender_deadlines on tenders;
create trigger trg_sync_tender_deadlines
before insert or update on tenders
for each row execute function sync_tender_deadlines();
