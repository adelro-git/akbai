// ============================================================
// reconciliation/types.ts — Data-completeness reconciliation contract.
//
// Sprint 18 (stream: reconciliation). Build 5's "Ang Umaga Mo" was supposed
// to ship Weekly + Monthly Reconciliation but it never merged — this is the
// rebuild. PURPOSE: surface which daily check-in days are MISSING so the
// user's financial data is complete, plus a month-to-date summary. This is
// data-completeness *nudging* — distinct from the Weekly Story (Kuwento),
// which is a narrative KPI recap.
//
// All money is INTEGER centavos (₱34.50 = 3450); peso conversion happens at
// the UI layer only. All dates are YYYY-MM-DD in Asia/Manila (UTC+8).
// ============================================================

// ── Per-day reconciliation entry ──────────────────────────────────────────
// One entry per calendar day in the window. `logged` = the user has a
// (non-soft-deleted) daily_check_in row for that date. sales/expenses are
// only present when logged AND the column was non-null on that check-in.
export type ReconciliationDay = {
  /** YYYY-MM-DD (Manila) */
  date: string;
  /** Filipino weekday abbreviation: Lun / Mar / Miy / Hue / Bie / Sab / Lin */
  day_label: string;
  /** True when a daily_check_in row exists for this date. */
  logged: boolean;
  /** Centavos. null when not logged or the user left sales blank that day. */
  sales_centavos: number | null;
  /** Centavos. null when not logged or the user left expenses blank that day. */
  expenses_centavos: number | null;
};

// ── Weekly reconciliation (past 7 days, inclusive of today) ────────────────
export type WeeklyReconciliation = {
  /** YYYY-MM-DD (Manila) — earliest day in the 7-day window. */
  range_start: string;
  /** YYYY-MM-DD (Manila) — today. */
  range_end: string;
  /** length 7, oldest → today */
  days: ReconciliationDay[];
  /** YYYY-MM-DD list of days in the window with NO check-in. */
  missing_dates: string[];
  /** Count of days in the window that WERE logged (0..7). */
  logged_count: number;
  /** Count of days in the window (always 7). */
  total_days: number;
  /** Sum of logged sales across the window, centavos. */
  total_sales_centavos: number;
  /** Sum of logged expenses across the window, centavos. */
  total_expenses_centavos: number;
  /** total_sales - total_expenses, centavos (can be negative). */
  net_centavos: number;
};

// ── Monthly reconciliation (current calendar month, month-to-date) ─────────
export type MonthlyReconciliation = {
  /** YYYY-MM-DD (Manila) — first day of the current month. */
  month_start: string;
  /** YYYY-MM-DD (Manila) — today. */
  month_end: string;
  /** Human label, e.g. "Mayo 2026" (Filipino month name + year). */
  month_label: string;
  /** Sum of logged sales month-to-date, centavos. */
  total_sales_centavos: number;
  /** Sum of logged expenses month-to-date, centavos. */
  total_expenses_centavos: number;
  /** total_sales - total_expenses, centavos (can be negative). */
  net_centavos: number;
  /** Count of distinct days month-to-date that were logged. */
  days_logged: number;
  /** Count of calendar days elapsed month-to-date (1..31, includes today). */
  days_elapsed: number;
  /** YYYY-MM-DD list of elapsed days this month with NO check-in. */
  missing_dates: string[];
};

// ── API response envelopes (AKBai error-envelope convention) ───────────────
export type WeeklyReconciliationResponse =
  | { success: true; data: WeeklyReconciliation }
  | {
      success: false;
      error: { code: string; message: string; message_tl: string };
    };

export type MonthlyReconciliationResponse =
  | { success: true; data: MonthlyReconciliation }
  | {
      success: false;
      error: { code: string; message: string; message_tl: string };
    };

// ── Check-in row shape the aggregator consumes (subset of daily_check_in) ──
// Migrations 006 + 007: check_in_date DATE, sales_amount/expenses_amount are
// nullable INTEGER centavos. The aggregator only needs these three columns.
export type ReconciliationCheckIn = {
  check_in_date: string;
  sales_amount: number | null;
  expenses_amount: number | null;
};
