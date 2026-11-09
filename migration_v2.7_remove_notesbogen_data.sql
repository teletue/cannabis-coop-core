-- ============================================================================
-- MIGRATION v2.7 — Remove notesbogen tracking data from database
-- Run in Supabase SQL Editor or executed via script
-- ============================================================================

DELETE FROM page_session_counts WHERE page_path = '/notesbogen';
DELETE FROM page_daily_counts WHERE page_path = '/notesbogen';
DELETE FROM conversions WHERE path = '/notesbogen';

SELECT 'Migration v2.7 completed — notesbogen tracking records deleted' AS status;

