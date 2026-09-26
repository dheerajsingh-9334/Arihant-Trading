-- =====================================================================
-- Migration 013: Add department column to organisations and leads
-- Allows storing department/unit/wing during lead registration
-- =====================================================================

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS department text;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS department text;
