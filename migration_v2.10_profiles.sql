-- ============================================================================
-- MIGRATION v2.10 — Blå Bog (Person- & Virksomhedsoversigt) + Media Linking
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    slug          VARCHAR(255) UNIQUE NOT NULL,
    entity_type   VARCHAR(50) NOT NULL DEFAULT 'person', -- 'person' | 'company'
    role_or_title VARCHAR(255),
    bio           TEXT,
    image_url     TEXT,
    website_url   TEXT,
    social_links  JSONB DEFAULT '{}'::jsonb,
    tags          TEXT[] DEFAULT '{}',
    is_featured   BOOLEAN DEFAULT false,
    status        VARCHAR(30) NOT NULL DEFAULT 'published', -- 'published' | 'hidden'
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_entity_type ON profiles(entity_type);

-- Link media_items to profiles
ALTER TABLE media_items
    ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_media_items_profile_id ON media_items(profile_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_profiles" ON profiles;
CREATE POLICY "public_read_published_profiles"
    ON profiles
    FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

-- Seed initial profile: Peter Øvig Knudsen
INSERT INTO profiles (name, slug, entity_type, role_or_title, bio, image_url, website_url, tags, is_featured, status)
VALUES (
    'Peter Øvig Knudsen',
    'peter-oevig-knudsen',
    'person',
    'Forfatter, Journalist & Debattør',
    'Dansk journalist og forfatter til en lang række toneangivende bøger om nyere dansk historie og modkultur, herunder Blekingegadebanden, Hippie-bøgerne og »Øvigs lille bog om pot« (2025). Markant stemme i den danske debat om afkriminalisering og personlig frihed.',
    '/images/articles/peterovigknudsen.jpg',
    'https://www.gyldendal.dk/forfattere/peter-ovig-knudsen',
    ARRAY['forfatter', 'debat', 'danmark'],
    true,
    'published'
)
ON CONFLICT (slug) DO NOTHING;

SELECT 'Migration v2.10 completed — profiles table created' AS status;

