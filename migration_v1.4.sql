-- ============================================================================
-- MIGRATION v1.4: Server-Side Attribution Engine
-- Description: Creates conversions table and indexes for analytics tracking
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CONVERSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Attribution IDs
    ref_id VARCHAR(255),                    -- First-party attribution ID (from cookie)
    session_id VARCHAR(255),                -- Session identifier
    
    -- Event Details
    event_type VARCHAR(50) NOT NULL,        -- 'page_view', 'product_click', 'checkout_init', 'purchase', 'clicked_out'
    path TEXT,                              -- Page path where event occurred
    
    -- Product/Content Context
    product_id VARCHAR(255),                -- Product ID if applicable
    content_id VARCHAR(255),              -- Content/Article ID if applicable
    
    -- Revenue Data (for purchase events)
    revenue NUMERIC(10, 2),                 -- Purchase amount
    currency VARCHAR(3) DEFAULT 'DKK',    -- Currency code
    
    -- Metadata
    country_code VARCHAR(2),                -- User country (from geofencing)
    user_agent TEXT,                        -- Browser user agent
    referrer TEXT,                          -- Referrer URL
    
    -- Raw UTM Parameters (for analysis)
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_content VARCHAR(255),
    utm_term VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Additional metadata (JSON for flexibility)
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- 2. INDEXES FOR ANALYTICS QUERIES
-- ============================================================================

-- Index for attribution lookup
CREATE INDEX IF NOT EXISTS idx_conversions_ref_id ON conversions(ref_id);

-- Index for session-based queries
CREATE INDEX IF NOT EXISTS idx_conversions_session_id ON conversions(session_id);

-- Index for time-series queries (common for analytics)
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at);

-- Index for event type filtering
CREATE INDEX IF NOT EXISTS idx_conversions_event_type ON conversions(event_type);

-- Composite index for attribution + time (conversion funnel analysis)
CREATE INDEX IF NOT EXISTS idx_conversions_ref_event_time 
    ON conversions(ref_id, event_type, created_at);

-- Index for product performance tracking
CREATE INDEX IF NOT EXISTS idx_conversions_product_id ON conversions(product_id);

-- Index for country-based compliance reporting
CREATE INDEX IF NOT EXISTS idx_conversions_country_code ON conversions(country_code);

-- Index for UTM campaign analysis
CREATE INDEX IF NOT EXISTS idx_conversions_utm_campaign ON conversions(utm_campaign);

-- ============================================================================
-- 3. CONVENIENCE FUNCTIONS
-- ============================================================================

-- Function to get conversion stats by ref_id
CREATE OR REPLACE FUNCTION get_attribution_stats(p_ref_id VARCHAR)
RETURNS TABLE (
    total_events BIGINT,
    unique_sessions BIGINT,
    page_views BIGINT,
    product_clicks BIGINT,
    purchases BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_events,
        COUNT(DISTINCT session_id)::BIGINT as unique_sessions,
        COUNT(*) FILTER (WHERE event_type = 'page_view')::BIGINT as page_views,
        COUNT(*) FILTER (WHERE event_type = 'product_click')::BIGINT as product_clicks,
        COUNT(*) FILTER (WHERE event_type = 'purchase')::BIGINT as purchases,
        COALESCE(SUM(revenue) FILTER (WHERE event_type = 'purchase'), 0)::NUMERIC as total_revenue
    FROM conversions
    WHERE ref_id = p_ref_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. COMMENTS
-- ============================================================================

COMMENT ON TABLE conversions IS 'Stores all attribution events for server-side analytics tracking';
COMMENT ON COLUMN conversions.ref_id IS 'First-party attribution ID stored in weeds_ref_id cookie';
COMMENT ON COLUMN conversions.event_type IS 'Type of conversion event (page_view, product_click, checkout_init, purchase, clicked_out)';
COMMENT ON COLUMN conversions.metadata IS 'Flexible JSONB field for additional event-specific data';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
SELECT 'Migration v1.4 completed successfully' as status;
