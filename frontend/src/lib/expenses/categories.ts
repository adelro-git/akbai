/**
 * Expense & Income Categories — Filipino MSME context
 *
 * Categories are designed around real Filipino micro/small business spending patterns.
 * Each category has a Taglish label for UI display and a color token for charts.
 */

export interface CategoryDef {
  key: string;
  label: string;       // Taglish UI label
  icon: string;        // Lucide icon name
  color: string;       // Tailwind color class for charts
}

// ─── Expense Categories ─────────────────────────────────────────────
export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { key: 'ingredients', label: 'Ingredients / Sangkap', icon: 'shopping-basket', color: 'bg-primary-container' },
  { key: 'supplies', label: 'Supplies / Gamit', icon: 'package', color: 'bg-secondary-container' },
  { key: 'transport', label: 'Transportation / Pamasahe', icon: 'truck', color: 'bg-tertiary-container' },
  { key: 'utilities', label: 'Kuryente, Tubig, Internet', icon: 'zap', color: 'bg-primary-fixed-dim' },
  { key: 'rent', label: 'Renta / Upa', icon: 'home', color: 'bg-outline' },
  { key: 'labor', label: 'Sahod / Labor', icon: 'users', color: 'bg-tertiary' },
  { key: 'packaging', label: 'Packaging / Balot', icon: 'box', color: 'bg-secondary' },
  { key: 'marketing', label: 'Marketing / Ads', icon: 'megaphone', color: 'bg-primary' },
  { key: 'tax_fee', label: 'BIR / Government Fees', icon: 'landmark', color: 'bg-destructive' },
  { key: 'other_expense', label: 'Iba pa', icon: 'more-horizontal', color: 'bg-outline-variant' },
];

// ─── Income Categories ──────────────────────────────────────────────
export const INCOME_CATEGORIES: CategoryDef[] = [
  { key: 'sales', label: 'Sales / Benta', icon: 'banknote', color: 'bg-tertiary-container' },
  { key: 'check_in_sales', label: 'Daily Check-In Sales', icon: 'sparkles', color: 'bg-tertiary' },
  { key: 'other_income', label: 'Iba pang Kita', icon: 'plus-circle', color: 'bg-primary-container' },
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
