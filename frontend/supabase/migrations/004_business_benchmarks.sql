-- AKBai Migration 004: Business Benchmarks Table
-- Purpose: Store anonymized, aggregated business intelligence computed from real user data.
-- KA uses this to give data-backed insights per business type.
--
-- Rollback: DROP TABLE IF EXISTS public.business_benchmarks CASCADE;

-- ============================================================
-- BUSINESS_BENCHMARKS table
-- ============================================================
CREATE TABLE public.business_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dimension keys
  business_type TEXT NOT NULL,                -- e.g., 'food_baking', 'service_salon'
  period_type TEXT NOT NULL
    CHECK (period_type IN ('monthly', 'quarterly')),
  period_start DATE NOT NULL,                 -- first day of the period

  -- Sample metadata (for statistical validity + privacy)
  sample_size INTEGER NOT NULL DEFAULT 0,     -- number of businesses contributing
  min_sample_threshold INTEGER NOT NULL DEFAULT 5, -- don't surface to users if below this

  -- Aggregated metrics (JSONB for flexible shapes per business type)
  --
  -- cost_structure example:
  -- {
  --   "ingredients": {"pct_of_revenue": 0.45, "median": 45000, "p25": 35000, "p75": 55000},
  --   "packaging":   {"pct_of_revenue": 0.07, "median": 7000,  "p25": 4000,  "p75": 12000}
  -- }
  cost_structure JSONB DEFAULT '{}'::jsonb,

  -- revenue_stats example:
  -- {
  --   "median": 120000, "p25": 80000, "p75": 200000,
  --   "income_sources": {"gcash": 0.65, "bank_transfer": 0.20, "cod": 0.15}
  -- }
  revenue_stats JSONB DEFAULT '{}'::jsonb,

  -- seasonal_patterns example:
  -- {
  --   "revenue_vs_avg": 1.3, "is_peak": true, "peak_label": "christmas_rush"
  -- }
  seasonal_patterns JSONB DEFAULT '{}'::jsonb,

  -- common_merchants example: ["S&R", "Puregold", "Shopee"]
  common_merchants JSONB DEFAULT '[]'::jsonb,

  -- common_categories example: ["food_ingredients", "packaging", "delivery"]
  common_categories JSONB DEFAULT '[]'::jsonb,

  -- Computation tracking
  -- 0 = editorial seed from msme-business-knowledge.md (use "typically" language)
  -- 1+ = computed from real user data (use "based on similar businesses" language)
  computation_version INTEGER NOT NULL DEFAULT 1,

  -- Standard AKBai columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.business_benchmarks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (data is anonymized aggregates, no PII)
CREATE POLICY "benchmarks_select_authenticated"
  ON public.business_benchmarks
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only service role can insert (aggregation job / seed script)
CREATE POLICY "benchmarks_insert_service"
  ON public.business_benchmarks
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Only service role can update (re-aggregation)
CREATE POLICY "benchmarks_update_service"
  ON public.business_benchmarks
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================
-- INDEXES
-- ============================================================

-- One benchmark row per business_type + period (prevents duplicates)
CREATE UNIQUE INDEX idx_benchmarks_type_period
  ON public.business_benchmarks(business_type, period_type, period_start)
  WHERE deleted_at IS NULL;

-- Fast lookup: latest monthly benchmark for a business type (used at prompt assembly time)
CREATE INDEX idx_benchmarks_latest
  ON public.business_benchmarks(business_type, period_start DESC)
  WHERE deleted_at IS NULL AND period_type = 'monthly';

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE TRIGGER on_business_benchmarks_updated
  BEFORE UPDATE ON public.business_benchmarks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- SEED DATA (computation_version: 0 = editorial, from msme-business-knowledge.md)
