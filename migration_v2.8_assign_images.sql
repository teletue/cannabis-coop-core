-- ============================================================================
-- MIGRATION v2.8 — Assign Hero Images to Products and Journal Articles
-- ============================================================================

-- 1. Products
UPDATE products SET image_url = '/images/products/aura-sleep-drops.jpg' WHERE shopify_product_id = 'prod-sleep-drops';
UPDATE products SET image_url = '/images/products/aura-recovery-balm.jpg' WHERE shopify_product_id = 'prod-recovery-balm';

-- 2. Journal Articles
UPDATE journal_articles SET hero_image_url = '/images/articles/saadan-opbevarer-du-hampeprodukter.jpg' WHERE slug = 'saadan-opbevarer-du-hampeprodukter';
UPDATE journal_articles SET hero_image_url = '/images/articles/hvad-er-decarboxylering.jpg' WHERE slug = 'hvad-er-decarboxylering';
UPDATE journal_articles SET hero_image_url = '/images/articles/start-lavt-gaa-langsomt.jpg' WHERE slug = 'start-lavt-gaa-langsomt';
UPDATE journal_articles SET hero_image_url = '/images/articles/hampens-ordbog.jpg' WHERE slug = 'hampens-ordbog';
UPDATE journal_articles SET hero_image_url = '/images/articles/saadan-bruger-du-en-vaporizer.jpg' WHERE slug = 'saadan-bruger-du-en-vaporizer';
UPDATE journal_articles SET hero_image_url = '/images/articles/roegfri-maader-at-bruge-hamp.jpg' WHERE slug = 'roegfri-maader-at-bruge-hamp';
UPDATE journal_articles SET hero_image_url = '/images/articles/the-regulatory-landscape-for-cannabis-in-the-nordics.jpg' WHERE slug = 'the-regulatory-landscape-for-cannabis-in-the-nordics';
UPDATE journal_articles SET hero_image_url = '/images/articles/ofte-stillede-spoergsmaal-om-cbd-produkter.jpg' WHERE slug = 'ofte-stillede-spoergsmaal-om-cbd-produkter';
UPDATE journal_articles SET hero_image_url = '/images/articles/germany-s-cannabis-legalization-and-eu-pressure-what-s-next-for-2025.jpg' WHERE slug = 'germany-s-cannabis-legalization-and-eu-pressure-what-s-next-for-2025';
UPDATE journal_articles SET hero_image_url = '/images/articles/cbd-novel-food-approval-in-the-eu-the-road-ahead-for-2025.jpg' WHERE slug = 'cbd-novel-food-approval-in-the-eu-the-road-ahead-for-2025';
UPDATE journal_articles SET hero_image_url = 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80' WHERE slug = 'malta-s-cannabis-clubs-a-blueprint-for-europe-by-2025';
UPDATE journal_articles SET hero_image_url = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80' WHERE slug = 'medicinal-cannabis-approvals-in-australian-children-and-young-people-2016-2024-a';
UPDATE journal_articles SET hero_image_url = 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80' WHERE slug = 'safety-and-efficacy-of-cannabinoid-based-interventions-in-parkinson-s-disease-a-';

-- 3. Draft Articles (for consistency)
UPDATE draft_articles SET hero_image_url = '/images/articles/saadan-opbevarer-du-hampeprodukter.jpg' WHERE slug = 'saadan-opbevarer-du-hampeprodukter';
UPDATE draft_articles SET hero_image_url = '/images/articles/hvad-er-decarboxylering.jpg' WHERE slug = 'hvad-er-decarboxylering';
UPDATE draft_articles SET hero_image_url = '/images/articles/start-lavt-gaa-langsomt.jpg' WHERE slug = 'start-lavt-gaa-langsomt';
UPDATE draft_articles SET hero_image_url = '/images/articles/hampens-ordbog.jpg' WHERE slug = 'hampens-ordbog';
UPDATE draft_articles SET hero_image_url = '/images/articles/saadan-bruger-du-en-vaporizer.jpg' WHERE slug = 'saadan-bruger-du-en-vaporizer';
UPDATE draft_articles SET hero_image_url = '/images/articles/roegfri-maader-at-bruge-hamp.jpg' WHERE slug = 'roegfri-maader-at-bruge-hamp';

SELECT 'Migration v2.8 completed — all products and articles assigned hero images' AS status;

