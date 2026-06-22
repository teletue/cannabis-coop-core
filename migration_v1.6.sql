-- ============================================================================
-- MIGRATION v1.6 — Admin Dashboard Support
-- Kør i Supabase SQL Editor (Settings → SQL Editor).
-- Alle ændringer er idempotente.
-- ============================================================================

-- 1. Tilføj affiliate_link kolonne til draft_articles
ALTER TABLE draft_articles
    ADD COLUMN IF NOT EXISTS affiliate_link TEXT,
    ADD COLUMN IF NOT EXISTS published_at   TIMESTAMPTZ;

-- 2. Auto-sæt published_at når review_status sættes til 'published'
CREATE OR REPLACE FUNCTION trg_set_published_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.review_status = 'published' AND OLD.review_status != 'published' THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_draft_published_at ON draft_articles;
CREATE TRIGGER trg_draft_published_at
    BEFORE UPDATE ON draft_articles
    FOR EACH ROW EXECUTE FUNCTION trg_set_published_at();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
