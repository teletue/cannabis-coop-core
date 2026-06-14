-- ==========================================
-- DIGITAL COOPERATIVE PROTOCOL (v1.3)
-- Symbiotic Magazine & B2C Shop Migration
-- ==========================================

-- 1. JOURNAL ARTICLES TABLE ( weeds.dk content )
CREATE TABLE IF NOT EXISTS journal_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    author VARCHAR(100) NOT NULL,
    hero_image_url TEXT NOT NULL,
    tags VARCHAR(50)[] DEFAULT '{}',
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. UPDATE PRODUCTS TABLE - Add tag-based context matching
-- (description_standard and description_compliant already added in v1.2)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS tags VARCHAR(50)[] DEFAULT '{}';

-- Update existing products with tags for context matching
UPDATE products SET tags = ARRAY['sleep', 'oil'] WHERE shopify_product_id = 'prod_nordic_oil_001';
UPDATE products SET tags = ARRAY['relief', 'balm', 'skincare'] WHERE shopify_product_id = 'prod_aurora_balm_002';
UPDATE products SET tags = ARRAY['calm', 'gummies', 'edibles'] WHERE shopify_product_id = 'prod_fjord_gummies_003';
UPDATE products SET tags = ARRAY['sleep', 'tea', 'evening'] WHERE shopify_product_id = 'prod_midnight_tea_004';
UPDATE products SET tags = ARRAY['relief', 'roller', 'aromatherapy'] WHERE shopify_product_id = 'prod_nordic_relief_005';

-- 3. SEED JOURNAL ARTICLES with relevant tags for context-aware footers
INSERT INTO journal_articles (slug, title, body, author, hero_image_url, tags, published_at) VALUES
('scandinavian-hemp-science', 
 'The Science of Scandinavian Hemp Cultivation',
 E'For centuries, Nordic farmers have cultivated hemp in the long summer days of the Scandinavian peninsula. The unique photoperiod—where the sun barely sets during growing season—creates a plant profile distinct from southern European varieties.\n\nThe primary compound of interest in modern wellness circles is CBD (cannabidiol), a non-psychoactive cannabinoid that has gained attention for its potential wellness applications. However, regulatory frameworks across the EU strictly govern how these compounds can be discussed.\n\nIn Denmark, the THC threshold stands at 0.3%, one of the more permissive standards in the European Union. This allows for full-spectrum extracts that retain the plant''s complete terpene profile—aromatic compounds that contribute to what researchers call the "entourage effect."\n\nThe Danish climate, with its cool nights and consistent rainfall, actually mimics the stress conditions that hemp plants evolved to thrive in. This environmental pressure may contribute to higher concentrations of certain beneficial compounds compared to plants grown in controlled indoor environments.\n\nAs we continue to understand this ancient plant through modern scientific methodology, the importance of sustainable cultivation practices becomes increasingly clear. The cooperative model ensures that small-scale farmers can compete while maintaining the artisanal quality that distinguishes Nordic botanicals.',
 'Dr. Ingrid Madsen',
 '/images/hemp-field-nordic.jpg',
 ARRAY['hemp', 'science', 'cultivation'],
 '2024-01-15 10:00:00+01'
),

('sleep-wellness-guide',
 'A Natural Approach to Evening Rituals',
 E'The modern sleep crisis affects nearly every demographic in Nordic countries. With winter darkness lasting up to 18 hours and summer light disrupting circadian rhythms, Scandinavians have developed sophisticated approaches to sleep hygiene.\n\nBotanical wellness has emerged as a complementary approach to traditional sleep hygiene. Full-spectrum hemp extracts, particularly those rich in CBN (cannabinol), have become part of evening rituals for those seeking natural alternatives.\n\nThe key lies in consistency. Unlike pharmaceutical interventions, botanical approaches require patience and routine. Users often report benefits after 2-3 weeks of regular use, with peak effects manifesting around the 30-day mark.\n\nQuality control remains paramount. Third-party testing for potency and contaminants should be non-negotiable. The cooperative model ensures traceability from seed to shelf—a transparency that conventional supply chains struggle to match.\n\nFor those struggling with sleep onset, consider combining botanical approaches with environmental modifications: cooler bedroom temperatures, blue light filtering after sunset, and the consistent use of sleep-supporting essential oils.',
 'Maria Holst',
 '/images/sleep-ritual-nordic.jpg',
 ARRAY['sleep', 'wellness', 'evening'],
 '2024-02-03 14:30:00+01'
),

('topical-applications-cbd',
 'Beyond Ingestion: The Rise of Topical Applications',
 E'Skincare and wellness have converged in unexpected ways. The endocannabinoid system, once understood only in terms of internal receptors, is now recognized to exist within the skin itself.\n\nTopical formulations offer localized application without systemic absorption—a key consideration for those who prefer external use. The skin''s cannabinoid receptors respond to both CBD and other plant compounds, potentially supporting skin health and comfort.\n\nThe Nordic approach to topical formulations emphasizes simplicity. Rather than complex chemical profiles, Danish laboratories focus on carrier oils that enhance absorption and complementary botanicals like arnica and menthol.\n\nQuality indicators for topical products include:\n- Clear labeling of CBD content in milligrams\n- Certificates of analysis verifying THC below 0.3%\n- Transparent sourcing information\n- Minimal preservative profiles\n\nAs regulatory frameworks evolve, the distinction between cosmetic and wellness claims becomes increasingly important. The cooperative maintains strict compliance protocols, ensuring all product descriptions meet country-specific requirements.',
 'Erik Lindqvist',
 '/images/skincare-cbd-nordic.jpg',
 ARRAY['skincare', 'topicals', 'relief'],
 '2024-02-20 09:15:00+01'
),

('democratic-cooperatives-future',
 'Why Democratic Cooperatives Represent the Future of Wellness',
 E'The wellness industry has a transparency problem. Supply chains stretch across continents, obscuring origins and practices. The cooperative model offers an alternative: democratic governance, local sourcing, and shared ownership.\n\nIn a cooperative structure, members own the business collectively. Profits distribute according to participation rather than capital investment. This creates alignment between producer and consumer that conventional corporations struggle to replicate.\n\nThe digital cooperative extends this model into e-commerce. Every purchase generates not just revenue, but cooperative share points. Members accumulate stake in the organization they support, creating long-term alignment of interests.\n\nTransparency mechanisms include:\n- Public democratic certificates for all suppliers\n- Quarterly governance reports\n- Member voting on strategic decisions\n- Open-book financial accounting\n\nAs consumers become increasingly conscious of production ethics, the cooperative model offers a structural solution to the greenwashing that plagues the wellness sector. The future of ethical commerce may well be cooperative.',
 'Sofia Andersson',
 '/images/cooperative-democracy.jpg',
 ARRAY['cooperative', 'governance', 'future'],
 '2024-03-08 11:00:00+01'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  author = EXCLUDED.author,
  hero_image_url = EXCLUDED.hero_image_url,
  tags = EXCLUDED.tags,
  updated_at = CURRENT_TIMESTAMP;

-- 4. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_journal_articles_slug ON journal_articles(slug);
CREATE INDEX IF NOT EXISTS idx_journal_articles_published ON journal_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_articles_tags ON journal_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);

-- Migration complete
