/**
 * BIR Deadline Generator — Creates deadline rows for a given tax type
 * Feature: Build 6 — BIR Deadline Watcher (Sprint 9)
 * Role: Given a BIR tax type, generates all upcoming deadlines for the
 *       current fiscal year. Called by POST /api/deadlines when user
 *       selects their tax type on profile.
 */

import type { BirTaxType } from './types';
import { TAX_TYPE_FORMS, type FormSchedule } from './constants';

// ============================================================
// Generated Deadline shape (before DB insert)
// ============================================================

export interface GeneratedDeadline {
  form_name: string;
  due_date: string;       // YYYY-MM-DD
  description: string;
}

// ============================================================
// Helper — get last day of a month
// ============================================================

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// ============================================================
// Helper — format date as YYYY-MM-DD
// ============================================================

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ============================================================
// Generate deadlines for a single form schedule in a given year
// ============================================================

function generateForForm(schedule: FormSchedule, year: number): GeneratedDeadline[] {
  const deadlines: GeneratedDeadline[] = [];

  for (const month of schedule.due_months) {
    let day: number;

    if (schedule.due_day === 0) {
      // Special case: last day of month (e.g., 1601-EQ)
      day = getLastDayOfMonth(year, month);
    } else {
      day = schedule.due_day;
    }

    deadlines.push({
      form_name: schedule.form_name,
      due_date: formatDate(year, month, day),
      description: schedule.description,
    });
  }

  return deadlines;
}

// ============================================================
// Main: Generate all deadlines for a tax type
// ============================================================

/**
 * Generate all BIR deadlines for a given tax type and year.
 *
 * @param taxType - The BIR tax type from the user's profile
 * @param year - The fiscal year to generate deadlines for (defaults to current year)
 * @returns Array of generated deadlines sorted by due_date
 */
export function generateDeadlines(
  taxType: BirTaxType,
  year?: number
): GeneratedDeadline[] {
  const targetYear = year ?? new Date().getFullYear();
  const forms = TAX_TYPE_FORMS[taxType];

  if (!forms) {
    return [];
  }

  const allDeadlines: GeneratedDeadline[] = [];

  for (const schedule of forms) {
    allDeadlines.push(...generateForForm(schedule, targetYear));
  }

  // Sort by due_date ascending
  allDeadlines.sort((a, b) => a.due_date.localeCompare(b.due_date));

  return allDeadlines;
}
