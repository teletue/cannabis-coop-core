-- ============================================================================
-- MIGRATION v2.3 — per-page session counters
-- Run in Supabase SQL Editor
-- All changes are idempotent
-- ============================================================================

-- ── PAGE SESSION COUNTS — anonymous per-page session counters ──────────────
-- One row per public page path. session_count increments each time a new
-- session starts on that page (10-minute inactivity window, see
-- src/components/SessionCounter.tsx). Contains no personal data.
CREATE TABLE IF NOT EXISTS page_session_counts (
    page_path     TEXT PRIMARY KEY,             -- e.g. /shop, /journal/some-slug
    session_count BIGINT NOT NULL DEFAULT 0,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Server-side access only (pg / DATABASE_URL); not exposed via Supabase anon key
