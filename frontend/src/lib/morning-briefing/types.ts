/**
 * Morning Briefing — Type Definitions
 * Feature: Ang Umaga Mo (Build 5)
 * Role: Shared types for data aggregation, API response, and UI rendering
 *
 * All monetary values are in centavos (integers). Display conversion happens
 * at the UI layer only.
 */

// ============================================================
// Data Aggregation Context — assembled server-side from Supabase
// ============================================================

export interface MorningBriefingContext {
  /** The date this briefing covers, in YYYY-MM-DD Manila time */
  briefing_date: string;
  /** Day name for greeting personalization */
  day_of_week: string;

  /** Yesterday's financial summary */
  yesterday: {
    total_income_centavos: number;
    total_expenses_centavos: number;
    income_count: number;
    expense_count: number;
    top_expense_categories: Array<{ category: string; amount_centavos: number }>;
    has_transactions: boolean;
  };

  /** Current cash position (all-time net) */
  cash_position: {
    balance_centavos: number;
    trend_vs_last_week: 'up' | 'down' | 'flat';
    change_centavos: number;
  };

  /** BIR deadlines in the next 14 days */
  upcoming_deadlines: Array<{
    form_type: string;
    form_description: string;
    deadline_date: string;
    days_until: number;
    status: string;
    filing_period: string;
  }>;

  /** Week-over-week comparison (current vs previous) */
  week_comparison: {
    this_week_income_centavos: number;
    last_week_income_centavos: number;
    this_week_expense_centavos: number;
    last_week_expense_centavos: number;
  };

  /** Account age in days (for new-user edge case) */
  days_since_signup: number;
  /** Whether the user has ever recorded any transactions */
  has_any_transactions: boolean;
}

// ============================================================
// Tonal Rotation (D6 — Phase 7 Kumustahan hero)
// ============================================================

/**
 * Daily tonal rotation for the Kumustahan hero one-liner.
 * Selected deterministically via dayOfYear(briefing_date) % 3:
 *   0 -> energetic   (punchy, action-leaning)
 *   1 -> observant   (calm, noticing)
 *   2 -> celebratory (warm, recognising progress)
 */
export type MorningTone = 'energetic' | 'observant' | 'celebratory';

// ============================================================
// API Response — returned by GET /api/morning-briefing
// ============================================================

export interface MorningBriefingResponse {
  available: boolean;
  /**
   * Why the briefing is unavailable, OR — when paired with `available: true` and
   * a deterministic tagline/briefing — that the response is a credit-balance
   * fallback (no Claude call was made).
   */
  reason?:
    | 'outside_window'
    | 'tier_required'
    | 'feature_disabled'
    | 'error'
    | 'no_credits';
  briefing?: string;
  /** One-liner for the Kumustahan hero (≤ 80 chars). May be undefined on JSON parse failure. */
  tagline?: string;
  /** Which tone was selected for this briefing date. */
  tone?: MorningTone;
  cached: boolean;
  message_tl?: string;
}
