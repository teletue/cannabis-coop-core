-- ============================================================================
-- MIGRATION v1.8 — Row Level Security (RLS) Policies
--
-- IMPORTANT NOTES BEFORE RUNNING:
-- 1. The Next.js app connects via the `pg` driver with DATABASE_URL, which
--    uses the Supabase `postgres` service role and BYPASSES RLS entirely.
--    These policies protect the Supabase REST API / anon key layer only.
-- 2. Supabase's built-in `anon` and `authenticated` roles are used here.
--    There is no Supabase Auth user system yet — admin access is controlled
--    by a simple env-var secret in the Next.js /admin layout (not RLS).
--    When Supabase Auth is added later, replace 'authenticated' policies
--    with a proper admin claim check.
-- 3. RLS is enabled but the app is unaffected (service role bypasses RLS).
--    The only risk is if someone obtains the Supabase anon key and calls
--    the REST API directly — these policies prevent that.
-- ============================================================================

-- ── PUBLIC TABLES ─────────────────────────────────────────────────────────────
-- journal_articles: public can read published articles only
ALTER TABLE journal_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_published_journal" ON journal_articles;
CREATE POLICY "public_read_published_journal"
    ON journal_articles
    FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

-- products: public can read all products (needed for shop frontend)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products"
    ON products
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- country_compliance: public can read (used for geo-filtering)
ALTER TABLE country_compliance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_compliance" ON country_compliance;
CREATE POLICY "public_read_compliance"
    ON country_compliance
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ── ADMIN-ONLY TABLES ─────────────────────────────────────────────────────────
-- draft_articles: no public access
ALTER TABLE draft_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_drafts" ON draft_articles;
CREATE POLICY "admin_all_drafts"
    ON draft_articles
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- raw_content_inbox: no public access
ALTER TABLE raw_content_inbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_inbox" ON raw_content_inbox;
CREATE POLICY "admin_all_inbox"
    ON raw_content_inbox
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ── PRIVATE TABLES ────────────────────────────────────────────────────────────
-- members: absolutely no public access (contains PII)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_members" ON members;
CREATE POLICY "admin_all_members"
    ON members
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- transactions: absolutely no public access (financial data)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_transactions" ON transactions;
CREATE POLICY "admin_all_transactions"
    ON transactions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- payment_gateways: absolutely no public access (infrastructure config)
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_gateways" ON payment_gateways;
CREATE POLICY "admin_all_gateways"
    ON payment_gateways
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- member_shares: no public access
ALTER TABLE member_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_shares" ON member_shares;
CREATE POLICY "admin_all_shares"
    ON member_shares
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- democratic_certificates: no public access
ALTER TABLE democratic_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_certificates" ON democratic_certificates;
CREATE POLICY "admin_all_certificates"
    ON democratic_certificates
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
SELECT 'Migration v1.8 completed — RLS enabled on all tables' AS status;
