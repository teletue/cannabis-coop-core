-- ============================================================================
-- MIGRATION v1.7 — journal_articles CMS fields
-- Run in Supabase SQL Editor (Settings → SQL Editor)
-- All changes are idempotent (ADD COLUMN IF NOT EXISTS)
-- ============================================================================

ALTER TABLE journal_articles
    ADD COLUMN IF NOT EXISTS status              VARCHAR(30) NOT NULL DEFAULT 'published',
    ADD COLUMN IF NOT EXISTS excerpt             TEXT,
    ADD COLUMN IF NOT EXISTS category            VARCHAR(100),
    ADD COLUMN IF NOT EXISTS image_alt           TEXT,
    ADD COLUMN IF NOT EXISTS seo_title           TEXT,
    ADD COLUMN IF NOT EXISTS meta_description    TEXT,
    ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ DEFAULT NOW();

-- Auto-update updated_at on every write
CREATE OR REPLACE FUNCTION trg_journal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_updated_at ON journal_articles;
CREATE TRIGGER trg_journal_updated_at
    BEFORE UPDATE ON journal_articles
    FOR EACH ROW EXECUTE FUNCTION trg_journal_updated_at();

-- Index for public query: only fetch published articles fast
CREATE INDEX IF NOT EXISTS idx_journal_status ON journal_articles(status);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
SELECT 'Migration v1.7 completed' AS status;
