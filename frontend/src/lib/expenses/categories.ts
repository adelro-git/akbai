/**
 * Expense & Income Categories — Filipino MSME context
 *
 * Categories are designed around real Filipino micro/small business spending patterns.
 * Each category has a Taglish label for UI display and a color token for charts +
 * the Saan Napunta category breakdown progress bars (Phase 8 redesign, Q5 of
 * design_handoff_akbai_redesign/synthesis/screens/02-expenses.md).
 *
 * Color tokens use the honey/sage/ink palette from tailwind.config.js. `color`
 * is a Tailwind background class (`bg-*`) so consumers can apply it directly to
 * a div for the progress-bar fill or chart segment.
 */

export interface CategoryDef {
  key: string;
  label: string;       // Taglish UI label
  icon: string;        // Lucide icon name
  color: string;       // Tailwind bg-* class — honey/sage/ink palette for progress bars + charts
}

// ─── Expense Categories ─────────────────────────────────────────────
// Color rationale: warm honey tones for goods/operations spend, sage for labor,
// ink neutrals for transport/rent/other, destructive for BIR fees only.
export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { key: 'ingredients', label: 'Ingredients / Sangkap', icon: 'shopping-basket', color: 'bg-honey-deep' },
  { key: 'supplies', label: 'Supplies / Gamit', icon: 'package', color: 'bg-honey-pale' },
  { key: 'transport', label: 'Transportation / Pamasahe', icon: 'truck', color: 'bg-ink-soft' },
  { key: 'utilities', label: 'Kuryente, Tubig, Internet', icon: 'zap', color: 'bg-honey-bright' },
  { key: 'rent', label: 'Renta / Upa', icon: 'home', color: 'bg-ink-faint' },
  { key: 'labor', label: 'Sahod / Labor', icon: 'users', color: 'bg-sage-deep' },
  { key: 'packaging', label: 'Packaging / Balot', icon: 'box', color: 'bg-honey-cream' },
  { key: 'marketing', label: 'Marketing / Ads', icon: 'megaphone', color: 'bg-sage' },
  { key: 'tax_fee', label: 'BIR / Government Fees', icon: 'landmark', color: 'bg-destructive' },
  { key: 'other_expense', label: 'Iba pa', icon: 'more-horizontal', color: 'bg-ink-faint' },
];

// ─── Income Categories ──────────────────────────────────────────────
// Money-in stays in the sage family for visual cohesion (kita = green/positive).
export const INCOME_CATEGORIES: CategoryDef[] = [
  { key: 'sales', label: 'Sales / Benta', icon: 'banknote', color: 'bg-sage-deep' },
  { key: 'check_in_sales', label: 'Daily Check-In Sales', icon: 'sparkles', color: 'bg-sage' },
  { key: 'other_income', label: 'Iba pang Kita', icon: 'plus-circle', color: 'bg-sage-pale' },
];

// ─── Helpers ─────────────────────────────────────────────────────────

/** All valid category keys for Zod validation */
export const EXPENSE_CATEGORY_KEYS = EXPENSE_CATEGORIES.map((c) => c.key);
export const INCOME_CATEGORY_KEYS = INCOME_CATEGORIES.map((c) => c.key);
export const ALL_CATEGORY_KEYS = [...EXPENSE_CATEGORY_KEYS, ...INCOME_CATEGORY_KEYS];

/** Look up a category definition by key */
export function getCategoryDef(key: string): CategoryDef | undefined {
  return EXPENSE_CATEGORIES.find((c) => c.key === key)
    ?? INCOME_CATEGORIES.find((c) => c.key === key);
}

/** Get the Taglish label for a category key */
export function getCategoryLabel(key: string): string {
  return getCategoryDef(key)?.label ?? key;
}
