-- ============================================================================
-- MIGRATION v2.1 — feltnoter table (editorial commentary)
-- Run in Supabase SQL Editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS feltnoter (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug             VARCHAR(255) UNIQUE NOT NULL,
    title            VARCHAR(255) NOT NULL,
    body             TEXT NOT NULL,
    excerpt          TEXT,
    mood             VARCHAR(30) NOT NULL DEFAULT 'note'
                     CHECK (mood IN ('observation','essay','critique','rant','note')),
    status           VARCHAR(30) NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','review','published','archived')),
    author           VARCHAR(100) NOT NULL DEFAULT 'Redaktionen',
    published_at     TIMESTAMPTZ,
    seo_title        TEXT,
    meta_description TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feltnoter_status ON feltnoter(status);
CREATE INDEX IF NOT EXISTS idx_feltnoter_mood   ON feltnoter(mood);

CREATE OR REPLACE FUNCTION trg_feltnoter_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feltnoter_updated_at ON feltnoter;
CREATE TRIGGER trg_feltnoter_updated_at
    BEFORE UPDATE ON feltnoter
    FOR EACH ROW EXECUTE FUNCTION trg_feltnoter_updated_at();

ALTER TABLE feltnoter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_feltnoter" ON feltnoter;
CREATE POLICY "admin_all_feltnoter"
    ON feltnoter FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
SELECT 'Migration v2.1 completed' AS status;
