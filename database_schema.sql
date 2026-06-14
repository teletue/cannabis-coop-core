-- ==========================================
-- DIGITAL COOPERATIVE PROTOCOL (v1.0)
-- PostgreSQL Database Schema
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MEMBERS TABLE (Medlemsregister)
-- Manages cooperative membership and partner levels.
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    partner_level VARCHAR(50) NOT NULL DEFAULT 'medlem'
        CHECK (partner_level IN ('medlem', 'andelshaver', 'premium_partner')),
    is_democratically_verified BOOLEAN DEFAULT FALSE NOT NULL,
    has_employee_ownership BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Democratic Circuit Breaker: Premium partner status requires democratic verification
    CONSTRAINT chk_premium_requires_verification 
        CHECK (partner_level != 'premium_partner' OR is_democratically_verified = TRUE)
);

-- 2. DEMOCRATIC CERTIFICATES TABLE (Demokratisk Certifikat)
-- Stores governance proof and audits of supplier democratic structures.
CREATE TABLE democratic_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    employee_ownership_percentage NUMERIC(5, 2) NOT NULL CHECK (employee_ownership_percentage >= 0 AND employee_ownership_percentage <= 100),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL
        CHECK (status IN ('pending', 'approved', 'rejected')),
    verifier_id UUID REFERENCES members(id) ON DELETE SET NULL,
    notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. MEMBER SHARES TABLE (Andelshaver Ledger)
-- Tracks cooperative share points with annual progressive limits (Anti-Whale).
CREATE TABLE member_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year >= 2000),
    points_raw NUMERIC(15, 2) DEFAULT 0.00 NOT NULL CHECK (points_raw >= 0),
    points_scaled NUMERIC(15, 2) DEFAULT 0.00 NOT NULL CHECK (points_scaled >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Ensure a member has exactly one record per year
    CONSTRAINT unique_member_year UNIQUE (member_id, year)
);

