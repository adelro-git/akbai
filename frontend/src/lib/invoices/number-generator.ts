/**
 * Invoice Number Generator — sequential INV-YYYYMM-NNN format
 * Feature: Invoice Cards (Build 8)
 * Role: Generate unique, sequential invoice numbers per user per month
 *
 * Format: INV-202604-001, INV-202604-002, etc.
 * Queries the max existing number for the user+month, increments by 1.
 * Handles first invoice of a month (starts at 001).
 *
 * Dependencies: Supabase client (passed in — works with both auth and service client)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getManilaToday } from '@/lib/timezone';

// ============================================================
// Number Generation Logic
// ============================================================

/**
 * Generate the next invoice number for a user.
 *
 * @param db - Supabase client (auth-scoped or service client)
 * @param userId - The user's UUID
 * @param invoiceDate - Optional YYYY-MM-DD date; defaults to today in Manila TZ
 * @returns Invoice number string like "INV-202604-003"
 */
export async function generateInvoiceNumber(
  db: SupabaseClient,
  userId: string,
  invoiceDate?: string
): Promise<string> {
  const date = invoiceDate ?? getManilaToday();
  const yearMonth = date.slice(0, 7).replace('-', ''); // "202604"
  const prefix = `INV-${yearMonth}-`;

  // --- Query max existing invoice number for this user+month ---
  const { data } = await db
    .from('invoices')
    .select('invoice_number')
    .eq('user_id', userId)
    .like('invoice_number', `${prefix}%`)
    .is('deleted_at', null)
    .order('invoice_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextSeq = 1;

  if (data?.invoice_number) {
    // Extract the numeric suffix: "INV-202604-003" -> "003" -> 3
    const suffix = data.invoice_number.slice(prefix.length);
    const parsed = parseInt(suffix, 10);
    if (!isNaN(parsed)) {
      nextSeq = parsed + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

/**
 * Parse an invoice number into its components (for display/sorting).
 */
export function parseInvoiceNumber(invoiceNumber: string): {
  yearMonth: string;
  sequence: number;
} | null {
  const match = invoiceNumber.match(/^INV-(\d{6})-(\d{3,})$/);
  if (!match) return null;

  return {
    yearMonth: match[1],
    sequence: parseInt(match[2], 10),
  };
}
