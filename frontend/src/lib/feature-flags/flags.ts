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
  DEADLINE_WATCHER_ENABLED: 'deadline_watcher_enabled',
  REPLY_DRAFTER_ENABLED: 'reply_drafter_enabled',
  // Build 8 features — deprioritized per PO decision (2026-04).
  // Backend code + schema (migrations 015/016/017) + API routes + pages
  // all retained. Flags default FALSE so dashboard cards are hidden.
  // Flip to TRUE via admin panel to re-enable for a user.
  COSTING_CARDS_ENABLED: 'costing_cards_enabled',
  INVOICES_ENABLED: 'invoices_enabled',
} as const satisfies Record<string, string>;

/** Union type of all known flag key names */
export type FlagName = (typeof FLAGS)[keyof typeof FLAGS];
