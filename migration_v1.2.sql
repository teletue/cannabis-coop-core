-- ==========================================
-- DIGITAL COOPERATIVE PROTOCOL (v1.2)
-- B2C Luxury Wellness & Paid Media Tracking Migration
-- ==========================================

-- 1. PRODUCTS TABLE - Add content negotiation columns
-- Supports pre-written compliant alternative copy for geofenced regions
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS description_standard TEXT,
ADD COLUMN IF NOT EXISTS description_compliant TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL CHECK (price >= 0),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'wellness';

-- 2. TRANSACTIONS TABLE - Add tracking columns for affiliate and paid media metrics
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS gclid VARCHAR(255),
ADD COLUMN IF NOT EXISTS click_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100),
ADD COLUMN IF NOT EXISTS affiliate_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- 3. SEED DATA - Sample luxury wellness products with dual descriptions
INSERT INTO products (shopify_product_id, name, description_standard, description_compliant, thc_percentage, price, supplier_id, image_url, category) VALUES
('prod_nordic_oil_001', 'Nordic Bloom Full-Spectrum Oil', 
 'Premium full-spectrum hemp extract crafted for deep relaxation and restorative sleep. Rich in natural cannabinoids and terpenes for optimal wellness synergy.',
 'Premium botanical hemp extract with naturally occurring plant compounds. Crafted for general wellness and daily balance.',
 0.18, 449.00, (SELECT id FROM members WHERE email = 'supplier@nordicbotanics.dk' LIMIT 1), '/images/nordic-oil.jpg', 'oils'),

('prod_aurora_balm_002', 'Aurora Recovery Balm', 
 'Therapeutic topical formula designed for targeted relief of muscle tension and joint discomfort. Infused with arnica, menthol, and full-spectrum extracts.',
 'Luxurious botanical body balm with arnica and cooling menthol. Perfect for post-activity massage and skin nourishment.',
 0.15, 289.00, (SELECT id FROM members WHERE email = 'supplier@nordicbotanics.dk' LIMIT 1), '/images/aurora-balm.jpg', 'topicals'),

('prod_fjord_gummies_003', 'Fjord Calm Gummies', 
 'Precision-dosed wellness gummies formulated for stress reduction and mental clarity. Each gummy contains 25mg of broad-spectrum CBD with zero THC.',
 'Botanical wellness gummies crafted for moments of calm. Premium plant-based formula with natural fruit extracts.',
 0.00, 199.00, (SELECT id FROM members WHERE email = 'supplier@nordicbotanics.dk' LIMIT 1), '/images/fjord-gummies.jpg', 'edibles'),

('prod_midnight_tea_004', 'Midnight Ritual Tea', 
 'Ceremonial-grade hemp flower tea blend promoting deep sleep and nervous system restoration. Contains CBN-rich strains with chamomile and valerian root.',
 'Artisan herbal tea blend with chamomile, valerian root and hemp botanicals. Perfect for evening unwinding rituals.',
 0.08, 159.00, (SELECT id FROM members WHERE email = 'supplier@nordicbotanics.dk' LIMIT 1), '/images/midnight-tea.jpg', 'teas'),

('prod_nordic_relief_005', 'Nordic Relief Roller', 
 'On-the-go wellness roller for immediate calming effects. Precision blend of essential oils and cannabinoids for anxiety management.',
 'Portable aromatherapy roller with botanical essential oils. Convenient size for travel and daily refreshment.',
 0.12, 129.00, (SELECT id FROM members WHERE email = 'supplier@nordicbotanics.dk' LIMIT 1), '/images/relief-roller.jpg', 'aromatherapy')
ON CONFLICT (shopify_product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description_standard = EXCLUDED.description_standard,
  description_compliant = EXCLUDED.description_compliant,
  thc_percentage = EXCLUDED.thc_percentage,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category;

-- 4. INDEXES for tracking query performance
CREATE INDEX IF NOT EXISTS idx_transactions_gclid ON transactions(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_affiliate_id ON transactions(affiliate_id) WHERE affiliate_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_utm_source ON transactions(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_thc_percentage ON products(thc_percentage);

-- Migration complete
