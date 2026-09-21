-- Module 2: Add contact_person text column to visits table
ALTER TABLE visits ADD COLUMN IF NOT EXISTS contact_person text;
