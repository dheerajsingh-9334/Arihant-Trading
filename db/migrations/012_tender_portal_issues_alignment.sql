-- Migration 012: Align tender_portal_issues with Module 4 Specification (§2)
-- Child table: tender_portal_issues: id, tender_id, portal, issue, issue_date, responsible_user, escalated_to, escalated_at, status (OPEN / ESCALATED / RESOLVED), resolution, resolved_by, resolved_at.

ALTER TABLE tender_portal_issues ADD COLUMN IF NOT EXISTS portal VARCHAR(100) DEFAULT 'GeM';
ALTER TABLE tender_portal_issues ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE tender_portal_issues ADD COLUMN IF NOT EXISTS responsible_user UUID REFERENCES users(id);
ALTER TABLE tender_portal_issues ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;
ALTER TABLE tender_portal_issues ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'OPEN';
ALTER TABLE tender_portal_issues ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES users(id);

-- Backfill and synchronize existing records
UPDATE tender_portal_issues SET portal = 'GeM' WHERE portal IS NULL;
UPDATE tender_portal_issues SET issue_date = reported_date WHERE issue_date IS NULL AND reported_date IS NOT NULL;
UPDATE tender_portal_issues SET responsible_user = responsible_person_id WHERE responsible_user IS NULL AND responsible_person_id IS NOT NULL;
UPDATE tender_portal_issues SET escalated_at = escalation_date WHERE escalated_at IS NULL AND escalation_date IS NOT NULL;
UPDATE tender_portal_issues SET status = resolution_status WHERE status IS NULL;

-- Trigger to keep status/resolution_status and dates in sync
CREATE OR REPLACE FUNCTION sync_tender_portal_issues_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.portal IS NULL THEN
    NEW.portal := 'GeM';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.resolution_status := NEW.status;
    ELSIF NEW.resolution_status IS DISTINCT FROM OLD.resolution_status THEN
      NEW.status := NEW.resolution_status;
    END IF;

    IF NEW.issue_date IS DISTINCT FROM OLD.issue_date THEN
      NEW.reported_date := NEW.issue_date;
    ELSIF NEW.reported_date IS DISTINCT FROM OLD.reported_date THEN
      NEW.issue_date := NEW.reported_date;
    END IF;

    IF NEW.responsible_user IS DISTINCT FROM OLD.responsible_user THEN
      NEW.responsible_person_id := NEW.responsible_user;
    ELSIF NEW.responsible_person_id IS DISTINCT FROM OLD.responsible_person_id THEN
      NEW.responsible_user := NEW.responsible_person_id;
    END IF;

    IF NEW.escalated_at IS DISTINCT FROM OLD.escalated_at THEN
      NEW.escalation_date := NEW.escalated_at;
    ELSIF NEW.escalation_date IS DISTINCT FROM OLD.escalation_date THEN
      NEW.escalated_at := NEW.escalation_date;
    END IF;
  ELSE
    -- INSERT
    IF NEW.status IS NOT NULL AND NEW.resolution_status IS NULL THEN
      NEW.resolution_status := NEW.status;
    ELSIF NEW.resolution_status IS NOT NULL AND NEW.status IS NULL THEN
      NEW.status := NEW.resolution_status;
    ELSIF NEW.resolution_status IS NOT NULL THEN
      NEW.status := NEW.resolution_status;
    END IF;

    IF NEW.issue_date IS NULL AND NEW.reported_date IS NOT NULL THEN
      NEW.issue_date := NEW.reported_date;
    ELSIF NEW.reported_date IS NULL AND NEW.issue_date IS NOT NULL THEN
      NEW.reported_date := NEW.issue_date;
    END IF;

    IF NEW.responsible_user IS NULL AND NEW.responsible_person_id IS NOT NULL THEN
      NEW.responsible_user := NEW.responsible_person_id;
    ELSIF NEW.responsible_person_id IS NULL AND NEW.responsible_user IS NOT NULL THEN
      NEW.responsible_person_id := NEW.responsible_user;
    END IF;

    IF NEW.escalated_at IS NULL AND NEW.escalation_date IS NOT NULL THEN
      NEW.escalated_at := NEW.escalation_date;
    ELSIF NEW.escalation_date IS NULL AND NEW.escalated_at IS NOT NULL THEN
      NEW.escalation_date := NEW.escalated_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_tender_portal_issues_columns ON tender_portal_issues;
CREATE TRIGGER trg_sync_tender_portal_issues_columns
BEFORE INSERT OR UPDATE ON tender_portal_issues
FOR EACH ROW EXECUTE FUNCTION sync_tender_portal_issues_columns();

-- Tender Status History Alignment: note, changed_at (§2)
ALTER TABLE tender_status_history ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE tender_status_history ADD COLUMN IF NOT EXISTS changed_at TIMESTAMPTZ DEFAULT now();

UPDATE tender_status_history SET note = remarks WHERE note IS NULL AND remarks IS NOT NULL;
UPDATE tender_status_history SET remarks = note WHERE remarks IS NULL AND note IS NOT NULL;
UPDATE tender_status_history SET changed_at = created_at WHERE changed_at IS NULL AND created_at IS NOT NULL;

CREATE OR REPLACE FUNCTION sync_tender_status_history_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.note IS NULL AND NEW.remarks IS NOT NULL THEN
    NEW.note := NEW.remarks;
  ELSIF NEW.remarks IS NULL AND NEW.note IS NOT NULL THEN
    NEW.remarks := NEW.note;
  END IF;

  IF NEW.changed_at IS NULL AND NEW.created_at IS NOT NULL THEN
    NEW.changed_at := NEW.created_at;
  ELSIF NEW.created_at IS NULL AND NEW.changed_at IS NOT NULL THEN
    NEW.created_at := NEW.changed_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_tender_status_history_columns ON tender_status_history;
CREATE TRIGGER trg_sync_tender_status_history_columns
BEFORE INSERT OR UPDATE ON tender_status_history
FOR EACH ROW EXECUTE FUNCTION sync_tender_status_history_columns();

