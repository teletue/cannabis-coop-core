-- =========================================================
-- DATABASE MIGRATION & SEED DATA (v1.3 - weeds.dk)
-- =========================================================

-- 1. EXTEND PRODUCTS TABLE WITH ATTRIBUTE COLUMNS
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS description_standard TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_compliant TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tags VARCHAR(50)[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 0.00;

-- 2. EXTEND TRANSACTIONS TABLE WITH ATTRIBUTION COLUMNS
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS gclid VARCHAR(255),
  ADD COLUMN IF NOT EXISTS click_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255),
  ADD COLUMN IF NOT EXISTS affiliate_id VARCHAR(255);

-- 3. CREATE JOURNAL ARTICLES TABLE
CREATE TABLE IF NOT EXISTS journal_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    author VARCHAR(100) NOT NULL,
    hero_image_url TEXT NOT NULL,
    tags VARCHAR(50)[] DEFAULT '{}',
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================
-- SEED DATA (REDAKTØREN & DB SEED)
-- =========================================================

-- A. Insert Mock Suppliers/Members (to satisfy foreign key constraints)
INSERT INTO members (id, email, partner_level, is_democratically_verified, has_employee_ownership)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'supplies@aura-botanicals.se', 'premium_partner', TRUE, TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'restitution-lab@nordic-extracts.no', 'andelshaver', FALSE, FALSE)
ON CONFLICT (email) DO UPDATE SET partner_level = EXCLUDED.partner_level;

-- B. Insert B2C Luxury Products
INSERT INTO products (shopify_product_id, name, thc_percentage, supplier_id, price, tags, description_standard, description_compliant)
VALUES
  (
    'prod-sleep-drops',
    'Aura Sleep Drops (10% CBD)',
    0.00,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    649.00,
    ARRAY['sleep', 'botanical'],
    -- Standard: Explains scientific and health benefits directly (Allowed in countries with soft/no medical claim bans)
    'Premium tinktur baseret på økologisk koldpresset hamp. Formuleret specifikt til at reducere søvnløshed og lindre kronisk smerte ved at regulere centralnervesystemets CB1-receptorer. Indeholder myrcen og linalool for en beroligende, fysiologisk effekt.',
    -- Compliant: Clinical, clean wellness language with zero medical claims (Served in strict countries like Denmark)
    'Nordisk hampetinktur udvundet af nøje udvalgte botaniske sorter. Formuleret med henblik på at komplementere aftenens beroligende rutiner og understøtte kroppens naturlige balance. Rig på naturlige fytokemikalier uden uautoriserede anprisninger.'
  ),
  (
    'prod-recovery-balm',
    'Aura Recovery Balm',
    0.05,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    420.00,
    ARRAY['recovery', 'topical'],
    -- Standard
    'Målrettet muskelbalsam med høj biotilgængelighed. Formuleret med aktive terpener til at dæmpe inflammation og lindre ledsmerter efter fysisk traume eller hård træning. Interagerer perifert med CB2-receptorer for hurtig lindring.',
    -- Compliant
    'Dybdevirkende salve til lokal hudpleje og massage efter fysisk aktivitet. Med en kølende og lindrende struktur, der genopretter velvære i overbelastede områder. Formuleret uden anprisninger eller fysiologiske helbredsløfter.'
  )
ON CONFLICT (shopify_product_id) DO UPDATE SET
  price = EXCLUDED.price,
  tags = EXCLUDED.tags,
  description_standard = EXCLUDED.description_standard,
  description_compliant = EXCLUDED.description_compliant;

-- C. Insert Immersive Journal Articles (Markdown formatted)
INSERT INTO journal_articles (slug, title, body, author, hero_image_url, tags)
VALUES
  (
    'soevnens-fysiologiske-arkitektur',
    'Søvnens Fysiologiske Arkitektur: Homøostase og Receptorer',
    '# Søvnens Fysiologiske Arkitektur: Homøostase og Receptorer

Søvn er ikke en passiv tilstand, men en aktiv neurologisk genopbygningsproces. For at forstå, hvordan eksterne fytokemiske forbindelser interagerer med søvnmønstre, må vi først betragte kroppens indre reguleringsmekanismer.

## Homøostatisk regulering
Kroppen styrer søvnbehovet gennem to primære systemer: den cirkadiske rytme (døgnrytmen) og den homøostatiske søvnophobning (opbygningen af adenosin i hjernen). Når balancen forstyrres af eksterne faktorer såsom stress eller neurologisk hyperaktivitet, kompromitteres søvnens dybere faser (NREM-fase 3 og 4), hvilket hæmmer den cellulære restitution.

## Receptorer og det endocannabinoide system
Det endocannabinoide system (ECS) fungerer som en afgørende regulator for kroppens homøostase. Gennem receptorer i centralnervesystemet, navnlig CB1-receptorer i hypothalamus, påvirkes frigivelsen af neurotransmittere som GABA og glutamat. 

Videnskabelige undersøgelser antyder, at botaniske ekstrakter kan interagere med disse processer uden at skabe den afhængighed eller de forstyrrelser af REM-søvnen, som ofte forbindes med syntetiske præparater. Ved at stabilisere receptorsystemet skabes et optimalt fysiologisk fundament for uforstyrret natlig hvile.',
    'Dr. Elena Rostova',
    'https://images.unsplash.com/photo-1511295742364-92767fa62d9f?auto=format&fit=crop&w=1200&q=80',
    ARRAY['sleep']
  ),
  (
    'fytokemisk-restitution-og-vaevspleje',
    'Fytokemisk restitution: Lokal genopbygning af muskelvæv',
    '# Fytokemisk restitution: Lokal genopbygning af muskelvæv

Efter intens fysiologisk belastning igangsætter kroppen en kaskade af inflammatoriske responser for at reparere mikroskopiske skader i muskel- og ledvæv. Den topiske anvendelse af plantebaserede fytokemikalier tilbyder en målrettet tilgang til lokal genopretning.

## Den fysiologiske reparationsfase
Når muskelceller udsættes for overbelastning, frigives cytokiner, hvilket medfører øget sensitivitet og lokal hævelse. Traditionel systemisk behandling påvirker hele organismen, hvorimod lokal (topisk) applikation virker direkte på det berørte område.

## CB2-receptorer i periferien
I modsætning til CB1-receptorerne i hjernen, findes CB2-receptorerne primært i det perifere nervesystem og immuncellerne i hudlagene. Fytokemikalier påført direkte på huden trænger igennem epidermis og interagerer med disse receptorer. 

Kombinationen af renset planteekstrakt med naturlige termiske agenter (såsom mentol eller kamfer) understøtter den lokale mikrocirculation og fremskynder fjernelsen af metaboliske affaldsstoffer, hvilket forkorter den fysiologiske restitutionstid markant.',
    'Prof. Marcus Thorne',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    ARRAY['recovery']
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  author = EXCLUDED.author,
  hero_image_url = EXCLUDED.hero_image_url,
  tags = EXCLUDED.tags;
