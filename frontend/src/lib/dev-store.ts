/**
 * Dev-only in-memory store for SKIP_AUTH mode.
 * Uses globalThis to survive Turbopack HMR module reloads.
 * Shared across API routes so check-in data shows up in expenses.
 * Never used in production.
 */

export interface DevTransaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string | null;
  transaction_date: string;
  source: string;
  source_ref_id: string | null;
  created_at: string;
}

// Use globalThis so the store survives HMR — without this, each route
// gets its own module instance and they can't see each other's data.
export interface DevCheckIn {
  id: string;
  mood: string | null;
  kai_greeting: string;
  check_in_date: string;
  sales_amount: number | null;
  expenses_amount: number | null;
}

const g = globalThis as unknown as {
  __devTransactions?: DevTransaction[];
  __devTxCounter?: number;
  __devCheckIn?: DevCheckIn | null;
};

if (!g.__devTransactions) g.__devTransactions = [];
if (!g.__devTxCounter) g.__devTxCounter = 0;
if (g.__devCheckIn === undefined) g.__devCheckIn = null;

export function addDevTransaction(tx: Omit<DevTransaction, 'id' | 'created_at'>): DevTransaction {
  g.__devTxCounter = (g.__devTxCounter ?? 0) + 1;
  const newTx: DevTransaction = {
    ...tx,
    id: `dev-tx-${g.__devTxCounter}`,
    created_at: new Date().toISOString(),
  };
  g.__devTransactions!.push(newTx);
  return newTx;
}

export function softDeleteDevTransaction(id: string): boolean {
  const store = g.__devTransactions!;
  const idx = store.findIndex(tx => tx.id === id && tx.source_ref_id !== 'DELETED');
  if (idx === -1) return false;
  store[idx].source_ref_id = 'DELETED';
  return true;
}

export function softDeleteDevTransactionsByRef(sourceRefId: string): void {
  for (const tx of g.__devTransactions!) {
    if (tx.source === 'check_in' && tx.source_ref_id === sourceRefId) {
      tx.source_ref_id = 'DELETED';
    }
  }
}

export function getActiveDevTransactions(): DevTransaction[] {
  return g.__devTransactions!.filter(tx => tx.source_ref_id !== 'DELETED');
}

// ── Dev check-in store ──

export function setDevCheckIn(checkIn: DevCheckIn): void {
  g.__devCheckIn = checkIn;
}

export function getDevCheckIn(): DevCheckIn | null {
  return g.__devCheckIn ?? null;
}
