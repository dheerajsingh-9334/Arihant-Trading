-- =====================================================================
-- Migration 008: Module 1 — Lead & Customer Management (EDA)
-- Implements:
--   - Fresh vs Re-Approached lead categorization
--   - Centralized 11-stage Lead Lifecycle
--   - Multi-Product Interests mapping (lead_product_interests)
--   - Salesperson Ownership & Assignment History (lead_assignment_history)
--   - Unified Follow-up Lifecycle (follow_ups)
--   - Interaction Supporting Attachments (interaction_attachments)
--   - Performance Indexes for territorial CRM queries
-- =====================================================================

-- 1. Extend leads table with lead_type, lead_status, loss_reason, and timestamps
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_type text NOT NULL DEFAULT 'fresh',
  ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS loss_reason text,
  ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_followup_at timestamptz;

-- Ensure check constraints for lead_type and lead_status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_leads_lead_type') THEN
    ALTER TABLE leads ADD CONSTRAINT chk_leads_lead_type CHECK (lead_type IN ('fresh', 're_approached'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_leads_lead_status') THEN
    ALTER TABLE leads ADD CONSTRAINT chk_leads_lead_status CHECK (
      lead_status IN (
        'new', 'contacted', 'qualified', 'follow_up', 'demo',
        'proposal', 'tender_discussion', 'negotiation', 'converted',
        'won', 'lost', 'on_hold', 'open', 'quoted', 'dropped'
      )
    );
  END IF;
END $$;

-- 2. Multi-Product Interests mapping table (lead_product_interests)
CREATE TABLE IF NOT EXISTS lead_product_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  CONSTRAINT uq_lead_product_interest UNIQUE (lead_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_product_interests_lead_id ON lead_product_interests(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_product_interests_product_id ON lead_product_interests(product_id);

-- 3. Salesperson Ownership & Assignment History (lead_assignment_history)
CREATE TABLE IF NOT EXISTS lead_assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  previous_salesperson_id uuid REFERENCES users(id),
  new_salesperson_id uuid NOT NULL REFERENCES users(id),
  previous_regional_manager_id uuid REFERENCES users(id),
  new_regional_manager_id uuid REFERENCES users(id),
  changed_by uuid NOT NULL REFERENCES users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  reason text
);

CREATE INDEX IF NOT EXISTS idx_lead_assignment_history_lead ON lead_assignment_history(lead_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_assignment_history_sales ON lead_assignment_history(new_salesperson_id);

-- 4. Follow-ups Table (follow_ups)
CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  interaction_id uuid REFERENCES interactions(id) ON DELETE SET NULL,
  assigned_to uuid NOT NULL REFERENCES users(id),
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  remarks text,
  outcome text,
  completed_at timestamptz,
  completed_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_follow_up_status CHECK (status IN ('pending', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_assigned_status ON follow_ups(assigned_to, status, due_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_org_status ON follow_ups(organisation_id, status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead ON follow_ups(lead_id);

-- 5. Interaction Attachments Table (interaction_attachments)
CREATE TABLE IF NOT EXISTS interaction_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id uuid NOT NULL REFERENCES interactions(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interaction_attachments_interaction ON interaction_attachments(interaction_id);

-- 6. Add updated_at to interactions if missing
ALTER TABLE interactions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 7. High-performance composite indexes for Lead filtering & reports
CREATE INDEX IF NOT EXISTS idx_leads_lead_type_status ON leads(lead_type, lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_status ON leads(assigned_to, lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_followup_status ON leads(next_followup_date, lead_status);
CREATE INDEX IF NOT EXISTS idx_interactions_org_occurred ON interactions(organisation_id, occurred_on DESC);

-- 8. Backfill existing leads lead_type based on whether prior interactions existed
UPDATE leads l
SET lead_type = CASE
  WHEN (SELECT count(i.id) FROM interactions i WHERE i.organisation_id = l.organisation_id AND i.occurred_on < l.created_at::date) > 0 THEN 're_approached'
  ELSE 'fresh'
END,
lead_status = CASE
  WHEN l.status = 'open' THEN 'new'
  WHEN l.status IS NOT NULL THEN l.status
  ELSE 'new'
END
WHERE l.lead_type IS NULL OR l.lead_type = 'fresh';
