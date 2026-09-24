-- =====================================================================
-- Migration: 010_tender_win_loss_issues.sql
-- Module 4: Tender Management — §26 Win/Loss Structured Intelligence
-- & External Portal Issues Tracking
-- =====================================================================

alter table tender_outcomes add column if not exists technical_issue text;
alter table tender_outcomes add column if not exists pricing_issue text;
alter table tender_outcomes add column if not exists eligibility_issue text;
alter table tender_outcomes add column if not exists documentation_issue text;
alter table tender_outcomes add column if not exists other_reason text;
alter table tender_outcomes add column if not exists notes text;

-- Index for win/loss analytics
create index if not exists idx_tender_outcomes_result_date on tender_outcomes(result, result_date desc);
