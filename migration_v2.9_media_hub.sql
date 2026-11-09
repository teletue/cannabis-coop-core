-- ============================================================================
-- MIGRATION v2.9 — Media Hub (Curated External Content)
-- ============================================================================

CREATE TABLE IF NOT EXISTS media_items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url           TEXT NOT NULL,
    platform      VARCHAR(50) NOT NULL, -- 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'twitter' | 'web'
    media_type    VARCHAR(50) NOT NULL DEFAULT 'video', -- 'video' | 'post' | 'article'
    title         TEXT,
    description   TEXT,
    thumbnail_url TEXT,
    embed_id      TEXT,
    embed_url     TEXT,
    author_name   TEXT,
    curator_note  TEXT,
    status        VARCHAR(30) NOT NULL DEFAULT 'published', -- 'published' | 'hidden'
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_items_status ON media_items(status);
CREATE INDEX IF NOT EXISTS idx_media_items_created_at ON media_items(created_at DESC);

-- Enable RLS
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

-- Allow public read of published media items
DROP POLICY IF EXISTS "public_read_published_media" ON media_items;
CREATE POLICY "public_read_published_media"
    ON media_items
    FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

SELECT 'Migration v2.9 completed — media_items table created' AS status;

