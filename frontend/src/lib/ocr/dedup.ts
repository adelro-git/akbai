// ============================================================
// Receipt Deduplication — Gap C1 (Sprint 12)
// Feature: Resibo Scanner
//
// Purpose: Detect duplicate receipt scans before saving to prevent
//          double-entry of the same transaction. Uses a deterministic
//          hash of amount + date + merchant_name, then checks for
//          existing transactions with the same hash within a ±30 min window.
//
// Flow: generateReceiptHash() → checkDuplicate() → return match or null
// ============================================================

import { createHash } from 'crypto';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Types — Dedup-specific types for the duplicate check result
// ============================================================

/** A matching transaction returned by the duplicate check. */
export interface DuplicateTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number; // centavos
  category: string;
  description: string | null;
  transaction_date: string;
  merchant_name: string | null;
  receipt_hash: string | null;
  source: string;
  created_at: string;
}

/** Result of a dedup check — either a match or null. */
export interface DedupResult {
  is_duplicate: boolean;
  existing_transaction: DuplicateTransaction | null;
}

// ============================================================
// Zod Schemas — Validate inputs to dedup functions
// ============================================================

export const ReceiptHashInputSchema = z.object({
  amount: z.number().int().nonnegative(),
  date: z.string().min(1),
  merchantName: z.string(),
});

export type ReceiptHashInput = z.infer<typeof ReceiptHashInputSchema>;

// ============================================================
// Constants
// ============================================================

/** Time window in minutes for duplicate detection (±30 min). */
const DEDUP_WINDOW_MINUTES = 30;

// ============================================================
// Hash Generation — Deterministic hash from receipt fields
// ============================================================

/**
 * Generate a deterministic SHA-256 hash from receipt fields.
 *
 * Normalizes inputs before hashing:
 * - Amount is an integer (centavos) — used as-is
 * - Date is trimmed
 * - Merchant name is lowercased, trimmed, and whitespace-collapsed
 *   (empty/null merchants hash as empty string)
 *
 * @param amount - Transaction amount in centavos
 * @param date - Transaction date string (YYYY-MM-DD)
 * @param merchantName - Merchant/store name (case-insensitive)
 * @returns SHA-256 hex digest
 */
export function generateReceiptHash(
  amount: number,
  date: string,
  merchantName: string
): string {
  // --- Normalize merchant: lowercase, trim, collapse whitespace ---
  const normalizedMerchant = (merchantName ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  const normalizedDate = (date ?? '').trim();

  // --- Build hash input: pipe-delimited to avoid collisions ---
  const hashInput = `${amount}|${normalizedDate}|${normalizedMerchant}`;

  return createHash('sha256').update(hashInput).digest('hex');
}

// ============================================================
// Duplicate Check — Query for matching hash within time window
// ============================================================

/**
 * Check if a transaction with the same receipt hash exists within
 * ±30 minutes of the given timestamp.
 *
 * Scoped to user_id via parameter (RLS also enforces this at DB level).
 * Only checks non-soft-deleted records.
 *
 * @param supabase - Supabase client (browser or service)
 * @param userId - The user's ID
 * @param hash - Receipt hash from generateReceiptHash()
 * @param timestamp - When the receipt was scanned (for time window)
 * @returns The existing transaction if duplicate found, null otherwise
 */
export async function checkDuplicate(
  supabase: SupabaseClient,
  userId: string,
  hash: string,
  timestamp: Date
): Promise<DuplicateTransaction | null> {
  // --- Calculate time window boundaries ---
  const windowStart = new Date(
    timestamp.getTime() - DEDUP_WINDOW_MINUTES * 60 * 1000
  );
  const windowEnd = new Date(
    timestamp.getTime() + DEDUP_WINDOW_MINUTES * 60 * 1000
  );

  // --- Query for matching hash within window ---
  const { data, error } = await supabase
    .from('transactions')
    .select(
      'id, user_id, type, amount, category, description, transaction_date, merchant_name, receipt_hash, source, created_at'
    )
    .eq('user_id', userId)
    .eq('receipt_hash', hash)
    .is('deleted_at', null)
    .gte('created_at', windowStart.toISOString())
    .lte('created_at', windowEnd.toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('[Dedup] Error checking for duplicate receipt:', error);
    // Fail open — don't block the user from saving if dedup check fails
    return null;
  }

  if (data && data.length > 0) {
    return data[0] as DuplicateTransaction;
  }

  return null;
}

// ============================================================
// Convenience — Run full dedup check from receipt fields
// ============================================================

/**
 * Full dedup pipeline: hash receipt fields, check for duplicates.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param amount - Amount in centavos
 * @param date - Transaction date (YYYY-MM-DD)
 * @param merchantName - Merchant/store name
 * @param timestamp - When the scan happened (defaults to now)
 * @returns DedupResult with is_duplicate flag and optional existing transaction
 */
export async function checkReceiptDuplicate(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  date: string,
  merchantName: string,
  timestamp?: Date
): Promise<DedupResult> {
  const hash = generateReceiptHash(amount, date, merchantName);
  const scanTime = timestamp ?? new Date();

  const existing = await checkDuplicate(supabase, userId, hash, scanTime);

  return {
    is_duplicate: existing !== null,
    existing_transaction: existing,
  };
}
