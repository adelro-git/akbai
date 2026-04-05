/**
 * BIR Deadline Types — Type definitions for the Deadline Watcher feature
 * Feature: Build 6 — BIR Deadline Watcher (Sprint 9)
 * Role: Defines tax types, deadline statuses, and data shapes used across
 *       the deadlines lib, API route, and UI components.
 */

// ============================================================
// BIR Tax Types — maps to business_profiles.bir_tax_type column
// ============================================================

export const BIR_TAX_TYPES = [
  'sole_prop_graduated_osd',
  'sole_prop_8pct',
  'sole_prop_vat',
  'freelancer',
  'online_seller',
] as const;

export type BirTaxType = (typeof BIR_TAX_TYPES)[number];

/** Display labels for tax type selector (Taglish) */
export const BIR_TAX_TYPE_LABELS: Record<BirTaxType, string> = {
  sole_prop_graduated_osd: 'Sole Proprietor (Graduated + OSD)',
  sole_prop_8pct: 'Sole Proprietor (8% Flat Tax)',
  sole_prop_vat: 'Sole Proprietor (VAT Registered)',
  freelancer: 'Freelancer / Self-Employed',
  online_seller: 'Online Seller (Shopee/Lazada)',
};

/** Short descriptions for each tax type to help users choose */
export const BIR_TAX_TYPE_DESCRIPTIONS: Record<BirTaxType, string> = {
  sole_prop_graduated_osd: 'May DTI registration, ginagamit ang OSD para sa deductions',
  sole_prop_8pct: 'May DTI registration, flat 8% tax sa gross sales (below ₱3M)',
  sole_prop_vat: 'May DTI registration, VAT-registered (above ₱3M gross)',
  freelancer: 'Walang DTI — graphic designer, VA, developer, etc.',
  online_seller: 'Nagbebenta sa Shopee, Lazada, o sariling online store',
};

// ============================================================
// Deadline Status
// ============================================================

export const DEADLINE_STATUSES = ['upcoming', 'filed', 'overdue', 'na'] as const;
export type DeadlineStatus = (typeof DEADLINE_STATUSES)[number];

// ============================================================
// Urgency Color — for UI color coding
// ============================================================

export type DeadlineUrgency = 'overdue' | 'urgent' | 'normal';

// ============================================================
// Deadline Row — shape returned from the database / API
// ============================================================

export interface DeadlineRow {
  id: string;
  user_id: string;
  form_name: string;
  due_date: string;         // YYYY-MM-DD
  description: string | null;
  status: DeadlineStatus;
  notified_7d: boolean;
  notified_3d: boolean;
  notified_1d: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Deadline with Urgency — enriched for UI display
// ============================================================

export interface DeadlineWithUrgency extends DeadlineRow {
  urgency: DeadlineUrgency;
  days_until: number;       // negative = overdue
}

// ============================================================
// Notification — for in-app notification tracking
// ============================================================

export interface DeadlineNotification {
  deadline_id: string;
  form_name: string;
  due_date: string;
  days_until: number;
  notification_type: '7d' | '3d' | '1d';
  message: string;          // Taglish notification message
}
