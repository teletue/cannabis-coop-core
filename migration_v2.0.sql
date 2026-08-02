-- ============================================================================
-- MIGRATION v2.0 — sources table + raw_content_inbox signal foundation
-- Run in Supabase SQL Editor
-- All changes are idempotent
-- ============================================================================

-- ── SOURCES TABLE ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sources (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(255) NOT NULL,
    source_type         VARCHAR(50) NOT NULL DEFAULT 'media'
                        CHECK (source_type IN ('authority','media','shop','association','social','forum','research','internal')),
    channel             VARCHAR(50) NOT NULL DEFAULT 'website'
                        CHECK (channel IN ('website','rss','google_news','instagram','facebook','linkedin','reddit','manual')),
    url                 TEXT,
    social_url          TEXT,
    country             VARCHAR(2),
    language            VARCHAR(10) DEFAULT 'da',
    topic_tags          TEXT[] DEFAULT '{}',
    trust_score         INTEGER CHECK (trust_score BETWEEN 1 AND 5),
    commercial_interest VARCHAR(20) NOT NULL DEFAULT 'none'
                        CHECK (commercial_interest IN ('none','low','medium','high')),
    collection_method   VARCHAR(20) NOT NULL DEFAULT 'manual'
                        CHECK (collection_method IN ('automatic','semi_manual','manual')),
    status              VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','paused','rejected')),
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sources_status  ON sources(status);
CREATE INDEX IF NOT EXISTS idx_sources_type    ON sources(source_type);
CREATE INDEX IF NOT EXISTS idx_sources_channel ON sources(channel);

CREATE OR REPLACE FUNCTION trg_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sources_updated_at ON sources;
CREATE TRIGGER trg_sources_updated_at
    BEFORE UPDATE ON sources
    FOR EACH ROW EXECUTE FUNCTION trg_sources_updated_at();

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_sources" ON sources;
CREATE POLICY "admin_all_sources"
    ON sources FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- ── RAW CONTENT INBOX — signal foundation fields ──────────────────────────────
ALTER TABLE raw_content_inbox
    ADD COLUMN IF NOT EXISTS source_id      UUID REFERENCES sources(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS original_url   TEXT,
    ADD COLUMN IF NOT EXISTS raw_text       TEXT,
    ADD COLUMN IF NOT EXISTS editor_note    TEXT,
    ADD COLUMN IF NOT EXISTS detected_topic TEXT,
    ADD COLUMN IF NOT EXISTS source_name    TEXT;   -- fallback when source_id not set

-- Widen status comment to reflect all valid values
COMMENT ON COLUMN raw_content_inbox.status IS
    'new | pending | scored | below_threshold | promoted | ignored | ready_for_draft | converted | error';

-- Set default status to 'new' for freshly captured signals going forward
-- (existing rows keep their current status)
ALTER TABLE raw_content_inbox ALTER COLUMN status SET DEFAULT 'new';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
SELECT 'Migration v2.0 completed' AS status;
