/**
 * BIR Form Definitions — Schedule data for all BIR forms
 * Feature: Build 6 — BIR Deadline Watcher (Sprint 9)
 * Role: Maps each BIR form to its filing schedule (which months, which day).
 *       Used by generate.ts to create deadline rows for a given tax type.
 *
 * Source: BIR knowledge base (akbai-delivery/skills/ai-engineer/references/bir-knowledge-base.md)
 */

import type { BirTaxType } from './types';

// ============================================================
// Form Schedule Definition
// ============================================================

export interface FormSchedule {
  form_name: string;
  description: string;
  /** Month numbers (1-12) when this form is due */
  due_months: number[];
  /** Day of the month the form is due */
  due_day: number;
}

// ============================================================
// BIR Form Schedules — all known forms and their due dates
// ============================================================

/** 1701Q — Quarterly Income Tax Return (Apr 15, Aug 15, Nov 15) */
export const FORM_1701Q: FormSchedule = {
  form_name: '1701Q',
  description: 'Quarterly Income Tax Return',
  due_months: [4, 8, 11],
  due_day: 15,
};

/** 1701A — Annual Income Tax Return (Apr 15) */
export const FORM_1701A: FormSchedule = {
  form_name: '1701A',
  description: 'Annual Income Tax Return',
  due_months: [4],
  due_day: 15,
};

/** 2551Q — Quarterly Percentage Tax (Jan 25, Apr 25, Jul 25, Oct 25) */
export const FORM_2551Q: FormSchedule = {
  form_name: '2551Q',
  description: 'Quarterly Percentage Tax',
  due_months: [1, 4, 7, 10],
  due_day: 25,
};

/** 2550Q — Quarterly VAT Return (Jan 25, Apr 25, Jul 25, Oct 25) */
export const FORM_2550Q: FormSchedule = {
  form_name: '2550Q',
  description: 'Quarterly VAT Return',
  due_months: [1, 4, 7, 10],
  due_day: 25,
};

/** 2550M — Monthly VAT Return (20th of the following month, every month) */
export const FORM_2550M: FormSchedule = {
  form_name: '2550M',
  description: 'Monthly VAT Return',
  due_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  due_day: 20,
};

/** 1601-EQ — Quarterly Withholding Tax (last day of month following quarter) */
export const FORM_1601EQ: FormSchedule = {
  form_name: '1601-EQ',
  description: 'Quarterly Withholding Tax (Expanded)',
  due_months: [1, 4, 7, 10],
  due_day: 0,  // special: last day of month — handled in generate.ts
};

// ============================================================
// Tax Type → Required Forms mapping
// ============================================================

export const TAX_TYPE_FORMS: Record<BirTaxType, FormSchedule[]> = {
  /** Sole prop (non-VAT, graduated + OSD): 1701Q, 1701A, 2551Q */
  sole_prop_graduated_osd: [FORM_1701Q, FORM_1701A, FORM_2551Q],

  /** Sole prop (non-VAT, 8% flat): 1701Q, 1701A (no 2551Q) */
  sole_prop_8pct: [FORM_1701Q, FORM_1701A],

  /** Sole prop (VAT): 1701Q, 1701A, 2550Q, 2550M */
  sole_prop_vat: [FORM_1701Q, FORM_1701A, FORM_2550Q, FORM_2550M],

  /** Freelancer: 1701Q, 1701A, 2551Q */
  freelancer: [FORM_1701Q, FORM_1701A, FORM_2551Q],

  /** Online seller: same as sole prop graduated + OSD (no employees assumed) */
  online_seller: [FORM_1701Q, FORM_1701A, FORM_2551Q],
};
