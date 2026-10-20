-- ============================================================================
-- MIGRATION v2.4 — per-page view counters
-- Run in Supabase SQL Editor
-- All changes are idempotent
-- ============================================================================

-- ── PAGE SESSION COUNTS — add raw page-view counter ────────────────────────
-- view_count increments on EVERY page view (regardless of sessions), whereas
-- session_count only increments at session start. No personal data stored.
ALTER TABLE page_session_counts
    ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;
