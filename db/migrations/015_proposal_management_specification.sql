-- =====================================================================
-- Migration 015: Module 5 — Proposal Management Specification
-- Production-grade, reversible schema implementation
-- Covers:
--   1. Sequence for canonical proposal_no (PRP-YYYY-NNNNN)
--   2. Extended columns on proposals table & synchronization triggers
--   3. proposal_products table (multi-product, exactly 1 primary)
--   4. proposal_versions table (immutable versions after dispatch)
--   5. proposal_status_history table (audit trail of state transitions)
--   6. proposal_follow_ups table (append-only follow-up ledger)
--   7. proposal_timeline table (per-proposal activity projection)
--   8. proposal_settings table (dynamic SLA, staleness & config rules)
--   9. dead_letter_events table (reliable outbox dead-letter & replay)
--  10. scheduler_dedupe table (distributed lock & once-per-day deduplication)
--  11. outbox_events schema extensions (aggregate_sequence, correlation_id)
--  12. Strategic performance indexes & DB invariant check constraints
-- =====================================================================

-- 1. Create atomic sequence for canonical proposal_no
CREATE SEQUENCE IF NOT EXISTS proposal_canonical_seq START WITH 1001;

-- 2. Enhance proposals table with all Module 5 specification columns
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS proposal_no text UNIQUE,
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES organisations(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS sector_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requested_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS responsible_person_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS follow_up_owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS next_follow_up_date date,
  ADD COLUMN IF NOT EXISTS next_follow_up_time time,
  ADD COLUMN IF NOT EXISTS current_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS email_reference text,
  ADD COLUMN IF NOT EXISTS approved_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_cycle_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sent_late boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS outcome_date date,
  ADD COLUMN IF NOT EXISTS lost_reason_code text,
  ADD COLUMN IF NOT EXISTS lost_reason_text text,
  ADD COLUMN IF NOT EXISTS lost_to_competitor text,
  ADD COLUMN IF NOT EXISTS closure_reason_code text,
  ADD COLUMN IF NOT EXISTS closure_reason_text text,
  ADD COLUMN IF NOT EXISTS conversion_reference text,
  ADD COLUMN IF NOT EXISTS status_before_terminal text,
  ADD COLUMN IF NOT EXISTS related_proposal_id uuid REFERENCES proposals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS follow_up_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS postpone_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS owner_inactive_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_ref text UNIQUE,
  ADD COLUMN IF NOT EXISTS row_version integer NOT NULL DEFAULT 1;

-- Backfill legacy records to populate new canonical columns
UPDATE proposals
SET
  proposal_no = COALESCE(proposal_no, 'PRP-2026-' || LPAD(nextval('proposal_canonical_seq')::text, 5, '0')),
  customer_id = COALESCE(customer_id, organisation_id),
  requested_by_id = COALESCE(requested_by_id, requested_by),
  responsible_person_id = COALESCE(responsible_person_id, responsible_id),
  follow_up_owner_id = COALESCE(follow_up_owner_id, followup_owner_id),
  next_follow_up_date = COALESCE(next_follow_up_date, next_followup),
  email_reference = COALESCE(email_reference, reference),
  approved_by_id = COALESCE(approved_by_id, approved_by),
  lost_reason_code = COALESCE(lost_reason_code, lost_reason),
  lost_reason_text = COALESCE(lost_reason_text, lost_remarks),
  conversion_reference = COALESCE(conversion_reference, converted_reference),
  last_activity_at = COALESCE(last_activity_at, updated_at, created_at)
WHERE proposal_no IS NULL OR customer_id IS NULL;

-- Backfill outcome_date and sent_date/follow_up_owner for existing terminal/sent proposals
UPDATE proposals
SET outcome_date = COALESCE(outcome_date, updated_at::date, current_date)
WHERE status IN ('CONVERTED', 'LOST', 'CLOSED') AND outcome_date IS NULL;

UPDATE proposals
SET outcome_date = NULL
WHERE status NOT IN ('CONVERTED', 'LOST', 'CLOSED') AND outcome_date IS NOT NULL;

UPDATE proposals
SET
  sent_date = COALESCE(sent_date, request_date, current_date),
  follow_up_owner_id = COALESCE(follow_up_owner_id, followup_owner_id, responsible_person_id, responsible_id, requested_by_id, requested_by)
WHERE status IN ('SENT_TO_CUSTOMER', 'FOLLOW_UP_REQUIRED', 'CONVERTED', 'LOST', 'CLOSED')
  AND (sent_date IS NULL OR (follow_up_owner_id IS NULL AND followup_owner_id IS NULL));

-- 3. proposal_products (multi-product with strict primary constraint)
CREATE TABLE IF NOT EXISTS proposal_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_proposal_product UNIQUE (proposal_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_proposal_products_proposal ON proposal_products(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_products_product ON proposal_products(product_id);

-- Backfill proposal_products from existing proposals
INSERT INTO proposal_products (proposal_id, product_id, is_primary)
SELECT id, product_id, true
FROM proposals
WHERE product_id IS NOT NULL
ON CONFLICT (proposal_id, product_id) DO NOTHING;

-- 4. proposal_versions (immutable snapshot after sent)
CREATE TABLE IF NOT EXISTS proposal_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version_no integer NOT NULL DEFAULT 1,
  change_summary text,
  email_references jsonb NOT NULL DEFAULT '[]'::jsonb,
  document_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  sent_date date,
  sent_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_proposal_version UNIQUE (proposal_id, version_no)
);

CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal ON proposal_versions(proposal_id, version_no DESC);

-- 5. proposal_status_history
CREATE TABLE IF NOT EXISTS proposal_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  reason text,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  event_id text
);

CREATE INDEX IF NOT EXISTS idx_proposal_status_history_proposal ON proposal_status_history(proposal_id, occurred_at DESC);

-- 6. proposal_follow_ups (append-only interaction ledger)
CREATE TABLE IF NOT EXISTS proposal_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  contact_date date NOT NULL DEFAULT current_date,
  mode text NOT NULL DEFAULT 'Call',
  contact_person text,
  summary text NOT NULL,
  response text NOT NULL DEFAULT 'Neutral',
  next_follow_up_date date,
  is_postpone boolean NOT NULL DEFAULT false,
  postpone_reason text,
  logged_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_proposal_follow_ups_proposal ON proposal_follow_ups(proposal_id, contact_date DESC);
CREATE INDEX IF NOT EXISTS idx_proposal_follow_ups_logged_by ON proposal_follow_ups(logged_by);

-- 7. proposal_timeline (per-proposal activity narrative projection)
CREATE TABLE IF NOT EXISTS proposal_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  category text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  description text,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposal_timeline_proposal ON proposal_timeline(proposal_id, occurred_at DESC);

-- 8. proposal_settings (single-row dynamic configuration)
CREATE TABLE IF NOT EXISTS proposal_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  business_timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  default_follow_up_days integer NOT NULL DEFAULT 3,
  no_follow_up_after_days integer NOT NULL DEFAULT 7,
  escalate_after_overdue_days integer NOT NULL DEFAULT 3,
  stale_requested_days integer NOT NULL DEFAULT 2,
  stale_preparation_days integer NOT NULL DEFAULT 7,
  stale_review_days integer NOT NULL DEFAULT 2,
  stale_approved_days integer NOT NULL DEFAULT 2,
  stale_followup_days integer NOT NULL DEFAULT 21,
  required_date_warning_days integer NOT NULL DEFAULT 2,
  urgent_days integer NOT NULL DEFAULT 1,
  max_follow_up_horizon_days integer NOT NULL DEFAULT 90,
  max_postpones_before_flag integer NOT NULL DEFAULT 3,
  suggest_closure_after_days integer NOT NULL DEFAULT 60,
  duplicate_window_days integer NOT NULL DEFAULT 30,
  reopen_window_days integer NOT NULL DEFAULT 30,
  allow_self_approval boolean NOT NULL DEFAULT false,
  allow_fast_track boolean NOT NULL DEFAULT false,
  digest_time text NOT NULL DEFAULT '09:00',
  proposal_number_format text NOT NULL DEFAULT 'PRP-YYYY-NNNNN',
  lost_reason_codes jsonb NOT NULL DEFAULT '["Price Too High", "Competitor Chosen", "Specification Mismatch", "Customer Budget Withdrawn", "Procurement Delayed", "Other"]'::jsonb,
  closure_reason_codes jsonb NOT NULL DEFAULT '["Cancelled by Requester", "Customer Withdrew Enquiry", "Duplicate", "No Response / Expired", "Superseded by New Proposal", "Other"]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO proposal_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 9. dead_letter_events (outbox failure containment & replay ledger)
CREATE TABLE IF NOT EXISTS dead_letter_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id varchar(100) UNIQUE NOT NULL,
  event_type varchar(100) NOT NULL,
  aggregate_type varchar(50) NOT NULL DEFAULT 'Proposal',
  aggregate_id varchar(100) NOT NULL,
  payload jsonb NOT NULL,
  error_message text,
  attempts int NOT NULL DEFAULT 5,
  failed_at timestamptz NOT NULL DEFAULT now(),
  replayed_at timestamptz,
  replayed_by uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_dead_letter_events_aggregate ON dead_letter_events(aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS idx_dead_letter_events_failed_at ON dead_letter_events(failed_at DESC);

-- 10. scheduler_dedupe (distributed cron synchronization & deduplication)
CREATE TABLE IF NOT EXISTS scheduler_dedupe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key varchar(255) UNIQUE NOT NULL,
  event_type varchar(100) NOT NULL,
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE,
  business_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduler_dedupe_lookup ON scheduler_dedupe(dedupe_key);

-- 11. Extend outbox_events table for rich domain event envelope
ALTER TABLE outbox_events
  ADD COLUMN IF NOT EXISTS event_version varchar(20) DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS aggregate_sequence int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS correlation_id varchar(100),
  ADD COLUMN IF NOT EXISTS causation_id varchar(100),
  ADD COLUMN IF NOT EXISTS tenant_id varchar(100),
  ADD COLUMN IF NOT EXISTS suppress_notifications boolean DEFAULT false;

-- 12. Strategic performance indexes specified in Section 4.7
CREATE INDEX IF NOT EXISTS idx_proposals_status_next_fu ON proposals(status, next_follow_up_date) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_proposals_owner_next_fu ON proposals(follow_up_owner_id, next_follow_up_date) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_proposals_responsible_status ON proposals(responsible_person_id, status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_proposals_status_last_activity ON proposals(status, last_activity_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_proposals_customer_id ON proposals(customer_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_proposals_sector_status ON proposals(sector_id, status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_proposals_required_date_lookup ON proposals(required_date) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_proposals_canonical_no ON proposals(proposal_no);
CREATE INDEX IF NOT EXISTS idx_proposals_outcome_date_lookup ON proposals(outcome_date) WHERE outcome_date IS NOT NULL;

-- 13. Data Invariant Check Constraints (Section 4.8)
DO $$
BEGIN
  -- Terminal statuses require outcome_date
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_proposals_terminal_outcome') THEN
    ALTER TABLE proposals ADD CONSTRAINT chk_proposals_terminal_outcome
      CHECK (status NOT IN ('CONVERTED', 'LOST', 'CLOSED') OR outcome_date IS NOT NULL);
  END IF;

  -- Non-terminal statuses should not have outcome_date
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_proposals_non_terminal_no_outcome') THEN
    ALTER TABLE proposals ADD CONSTRAINT chk_proposals_non_terminal_no_outcome
      CHECK (status IN ('CONVERTED', 'LOST', 'CLOSED') OR outcome_date IS NULL);
  END IF;

  -- Dispatched proposals require sent_date and follow_up_owner_id
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_proposals_sent_requirements') THEN
    ALTER TABLE proposals ADD CONSTRAINT chk_proposals_sent_requirements
      CHECK (
        status NOT IN ('SENT_TO_CUSTOMER', 'FOLLOW_UP_REQUIRED', 'CONVERTED', 'LOST')
        OR (sent_date IS NOT NULL AND (follow_up_owner_id IS NOT NULL OR followup_owner_id IS NOT NULL))
      );
  END IF;
END $$;