-- 4. TRANSACTIONS TABLE (Transaktionshistorik)
-- Ledger of member orders (Shopify head checkout webhook sync).
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    shopify_order_id VARCHAR(255) UNIQUE, -- Unique constraint prevents double webhook ingestions
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    points_generated NUMERIC(15, 2) NOT NULL CHECK (points_generated >= 0),
    status VARCHAR(50) DEFAULT 'completed' NOT NULL
        CHECK (status IN ('completed', 'pending', 'refunded', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. COUNTRY COMPLIANCE TABLE (Vogteren Landespecifikke Regler)
-- Holds geofencing boundaries, THC thresholds, and advertisement laws in the EU.
CREATE TABLE country_compliance (
    country_code VARCHAR(2) PRIMARY KEY CHECK (length(country_code) = 2),
    country_name VARCHAR(100) NOT NULL,
    country_allowed BOOLEAN DEFAULT TRUE NOT NULL,
    thc_threshold NUMERIC(4, 2) DEFAULT 0.30 NOT NULL CHECK (thc_threshold >= 0 AND thc_threshold <= 100),
    medical_claims_forbidden BOOLEAN DEFAULT TRUE NOT NULL,
    requires_club_membership BOOLEAN DEFAULT FALSE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. PAYMENT GATEWAYS TABLE (Drivkraften Smart Payment Router)
-- Decoupled payment endpoints to rotate when processors freeze funds.
CREATE TABLE payment_gateways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL
        CHECK (status IN ('active', 'inactive', 'frozen')),
    priority INTEGER DEFAULT 1 NOT NULL CHECK (priority >= 0),
    api_key_vault_ref VARCHAR(255) NOT NULL, -- Reference to secret vault, never store raw keys here
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. PRODUCTS TABLE
-- Catalog items with compliance limits and supplier tracking.
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shopify_product_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    thc_percentage NUMERIC(4, 2) DEFAULT 0.00 NOT NULL CHECK (thc_percentage >= 0 AND thc_percentage <= 100),
    supplier_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- ==========================================
-- TRIGGERS AND PROCEDURAL LOGIC
-- ==========================================

-- A. Anti-Whale Progressive Points Cap Calculator
-- Diminishing return function for member cooperative shares.
CREATE OR REPLACE FUNCTION calculate_progressive_shares(points NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    scaled_points NUMERIC := 0;
BEGIN
    -- Tier 1: Up to 1,000 points are converted 1:1
    IF points <= 1000 THEN
        scaled_points := points;
    -- Tier 2: 1,000 to 5,000 points get 50% weight
    ELSIF points <= 5000 THEN
        scaled_points := 1000 + (points - 1000) * 0.50;
    -- Tier 3: Above 5,000 points get 10% weight, hard capped at 10,000 total scaled shares
    ELSE
        scaled_points := 1000 + (4000 * 0.50) + (points - 5000) * 0.10;
        IF scaled_points > 10000 THEN
            scaled_points := 10000;
        END IF;
    END IF;
    RETURN scaled_points;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to calculate progressive shares on insertion/modification of points_raw
CREATE OR REPLACE FUNCTION trg_enforce_anti_whale_cap()
RETURNS TRIGGER AS $$
BEGIN
    NEW.points_scaled := calculate_progressive_shares(NEW.points_raw);
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_shares
BEFORE INSERT OR UPDATE ON member_shares
FOR EACH ROW
EXECUTE FUNCTION trg_enforce_anti_whale_cap();


-- B. Transaction Points Sync Trigger
-- Syncs completion and refunds of checkout items with the member_shares ledger.
CREATE OR REPLACE FUNCTION trg_sync_transaction_points()
RETURNS TRIGGER AS $$
DECLARE
    tx_year INTEGER;
    points_delta NUMERIC := 0;
BEGIN
    -- Determine points delta based on operation type and status
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'completed' THEN
            points_delta := NEW.points_generated;
            tx_year := EXTRACT(YEAR FROM NEW.created_at);
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        tx_year := EXTRACT(YEAR FROM NEW.created_at);
        IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
            points_delta := NEW.points_generated;
        ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
            points_delta := -OLD.points_generated;
        ELSIF OLD.status = 'completed' AND NEW.status = 'completed' THEN
            points_delta := NEW.points_generated - OLD.points_generated;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'completed' THEN
            points_delta := -OLD.points_generated;
            tx_year := EXTRACT(YEAR FROM OLD.created_at);
        END IF;
    END IF;

    -- Update member shares ledger if points changed
    IF points_delta != 0 THEN
        INSERT INTO member_shares (member_id, year, points_raw)
        VALUES (COALESCE(NEW.member_id, OLD.member_id), tx_year, GREATEST(0, points_delta))
        ON CONFLICT (member_id, year)
        DO UPDATE SET points_raw = GREATEST(0, member_shares.points_raw + points_delta);
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_transaction_points
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION trg_sync_transaction_points();


-- C. Democratic Certificate Auto-Sync Trigger
-- Auto-promotes and demotes partner levels based on verification audits.
CREATE OR REPLACE FUNCTION trg_sync_democratic_certificate()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.status = 'approved' THEN
            UPDATE members
            SET is_democratically_verified = TRUE,
                has_employee_ownership = TRUE
            WHERE id = NEW.member_id;
        ELSE
            UPDATE members
            SET is_democratically_verified = FALSE,
                has_employee_ownership = FALSE,
                partner_level = CASE 
                    WHEN partner_level = 'premium_partner' THEN 'andelshaver' 
                    ELSE partner_level 
                END
            WHERE id = NEW.member_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE members
        SET is_democratically_verified = FALSE,
            has_employee_ownership = FALSE,
            partner_level = CASE 
                WHEN partner_level = 'premium_partner' THEN 'andelshaver' 
                ELSE partner_level 
            END
        WHERE id = OLD.member_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_democratic_certificate
AFTER INSERT OR UPDATE OR DELETE ON democratic_certificates
FOR EACH ROW
EXECUTE FUNCTION trg_sync_democratic_certificate();


-- D. Country Compliance Seed Data (Initial EU Country setup)
INSERT INTO country_compliance (country_code, country_name, country_allowed, thc_threshold, medical_claims_forbidden, requires_club_membership) VALUES
('DE', 'Germany', TRUE, 0.30, TRUE, TRUE), -- Club-based pillar 1 rules
('PT', 'Portugal', TRUE, 0.30, TRUE, FALSE), -- Decriminalized, standard sales
('DK', 'Denmark', TRUE, 0.30, TRUE, FALSE), -- Strict claims and CBD limits
('NL', 'Netherlands', TRUE, 0.30, TRUE, FALSE), -- Tolerance policy
('ES', 'Spain', TRUE, 0.30, TRUE, TRUE), -- Social club structures
('FR', 'France', FALSE, 0.00, TRUE, FALSE) -- Forbidden/Highly restricted
ON CONFLICT (country_code) DO NOTHING;
