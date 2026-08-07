-- ============================================================================
-- MIGRATION v2.2 — article_images metadata + draft image_alt
-- Run in Supabase SQL Editor
-- All changes are idempotent
-- ============================================================================

-- ── ARTICLE IMAGES — metadata registry ──────────────────────────────────────
-- One row per uploaded (or later: auto-generated) image in the
-- 'article-images' Supabase Storage bucket.
CREATE TABLE IF NOT EXISTS article_images (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    storage_path      TEXT NOT NULL UNIQUE,     -- e.g. articles/1723020000-hero.jpg
    public_url        TEXT NOT NULL,            -- full public CDN URL
    original_filename TEXT,
    alt_text          TEXT,
    mime_type         VARCHAR(50),
    size_bytes        INTEGER,

    source            VARCHAR(20) NOT NULL DEFAULT 'manual'
                      CHECK (source IN ('manual', 'automated')),

    uploaded_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_article_images_source      ON article_images(source);
CREATE INDEX IF NOT EXISTS idx_article_images_uploaded_at ON article_images(uploaded_at DESC);

-- Admin-only access (matching other CMS tables)
ALTER TABLE article_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_article_images" ON article_images;
CREATE POLICY "admin_all_article_images"
    ON article_images FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- ── DRAFT ARTICLES — image alt text ─────────────────────────────────────────
-- Carried to journal_articles.image_alt on publish
ALTER TABLE draft_articles
    ADD COLUMN IF NOT EXISTS image_alt TEXT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
SELECT 'Migration v2.2 completed' AS status;
