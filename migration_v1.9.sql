-- ============================================================================
-- MIGRATION v1.9 — raw_content_inbox editor support
-- Run in Supabase SQL Editor (Settings → SQL Editor)
-- All changes are idempotent
-- ============================================================================

-- Add editor_notes and updated_at columns
ALTER TABLE raw_content_inbox
    ADD COLUMN IF NOT EXISTS editor_notes TEXT,
    ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT NOW();

-- Auto-update updated_at on every write
CREATE OR REPLACE FUNCTION trg_inbox_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inbox_updated_at ON raw_content_inbox;
CREATE TRIGGER trg_inbox_updated_at
    BEFORE UPDATE ON raw_content_inbox
    FOR EACH ROW EXECUTE FUNCTION trg_inbox_updated_at();

-- Widen status column comment to reflect all valid values
-- 'pending' | 'scored' | 'below_threshold' | 'promoted' | 'ignored' | 'ready_for_draft' | 'error'
COMMENT ON COLUMN raw_content_inbox.status IS
    'pending | scored | below_threshold | promoted | ignored | ready_for_draft | error';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
SELECT 'Migration v1.9 completed' AS status;
