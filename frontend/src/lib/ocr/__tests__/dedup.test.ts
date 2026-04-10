// ============================================================
// Receipt Deduplication Tests — Gap C1 (Sprint 12)
// Feature: Resibo Scanner — Duplicate Detection
//
// Tests: hash generation consistency, time window matching,
//        case insensitivity, null/empty merchant handling,
//        different receipts produce different hashes,
//        checkDuplicate query behavior with mocked Supabase.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateReceiptHash,
  checkDuplicate,
  checkReceiptDuplicate,
} from '../dedup';

// ============================================================
// Hash Generation Tests
// ============================================================

describe('generateReceiptHash', () => {
  // --- Test 1: Deterministic — same inputs always produce same hash ---
  it('produces consistent hash for identical inputs', () => {
    const hash1 = generateReceiptHash(34500, '2026-04-10', 'SM Supermarket');
    const hash2 = generateReceiptHash(34500, '2026-04-10', 'SM Supermarket');
    expect(hash1).toBe(hash2);
  });

  // --- Test 2: Different amount produces different hash ---
  it('produces different hash when amount differs', () => {
    const hash1 = generateReceiptHash(34500, '2026-04-10', 'SM Supermarket');
    const hash2 = generateReceiptHash(34501, '2026-04-10', 'SM Supermarket');
    expect(hash1).not.toBe(hash2);
  });

  // --- Test 3: Different date produces different hash ---
  it('produces different hash when date differs', () => {
    const hash1 = generateReceiptHash(34500, '2026-04-10', 'SM Supermarket');
    const hash2 = generateReceiptHash(34500, '2026-04-11', 'SM Supermarket');
    expect(hash1).not.toBe(hash2);
  });

  // --- Test 4: Different merchant produces different hash ---
  it('produces different hash when merchant differs', () => {
    const hash1 = generateReceiptHash(34500, '2026-04-10', 'SM Supermarket');
    const hash2 = generateReceiptHash(34500, '2026-04-10', 'Jollibee');
    expect(hash1).not.toBe(hash2);
  });

  // --- Test 5: Case insensitivity — merchant name is lowercased ---
  it('is case-insensitive for merchant name', () => {
    const hash1 = generateReceiptHash(34500, '2026-04-10', 'SM Supermarket');
    const hash2 = generateReceiptHash(34500, '2026-04-10', 'sm supermarket');
    const hash3 = generateReceiptHash(34500, '2026-04-10', 'SM SUPERMARKET');
    expect(hash1).toBe(hash2);
    expect(hash2).toBe(hash3);
  });

  // --- Test 6: Whitespace normalization — extra spaces collapsed ---
  it('normalizes whitespace in merchant name', () => {
    const hash1 = generateReceiptHash(34500, '2026-04-10', 'SM Supermarket');
    const hash2 = generateReceiptHash(34500, '2026-04-10', '  SM  Supermarket  ');
    expect(hash1).toBe(hash2);
  });

  // --- Test 7: Empty merchant name ---
  it('handles empty merchant name', () => {
    const hash1 = generateReceiptHash(34500, '2026-04-10', '');
    const hash2 = generateReceiptHash(34500, '2026-04-10', '');
    expect(hash1).toBe(hash2);
    // Should still be a valid hash string
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  // --- Test 8: Hash format is SHA-256 hex ---
  it('returns a 64-character hex string (SHA-256)', () => {
    const hash = generateReceiptHash(12345, '2026-01-01', 'Test Store');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash.length).toBe(64);
  });

  // --- Test 9: Zero amount ---
  it('handles zero amount', () => {
    const hash = generateReceiptHash(0, '2026-04-10', 'Store');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  // --- Test 10: Date trimming ---
  it('trims whitespace from date', () => {
    const hash1 = generateReceiptHash(5000, '2026-04-10', 'Store');
    const hash2 = generateReceiptHash(5000, ' 2026-04-10 ', 'Store');
    expect(hash1).toBe(hash2);
  });
});

// ============================================================
// Duplicate Check Tests (with mocked Supabase)
// ============================================================

describe('checkDuplicate', () => {
  // --- Mock Supabase client ---
  function createMockSupabase(returnData: unknown[] | null, returnError: unknown = null) {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: returnData,
        error: returnError,
      }),
    };
    return {
      from: vi.fn().mockReturnValue(chain),
      _chain: chain,
    };
  }

  const TEST_USER_ID = 'user-123';
  const TEST_HASH = generateReceiptHash(34500, '2026-04-10', 'SM Supermarket');
  const TEST_TIMESTAMP = new Date('2026-04-10T14:00:00Z');

  const MOCK_EXISTING_TRANSACTION = {
    id: 'tx-existing-1',
    user_id: TEST_USER_ID,
    type: 'expense',
    amount: 34500,
    category: 'supplies',
    description: 'Grocery run',
    transaction_date: '2026-04-10',
    merchant_name: 'SM Supermarket',
    receipt_hash: TEST_HASH,
    source: 'ocr',
    created_at: '2026-04-10T14:05:00Z',
  };

  // --- Test 11: Returns existing transaction when duplicate found ---
  it('returns existing transaction when hash matches within time window', async () => {
    const mockSupabase = createMockSupabase([MOCK_EXISTING_TRANSACTION]);

    const result = await checkDuplicate(
      mockSupabase as never,
      TEST_USER_ID,
      TEST_HASH,
      TEST_TIMESTAMP
    );

    expect(result).not.toBeNull();
    expect(result?.id).toBe('tx-existing-1');
    expect(result?.amount).toBe(34500);
  });

  // --- Test 12: Returns null when no duplicate found ---
  it('returns null when no matching hash exists', async () => {
    const mockSupabase = createMockSupabase([]);

    const result = await checkDuplicate(
      mockSupabase as never,
      TEST_USER_ID,
      TEST_HASH,
      TEST_TIMESTAMP
    );

    expect(result).toBeNull();
  });

  // --- Test 13: Returns null on Supabase error (fail open) ---
  it('returns null on database error (fail open)', async () => {
    const mockSupabase = createMockSupabase(null, {
      message: 'Connection refused',
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await checkDuplicate(
      mockSupabase as never,
      TEST_USER_ID,
      TEST_HASH,
      TEST_TIMESTAMP
    );

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      '[Dedup] Error checking for duplicate receipt:',
      expect.objectContaining({ message: 'Connection refused' })
    );

    consoleSpy.mockRestore();
  });

  // --- Test 14: Passes correct time window to query ---
  it('queries with ±30 min time window', async () => {
    const mockSupabase = createMockSupabase([]);

    await checkDuplicate(
      mockSupabase as never,
      TEST_USER_ID,
      TEST_HASH,
      TEST_TIMESTAMP
    );

    const chain = mockSupabase._chain;

    // Verify gte was called with windowStart (30 min before)
    const expectedStart = new Date(
      TEST_TIMESTAMP.getTime() - 30 * 60 * 1000
    ).toISOString();
    expect(chain.gte).toHaveBeenCalledWith('created_at', expectedStart);

    // Verify lte was called with windowEnd (30 min after)
    const expectedEnd = new Date(
      TEST_TIMESTAMP.getTime() + 30 * 60 * 1000
    ).toISOString();
    expect(chain.lte).toHaveBeenCalledWith('created_at', expectedEnd);
  });

  // --- Test 15: Scopes query to user_id and deleted_at IS NULL ---
  it('scopes query to user_id and excludes soft-deleted records', async () => {
    const mockSupabase = createMockSupabase([]);

    await checkDuplicate(
      mockSupabase as never,
      TEST_USER_ID,
      TEST_HASH,
      TEST_TIMESTAMP
    );

    const chain = mockSupabase._chain;
    expect(chain.eq).toHaveBeenCalledWith('user_id', TEST_USER_ID);
    expect(chain.eq).toHaveBeenCalledWith('receipt_hash', TEST_HASH);
    expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
  });
});

// ============================================================
// Full Pipeline (checkReceiptDuplicate) Tests
// ============================================================

describe('checkReceiptDuplicate', () => {
  function createMockSupabase(returnData: unknown[]) {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: returnData,
        error: null,
      }),
    };
    return { from: vi.fn().mockReturnValue(chain) };
  }

  // --- Test 16: Returns is_duplicate: false when no match ---
  it('returns is_duplicate false when no matching transaction', async () => {
    const mockSupabase = createMockSupabase([]);

    const result = await checkReceiptDuplicate(
      mockSupabase as never,
      'user-abc',
      15000,
      '2026-04-10',
      'Jollibee'
    );

    expect(result.is_duplicate).toBe(false);
    expect(result.existing_transaction).toBeNull();
  });

  // --- Test 17: Returns is_duplicate: true with existing transaction ---
  it('returns is_duplicate true with existing transaction when match found', async () => {
    const matchingTx = {
      id: 'tx-dup',
      user_id: 'user-abc',
      type: 'expense',
      amount: 15000,
      category: 'food',
      description: null,
      transaction_date: '2026-04-10',
      merchant_name: 'Jollibee',
      receipt_hash: generateReceiptHash(15000, '2026-04-10', 'Jollibee'),
      source: 'ocr',
      created_at: '2026-04-10T12:00:00Z',
    };

    const mockSupabase = createMockSupabase([matchingTx]);

    const result = await checkReceiptDuplicate(
      mockSupabase as never,
      'user-abc',
      15000,
      '2026-04-10',
      'Jollibee'
    );

    expect(result.is_duplicate).toBe(true);
    expect(result.existing_transaction?.id).toBe('tx-dup');
  });
});
