// ============================================================
// Weekly Story types — Phase 7 home + Phase 10 /kuwento share contract.
// ADR-015: one source of truth for the home Kuwento card and the
// future /kuwento route. Changes here are API breaking.
// ============================================================

export type WeeklyStoryDay = {
  /** YYYY-MM-DD (Manila) */
  date: string;
  /** Filipino weekday abbreviation: Lun / Mar / Miy / Hue / Bie / Sab / Lin */
  day_label: string;
  kita_centavos: number;
  gastos_centavos: number;
};

export type WeeklyStoryTone = 'energetic' | 'observant' | 'celebratory';

export type WeeklyStory = {
  /** YYYY-MM-DD (Monday, Manila) */
  week_start: string;
  /** YYYY-MM-DD (Sunday, Manila) */
  week_end: string;
  kita_centavos: number;
  gastos_centavos: number;
  /** kita - gastos (can be negative) */
  tubo_centavos: number;
  /** length 7, Mon..Sun */
  daily_breakdown: WeeklyStoryDay[];
  /** 0..6, null if no kita this week */
  peak_day_index: number | null;
  /** Tonal-rotated static template (Phase 7); LLM in Phase 10 */
  takeaway: string;
  /** D6 rotation tone */
  tone: WeeklyStoryTone;
};

export type WeeklyStoryResponse =
  | { available: true; story: WeeklyStory; cached: boolean }
  | {
      available: false;
      reason: 'no_data' | 'error';
      cached: false;
      message_tl: string;
    };
