-- Hermes Dropshipping Factory Database Schema
-- Supabase PostgreSQL initialization script
-- Run this in the Supabase SQL Editor

-- ============================================================================
-- TABLE: trending_products
-- Purpose: Store products discovered by the Researcher agent
-- ============================================================================
CREATE TABLE IF NOT EXISTS trending_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(255) NOT NULL,
  estimated_cost DECIMAL(10, 2) NOT NULL,
  target_retail DECIMAL(10, 2) NOT NULL,
  margin_percentage DECIMAL(5, 1) NOT NULL,
  supplier_source VARCHAR(255) NOT NULL,
  ad_hook_idea TEXT,
  weight_lbs DECIMAL(5, 2),
  viral_score DECIMAL(3, 1),
  status VARCHAR(50) DEFAULT 'discovered',
  -- Status: discovered, validating, validated, rejected, campaigning, live, archived
  discovered_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'researcher',
  metadata JSONB,
  CONSTRAINT valid_margin CHECK (margin_percentage >= 0),
  CONSTRAINT valid_weight CHECK (weight_lbs > 0),
  CONSTRAINT valid_viral_score CHECK (viral_score >= 0 AND viral_score <= 10)
);

-- Indexes for performance
CREATE INDEX idx_trending_products_status ON trending_products(status);
CREATE INDEX idx_trending_products_discovered_at ON trending_products(discovered_at DESC);
CREATE INDEX idx_trending_products_margin ON trending_products(margin_percentage DESC);
CREATE INDEX idx_trending_products_viral_score ON trending_products(viral_score DESC);

-- ============================================================================
-- TABLE: validated_products
-- Purpose: Store products approved by Hermes Manager
-- ============================================================================
CREATE TABLE IF NOT EXISTS validated_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trending_product_id UUID REFERENCES trending_products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  estimated_cost DECIMAL(10, 2) NOT NULL,
  target_retail DECIMAL(10, 2) NOT NULL,
  margin_percentage DECIMAL(5, 1) NOT NULL,
  supplier_source VARCHAR(255) NOT NULL,
  supplier_sku VARCHAR(255),
  ad_hook_idea TEXT,
  weight_lbs DECIMAL(5, 2),
  viral_score DECIMAL(3, 1),
  product_score DECIMAL(5, 1),
  -- Score from Hermes Manager (0-100)
  status VARCHAR(50) DEFAULT 'validated',
  -- Status: validated, campaigning, syncing, live, archived
  validated_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP,
  storefront_id VARCHAR(255),
  -- External storefront product ID (Shopify, WooCommerce, etc.)
  storefront_type VARCHAR(50),
  -- 'shopify', 'woocommerce', etc.
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'hermes-manager',
  metadata JSONB,
  CONSTRAINT valid_margin CHECK (margin_percentage >= 0),
  CONSTRAINT valid_weight CHECK (weight_lbs > 0),
  CONSTRAINT valid_score CHECK (product_score >= 0 AND product_score <= 100)
);

-- Indexes for performance
CREATE INDEX idx_validated_products_status ON validated_products(status);
CREATE INDEX idx_validated_products_validated_at ON validated_products(validated_at DESC);
CREATE INDEX idx_validated_products_storefront_id ON validated_products(storefront_id);
CREATE INDEX idx_validated_products_score ON validated_products(product_score DESC);

-- ============================================================================
-- TABLE: campaign_logs
-- Purpose: Complete audit trail of all agent activities
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name VARCHAR(100) NOT NULL,
  -- 'Researcher', 'HermesManager', 'Pusher'
  action VARCHAR(100) NOT NULL,
  -- 'INIT', 'RESEARCH_COMPLETE', 'VALIDATION_STARTED', 'SYNC_SUCCESS', 'ERROR', etc.
  product_id UUID REFERENCES trending_products(id) ON DELETE SET NULL,
  details JSONB,
  error_message TEXT,
  logged_at TIMESTAMP DEFAULT NOW(),
  request_id VARCHAR(50),
  -- Correlation ID for tracking related operations
  duration_ms INTEGER,
  -- Operation duration in milliseconds
  status VARCHAR(20) DEFAULT 'success'
  -- 'success', 'failure', 'partial'
);

-- Indexes for performance
CREATE INDEX idx_campaign_logs_agent_name ON campaign_logs(agent_name);
CREATE INDEX idx_campaign_logs_logged_at ON campaign_logs(logged_at DESC);
CREATE INDEX idx_campaign_logs_action ON campaign_logs(action);
CREATE INDEX idx_campaign_logs_product_id ON campaign_logs(product_id);
CREATE INDEX idx_campaign_logs_request_id ON campaign_logs(request_id);

-- ============================================================================
-- TABLE: agent_health
-- Purpose: Track agent status and performance metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name VARCHAR(100) NOT NULL UNIQUE,
  last_run_at TIMESTAMP,
  last_success_at TIMESTAMP,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_duration_ms INTEGER,
  last_error TEXT,
  status VARCHAR(20) DEFAULT 'unknown',
  -- 'running', 'idle', 'error', 'unknown'
  uptime_percentage DECIMAL(5, 2),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TABLE: supplier_inventory