-- These provide KA with baseline knowledge before real user data accumulates.
-- KA should say "typically for this business type" not "based on data from similar businesses"
-- when computation_version = 0.
-- ============================================================
INSERT INTO public.business_benchmarks
  (business_type, period_type, period_start, sample_size, min_sample_threshold, computation_version,
   cost_structure, revenue_stats, seasonal_patterns, common_merchants, common_categories)
VALUES
  -- Food/Baking (Maria persona, §1)
  ('food_baking', 'monthly', '2026-03-01', 0, 5, 0,
   '{
     "ingredients":  {"pct_of_revenue": 0.45, "median": 54000, "p25": 36000, "p75": 75000},
     "packaging":    {"pct_of_revenue": 0.07, "median": 8400,  "p25": 6000,  "p75": 15000},
     "delivery":     {"pct_of_revenue": 0.12, "median": 14400, "p25": 9600,  "p75": 22500},
     "utilities":    {"pct_of_revenue": 0.04, "median": 4800,  "p25": 3600,  "p75": 7500},
     "equipment":    {"pct_of_revenue": 0.03, "median": 3600,  "p25": 2400,  "p75": 7500}
   }'::jsonb,
   '{"median": 120000, "p25": 80000, "p75": 250000,
     "income_sources": {"gcash": 0.65, "bank_transfer": 0.20, "cod": 0.10, "cash": 0.05}}'::jsonb,
   '{"peak_months": ["october", "november", "december", "february", "march"],
     "slow_months": ["january", "august", "september"]}'::jsonb,
   '["S&R", "Puregold", "Palengke", "Shopee Wholesale"]'::jsonb,
   '["ingredients", "packaging", "delivery", "utilities", "equipment", "marketing"]'::jsonb),

  -- Online Selling (Jose persona, §2)
  ('online_selling', 'monthly', '2026-03-01', 0, 5, 0,
   '{
     "cogs":           {"pct_of_revenue": 0.55, "median": 137500, "p25": 75000,  "p75": 225000},
     "platform_fees":  {"pct_of_revenue": 0.08, "median": 20000,  "p25": 10000,  "p75": 40000},
     "shipping":       {"pct_of_revenue": 0.07, "median": 17500,  "p25": 10000,  "p75": 35000},
     "packaging":      {"pct_of_revenue": 0.03, "median": 7500,   "p25": 4000,   "p75": 15000},
     "marketing":      {"pct_of_revenue": 0.05, "median": 12500,  "p25": 5000,   "p75": 25000}
   }'::jsonb,
   '{"median": 250000, "p25": 100000, "p75": 500000,
     "income_sources": {"platform_settlement": 0.70, "gcash": 0.15, "bank_transfer": 0.10, "cod": 0.05}}'::jsonb,
   '{"peak_months": ["september", "october", "november", "december"],
     "slow_months": ["january", "february", "july"]}'::jsonb,
   '["Shopee", "Lazada", "TikTok Shop", "Grab Express", "J&T Express"]'::jsonb,
   '["cogs", "platform_fees", "shipping", "packaging", "marketing", "returns"]'::jsonb),

  -- Freelance/Creative (Ana persona, §3)
  ('freelance_creative', 'monthly', '2026-03-01', 0, 5, 0,
   '{
     "software":   {"pct_of_revenue": 0.07, "median": 3500,  "p25": 1500, "p75": 6000},
     "internet":   {"pct_of_revenue": 0.04, "median": 2000,  "p25": 1500, "p75": 3000},
     "equipment":  {"pct_of_revenue": 0.05, "median": 2500,  "p25": 1000, "p75": 5000},
     "coworking":  {"pct_of_revenue": 0.03, "median": 1500,  "p25": 0,    "p75": 4000}
   }'::jsonb,
   '{"median": 50000, "p25": 25000, "p75": 80000,
     "income_sources": {"bank_transfer": 0.40, "paypal": 0.30, "gcash": 0.25, "crypto": 0.05}}'::jsonb,
   '{"peak_months": ["january", "march", "october", "november"],
     "slow_months": ["april", "may", "december"]}'::jsonb,
   '["Adobe", "Canva", "Figma", "Upwork", "Fiverr"]'::jsonb,
   '["software", "internet", "equipment", "coworking", "training", "marketing"]'::jsonb),

  -- Sari-Sari/Retail (Andoy persona, §4)
  ('sari_sari_retail', 'monthly', '2026-03-01', 0, 5, 0,
   '{
     "inventory":    {"pct_of_revenue": 0.75, "median": 37500, "p25": 11250, "p75": 67500},
     "utilities":    {"pct_of_revenue": 0.04, "median": 2000,  "p25": 750,   "p75": 3600},
     "utang_losses": {"pct_of_revenue": 0.07, "median": 3500,  "p25": 1500,  "p75": 6750}
   }'::jsonb,
   '{"median": 50000, "p25": 15000, "p75": 90000,
     "income_sources": {"cash": 0.80, "gcash": 0.15, "utang": 0.05}}'::jsonb,
   '{"peak_months": ["june", "october", "november", "december"],
     "slow_months": ["january", "february", "july"]}'::jsonb,
   '["Puregold", "Divi (Divisoria)", "Local Distributors"]'::jsonb,
   '["inventory", "utilities", "utang_losses", "misc"]'::jsonb),

  -- Food/Carinderia (§7)
  ('food_carinderia', 'monthly', '2026-03-01', 0, 5, 0,
   '{
     "ingredients": {"pct_of_revenue": 0.55, "median": 66000, "p25": 24750, "p75": 132000},
     "lpg":         {"pct_of_revenue": 0.06, "median": 7200,  "p25": 2700,  "p75": 14400},
     "labor":       {"pct_of_revenue": 0.12, "median": 14400, "p25": 5400,  "p75": 28800},
     "rent":        {"pct_of_revenue": 0.08, "median": 9600,  "p25": 0,     "p75": 15000},
     "utilities":   {"pct_of_revenue": 0.04, "median": 4800,  "p25": 1800,  "p75": 9600},
     "packaging":   {"pct_of_revenue": 0.03, "median": 3600,  "p25": 1350,  "p75": 7200}
   }'::jsonb,
   '{"median": 120000, "p25": 45000, "p75": 240000,
     "income_sources": {"cash": 0.85, "gcash": 0.15}}'::jsonb,
   '{"peak_months": ["december"],
     "slow_months": ["january"],
     "note": "Stable year-round — people always need to eat"}'::jsonb,
   '["Palengke", "Divisoria", "Local Meat Shop", "Rice Supplier"]'::jsonb,
   '["ingredients", "lpg", "labor", "rent", "utilities", "packaging", "cleaning"]'::jsonb),

  -- Service/Salon (§8)
  ('service_salon', 'monthly', '2026-03-01', 0, 5, 0,
   '{
     "supplies":    {"pct_of_revenue": 0.20, "median": 16000, "p25": 4500,  "p75": 37500},
     "rent":        {"pct_of_revenue": 0.20, "median": 16000, "p25": 4500,  "p75": 37500},
     "labor":       {"pct_of_revenue": 0.25, "median": 20000, "p25": 7500,  "p75": 37500},
     "utilities":   {"pct_of_revenue": 0.06, "median": 4800,  "p25": 1800,  "p75": 9000},
     "equipment":   {"pct_of_revenue": 0.03, "median": 2400,  "p25": 900,   "p75": 7500}
   }'::jsonb,
   '{"median": 80000, "p25": 30000, "p75": 150000,
     "income_sources": {"cash": 0.60, "gcash": 0.35, "card": 0.05}}'::jsonb,
   '{"peak_months": ["december", "february", "march", "april"],
     "slow_months": ["january", "july", "august"]}'::jsonb,
   '["Beauty Supply Wholesaler", "Hortaleza", "Divisoria", "Shopee"]'::jsonb,
   '["supplies", "rent", "labor", "utilities", "equipment", "cleaning", "marketing"]'::jsonb);
