-- ============================================================================
-- MIGRATION v2.5 — daily per-page counters
-- Run in Supabase SQL Editor
-- All changes are idempotent
-- ============================================================================

-- ── PAGE DAILY COUNTS — date × page breakdown ──────────────────────────────
-- One row per (UTC day, page path). Incremented alongside the running totals
-- in page_session_counts. Contains no personal data.
CREATE TABLE IF NOT EXISTS page_daily_counts (
    day           DATE NOT NULL,
    page_path     TEXT NOT NULL,
    session_count BIGINT NOT NULL DEFAULT 0,
    view_count    BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (day, page_path)
);

CREATE INDEX IF NOT EXISTS idx_page_daily_counts_day ON page_daily_counts(day DESC);
