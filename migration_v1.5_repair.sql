-- ============================================================================
-- MIGRATION v1.5 REPAIR: Idempotent column sync
-- Kør dette i Supabase SQL Editor (Settings → SQL Editor).
-- Alle ADD COLUMN IF NOT EXISTS er sikre at køre gentagne gange.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. OPRET RAW_CONTENT_INBOX (hvis den ikke eksisterer)
-- ============================================================================
CREATE TABLE IF NOT EXISTS raw_content_inbox (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source     VARCHAR(50) NOT NULL,
    title      TEXT NOT NULL,
    status     VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tilføj ALLE manglende kolonner (idempotent)
ALTER TABLE raw_content_inbox
    ADD COLUMN IF NOT EXISTS source_id       TEXT,
    ADD COLUMN IF NOT EXISTS source_url      TEXT,
    ADD COLUMN IF NOT EXISTS abstract        TEXT,
    ADD COLUMN IF NOT EXISTS published_at    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS authors         TEXT[],
    ADD COLUMN IF NOT EXISTS raw_payload     JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS relevancy_score INTEGER,
    ADD COLUMN IF NOT EXISTS scout_output    JSONB,
    ADD COLUMN IF NOT EXISTS scored_at       TIMESTAMPTZ;

-- ============================================================================
-- 2. INDEXES PÅ RAW_CONTENT_INBOX
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_inbox_status
    ON raw_content_inbox(status);
CREATE INDEX IF NOT EXISTS idx_inbox_source
    ON raw_content_inbox(source);
CREATE INDEX IF NOT EXISTS idx_inbox_relevancy_score
    ON raw_content_inbox(relevancy_score DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_created_at
    ON raw_content_inbox(created_at DESC);

-- Unique index til deduplicering (source + source_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_inbox_source_id_unique
    ON raw_content_inbox(source, source_id)
    WHERE source_id IS NOT NULL;

-- ============================================================================
-- 3. OPRET DRAFT_ARTICLES (hvis den ikke eksisterer)
-- ============================================================================
CREATE TABLE IF NOT EXISTS draft_articles (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title         TEXT NOT NULL,
    review_status VARCHAR(30) NOT NULL DEFAULT 'pending_review',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tilføj ALLE manglende kolonner (idempotent)
ALTER TABLE draft_articles
    ADD COLUMN IF NOT EXISTS inbox_id        UUID REFERENCES raw_content_inbox(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS slug            TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS body            TEXT,
    ADD COLUMN IF NOT EXISTS excerpt         TEXT,
    ADD COLUMN IF NOT EXISTS author          TEXT DEFAULT 'Redaktionen',
    ADD COLUMN IF NOT EXISTS scout_output    JSONB,
    ADD COLUMN IF NOT EXISTS relevancy_score INTEGER,
    ADD COLUMN IF NOT EXISTS citations       JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS hero_image_url  TEXT,
    ADD COLUMN IF NOT EXISTS image_prompt    TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_by     TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rejection_note  TEXT,
    ADD COLUMN IF NOT EXISTS pipeline_stage  VARCHAR(30) DEFAULT 'scout',
    ADD COLUMN IF NOT EXISTS tags            TEXT[] DEFAULT '{}';

-- ============================================================================
-- 4. INDEXES PÅ DRAFT_ARTICLES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_drafts_review_status
    ON draft_articles(review_status);
CREATE INDEX IF NOT EXISTS idx_drafts_pipeline_stage
    ON draft_articles(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_drafts_created_at
    ON draft_articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drafts_relevancy
    ON draft_articles(relevancy_score DESC);

-- ============================================================================
-- 5. AUTO-UPDATE updated_at TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_draft_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_draft_updated_at ON draft_articles;
CREATE TRIGGER trg_draft_updated_at
    BEFORE UPDATE ON draft_articles
    FOR EACH ROW EXECUTE FUNCTION update_draft_updated_at();

-- ============================================================================
-- VERIFICERING: Vis kolonner i begge tabeller
-- ============================================================================
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('raw_content_inbox', 'draft_articles')
ORDER BY table_name, ordinal_position;
