-- Migration: 001_local_auth.sql
-- Add password_hash column to support local authentication alongside Supabase Auth

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
