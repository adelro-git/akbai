-- Build 0: Circuit breaker spend tracking table
-- Tracks daily API costs per user for budget enforcement

-- ============================================================
-- DAILY_API_SPEND table
-- ============================================================
CREATE TABLE public.daily_api_spend (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
  query_count INTEGER NOT NULL DEFAULT 0,
  scan_count INTEGER NOT NULL DEFAULT 0,
  briefing_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_api_spend ENABLE ROW LEVEL SECURITY;

-- --- RLS Policies: Users can read their own spend (for UI display) ---
CREATE POLICY "daily_api_spend_select_own"
  ON public.daily_api_spend FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for users — only service role writes.
-- This is intentional: spend tracking is server-side only.

-- --- Triggers: Auto-update updated_at timestamp ---
CREATE TRIGGER on_daily_api_spend_updated
  BEFORE UPDATE ON public.daily_api_spend
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- RPC: Atomic increment for spend tracking
-- SECURITY DEFINER runs with function owner's permissions,
-- allowing server-side API routes to write without RLS bypass.
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_daily_spend(
  p_user_id UUID,
  p_date DATE,
  p_cost DECIMAL,
  p_feature TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO public.daily_api_spend (user_id, date, total_cost_usd, query_count, scan_count, briefing_count)
  VALUES (
    p_user_id, p_date, p_cost,
    CASE WHEN p_feature IN ('general_chat','reply_drafter','classify_expense','classify_intent') THEN 1 ELSE 0 END,
    CASE WHEN p_feature = 'resibo_scanner' THEN 1 ELSE 0 END,
    CASE WHEN p_feature = 'morning_briefing' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_cost_usd = public.daily_api_spend.total_cost_usd + EXCLUDED.total_cost_usd,
    query_count = public.daily_api_spend.query_count + EXCLUDED.query_count,
    scan_count = public.daily_api_spend.scan_count + EXCLUDED.scan_count,
    briefing_count = public.daily_api_spend.briefing_count + EXCLUDED.briefing_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
