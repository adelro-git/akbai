/**
 * Shared business type and income range options.
 * Used by onboarding wizard and profile edit form.
 *
 * Source of truth for display labels — DB stores the `value` string.
 */
import type { BusinessType, IncomeRange } from '@/lib/kilala-kita/schemas';

// ─── Business Types ─────────────────────────────────────────

export interface BusinessTypeOption {
  value: BusinessType;
  label: string;
  description: string;
  icon: string;
}

export const BUSINESS_TYPES: BusinessTypeOption[] = [
  {
    value: 'food_baking',
    label: 'Food / Baking',
    description: 'Lutong bahay, pastries, kakanin',
    icon: '🍰',
  },
  {
    value: 'online_selling',
    label: 'Online Selling',
    description: 'Shopee, Lazada, Facebook, TikTok',
    icon: '📦',
  },
  {
    value: 'freelance_creative',
    label: 'Freelance / Creative',
    description: 'Design, writing, dev, VA',
    icon: '💻',
  },
  {
    value: 'sari_sari_retail',
    label: 'Sari-Sari / Retail',
    description: 'Tindahan, retail, reselling',
    icon: '🏪',
  },
  {
    value: 'other',
    label: 'Iba Pa',
    description: 'Salon, services, farming, etc.',
    icon: '✨',
  },
];

/** Lookup map: value → human-readable label */
export const BUSINESS_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  BUSINESS_TYPES.map((bt) => [bt.value, bt.label])
);

// ─── Income Ranges ──────────────────────────────────────────

export interface IncomeRangeOption {
  value: IncomeRange;
  label: string;
  tagline: string;
}

export const INCOME_RANGES: IncomeRangeOption[] = [
  { value: 'below_50k', label: 'Below ₱50K', tagline: 'Nagsisimula pa lang' },
  { value: '50k_150k', label: '₱50K – ₱150K', tagline: 'Lumalaki na' },
  { value: '150k_500k', label: '₱150K – ₱500K', tagline: 'Malakas na' },
  { value: 'above_500k', label: 'Above ₱500K', tagline: 'Malaki na talaga' },
];

/** Lookup map: value → human-readable label */
export const INCOME_RANGE_LABELS: Record<string, string> = Object.fromEntries(
  INCOME_RANGES.map((ir) => [ir.value, ir.label])
);
