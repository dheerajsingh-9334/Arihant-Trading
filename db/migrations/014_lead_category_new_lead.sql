-- =====================================================================
-- Migration 014: Extend lead_category enum with 'new_lead'
-- Allows Sales Team to classify newly created prospects as 'new_lead'
-- =====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
    WHERE pg_type.typname = 'lead_category' AND pg_enum.enumlabel = 'new_lead'
  ) THEN
    ALTER TYPE lead_category ADD VALUE 'new_lead';
  END IF;
END $$;
