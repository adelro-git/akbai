/**
 * Feature Flag Names — Type-safe flag constants
 * Feature: Feature Flags (Sprint 5)
 * Role: Provides compile-time safety for flag references. Callers use
 *       FLAGS.DAILY_CHECK_IN_ENABLED instead of magic strings.
 */

// ============================================================
// Known Feature Flags — add new flags here as the product grows.
// Values are the JSONB key names stored in users.feature_flags.
// ============================================================

export const FLAGS = {
  DAILY_CHECK_IN_ENABLED: 'daily_check_in_enabled',
  OCR_ENABLED: 'ocr_enabled',
  MORNING_BRIEFING_ENABLED: 'morning_briefing_enabled',
  DARK_MODE_ENABLED: 'dark_mode_enabled',
} as const satisfies Record<string, string>;

/** Union type of all known flag key names */
export type FlagName = (typeof FLAGS)[keyof typeof FLAGS];