-- Purpose: Track product availability and pricing from suppliers
-- ============================================================================
CREATE TABLE IF NOT EXISTS supplier_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES trending_products(id) ON DELETE CASCADE,
  supplier_name VARCHAR(255) NOT NULL,
  supplier_sku VARCHAR(255),
  cost_price DECIMAL(10, 2),
  current_stock INTEGER,
  min_order_quantity INTEGER DEFAULT 1,
  lead_time_days INTEGER,
  reliability_score DECIMAL(3, 1),
  last_checked_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_supplier_inventory_product_id ON supplier_inventory(product_id);
CREATE INDEX idx_supplier_inventory_supplier_name ON supplier_inventory(supplier_name);

-- ============================================================================
-- TABLE: storefront_sync_status
-- Purpose: Track synchronization status with storefronts
-- ============================================================================
CREATE TABLE IF NOT EXISTS storefront_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validated_product_id UUID REFERENCES validated_products(id) ON DELETE CASCADE,
  storefront_type VARCHAR(50) NOT NULL,
  -- 'shopify', 'woocommerce', etc.
  storefront_product_id VARCHAR(255),
  sync_status VARCHAR(50) DEFAULT 'pending',
  -- 'pending', 'syncing', 'synced', 'failed', 'archived'
  last_sync_at TIMESTAMP,
  next_sync_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_storefront_sync_status_sync_status ON storefront_sync_status(sync_status);
CREATE INDEX idx_storefront_sync_status_storefront_type ON storefront_sync_status(storefront_type);

-- ============================================================================
-- VIEWS for easier querying
-- ============================================================================

-- View: High-performing products (for analysis)
CREATE OR REPLACE VIEW high_performing_products AS
SELECT
  vp.id,
  vp.product_name,
  vp.margin_percentage,
  vp.product_score,
  vp.viral_score,
  vp.storefront_type,
  vp.status,
  vp.validated_at,
  vp.synced_at
FROM validated_products vp
WHERE vp.status IN ('live', 'syncing')
ORDER BY vp.product_score DESC;

-- View: Agent performance summary
CREATE OR REPLACE VIEW agent_performance_summary AS
SELECT
  ah.agent_name,
  ah.last_run_at,
  ah.status,
  ah.success_count,
  ah.error_count,
  ah.uptime_percentage,
  ah.avg_duration_ms,
  COUNT(cl.id) as recent_activity_count
FROM agent_health ah
LEFT JOIN campaign_logs cl ON ah.agent_name = cl.agent_name
  AND cl.logged_at > NOW() - INTERVAL '24 hours'
GROUP BY ah.agent_name, ah.last_run_at, ah.status, ah.success_count, ah.error_count, ah.uptime_percentage, ah.avg_duration_ms
ORDER BY ah.agent_name;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Optional but recommended
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE trending_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE validated_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront_sync_status ENABLE ROW LEVEL SECURITY;

-- Policy: Allow agents to read their own logs
CREATE POLICY "agents_read_own_logs" ON campaign_logs
  FOR SELECT USING (true);

-- Policy: Allow agents to insert logs
CREATE POLICY "agents_insert_logs" ON campaign_logs
  FOR INSERT WITH CHECK (true);

-- Policy: Allow agents to read all products
CREATE POLICY "agents_read_products" ON trending_products
  FOR SELECT USING (true);

-- Policy: Allow agents to read validated products
CREATE POLICY "agents_read_validated" ON validated_products
  FOR SELECT USING (true);

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample product for testing
INSERT INTO trending_products (
  product_name,
  estimated_cost,
  target_retail,
  margin_percentage,
  supplier_source,
  ad_hook_idea,
  weight_lbs,
  viral_score,
  status
) VALUES (
  'Smart Plant Watering System',
  4.50,
  24.99,
  455,
  'CJ Dropshipping',
  'Never kill another plant - water automatically while you sleep',
  1.2,
  8.5,
  'discovered'
) ON CONFLICT DO NOTHING;

INSERT INTO supplier_inventory (
  product_id,
  supplier_name,
  supplier_sku,
  cost_price,
  current_stock,
  min_order_quantity,
  lead_time_days,
  reliability_score
)
SELECT
  id,
  'CJ Dropshipping',
  'CJ-2024-001',
  4.50,
  5000,
  1,
  7,
  9.2
FROM trending_products
WHERE product_name = 'Smart Plant Watering System'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Tables created:
-- ✓ trending_products (Researcher agent output)
-- ✓ validated_products (Hermes Manager output)
-- ✓ campaign_logs (Audit trail)
-- ✓ agent_health (Performance tracking)
-- ✓ supplier_inventory (Supplier data)
-- ✓ storefront_sync_status (Sync tracking)
--
-- Views created:
-- ✓ high_performing_products
-- ✓ agent_performance_summary
--
-- Ready for Hermes Factory deployment!
-- ============================================================================
