import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { getManilaToday } from '@/lib/timezone';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  ExpensesQuerySchema,
} from '@/lib/expenses/schemas';
import { resolveRange } from '@/lib/expenses/range';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Schema capability probe — cached at module load
// Detects whether migration 014 (merchant_name, receipt_hash) has been applied.
// If columns are missing, we gracefully omit them from INSERT payloads
// and return-SELECTs so expense saves still work.
// ============================================================

let receiptColumnsAvailable: boolean | null = null;

async function hasReceiptColumns(db: SupabaseClient): Promise<boolean> {
  if (receiptColumnsAvailable !== null) return receiptColumnsAvailable;
  const { error } = await db
    .from('transactions')
    .select('id, merchant_name, receipt_hash')
    .limit(1);
  if (error && /merchant_name|receipt_hash/.test(error.message)) {
    console.warn(
      '[api/expenses] migration 014 (receipt_dedup) not applied — merchant_name/receipt_hash columns missing. Run: frontend/supabase/migrations/014_receipt_dedup.sql'
    );
    receiptColumnsAvailable = false;
  } else {
    receiptColumnsAvailable = true;
  }
  return receiptColumnsAvailable;
}

// ============================================================
// Types
// ============================================================

interface TransactionRow {
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

interface CategorySummary {
  category: string;
  total: number;   // centavos
  count: number;
}

interface ExpensesResponse {
  transactions: TransactionRow[];
  summary: {
    total_income: number;
    total_expenses: number;
    net: number;
    by_category: CategorySummary[];
  };
}

// ============================================================
// GET — List transactions with optional filters + aggregation
// ============================================================

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // Parse query params
  const url = new URL(req.url);
  const rawParams: Record<string, string> = {};
  for (const [k, v] of url.searchParams.entries()) {
    rawParams[k] = v;
  }

  const parsed = ExpensesQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    // Surface a range-specific message when the user sent an unknown
    // pill value (Sprint 14). Falls through to the generic message for
    // any other bad param (month format, etc.).
    const fieldErrors = parsed.error.flatten().fieldErrors;
    if (fieldErrors.range && fieldErrors.range.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Hindi tama ang saklaw ng panahon.' } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Mali ang query parameters.' } },
      { status: 400 }
    );
  }

  const filters = parsed.data;

  // ── Sprint 14 — `?range=` pill shorthand ────────────────────────────
  // `range` wins over `month` when both are present; warn-log so the
  // ambiguity is visible during /expenses adoption. No params at all →
  // default to current Manila month (parity with existing default).
  if (filters.range && filters.month) {
    console.warn(
      '[api/expenses] both ?range= and ?month= sent — ?range= wins',
      { range: filters.range, month: filters.month }
    );
  }
  if (!filters.range && !filters.month && !filters.from && !filters.to) {
    // Implicit default — current Manila month.
    filters.range = 'buwan';
  }

  let userId: string;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
  } else {
    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message_tl: 'Kailangan mag-login muna.' } },
        { status: 401 }
      );
    }

    userId = user.id;
  }

  // Dev bypass uses service client to bypass RLS; auth path uses normal client
  const db = SKIP_AUTH ? createServiceClient() : supabase;

  // Build query
  let query = db
    .from('transactions')
    .select('id, type, amount, category, description, transaction_date, source, source_ref_id, created_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  // Date range — precedence:
  //   1. `range` (linggo|buwan|taon) — Sprint 14 pill shorthand, always wins
  //   2. `month` (YYYY-MM) — legacy, used by older callers (page falls back)
  //   3. explicit `from` / `to` — power-user filters
  if (filters.range) {
    const { from, to } = resolveRange(filters.range, getManilaToday());
    query = query.gte('transaction_date', from).lte('transaction_date', to);
  } else if (filters.month) {
    const [year, month] = filters.month.split('-').map(Number);
    const from = `${filters.month}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${filters.month}-${String(lastDay).padStart(2, '0')}`;
    query = query.gte('transaction_date', from).lte('transaction_date', to);
  } else {
    if (filters.from) {
      query = query.gte('transaction_date', filters.from);
    }
    if (filters.to) {
      query = query.lte('transaction_date', filters.to);
    }
  }

  const { data: transactions, error: queryError } = await query;

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi makuha ang transactions. Subukan muli.' } },
      { status: 500 }
    );
  }

  const rows = (transactions ?? []) as TransactionRow[];

  // Compute summary
  let totalIncome = 0;
  let totalExpenses = 0;
  const catMap = new Map<string, { total: number; count: number }>();

  for (const tx of rows) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpenses += tx.amount;
    }

    const existing = catMap.get(tx.category);
    if (existing) {
      existing.total += tx.amount;
      existing.count += 1;
    } else {
      catMap.set(tx.category, { total: tx.amount, count: 1 });
    }
  }

  const byCategory: CategorySummary[] = Array.from(catMap.entries())
    .map(([category, { total, count }]) => ({ category, total, count }))
    .sort((a, b) => b.total - a.total);

  const response: ExpensesResponse = {
    transactions: rows,
    summary: {
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net: totalIncome - totalExpenses,
      by_category: byCategory,
    },
  };

  return NextResponse.json({ success: true, data: response });
}

// ============================================================
// POST — Create a new transaction
// ============================================================

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  let userId: string;

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Mali ang request format.' } },
      { status: 400 }
    );
  }

  const parsed = CreateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message_tl: 'Mali ang data.',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
  } else {
    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message_tl: 'Kailangan mag-login muna.' } },
        { status: 401 }
      );
    }

    userId = user.id;
  }

  // Dev bypass uses service client to bypass RLS; auth path uses normal client
  const db = SKIP_AUTH ? createServiceClient() : supabase;

  // --- Build insert payload (OCR-sourced fields are optional) ---
  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    type: data.type,
    amount: data.amount,
    category: data.category,
    description: data.description ?? null,
    transaction_date: data.transaction_date ?? getManilaToday(),
    source: data.source ?? 'manual',
    source_ref_id: data.source_ref_id ?? null,
  };

  // OCR-sourced transactions include merchant_name and receipt_hash (Build 3)
  // Only include them if migration 014 has been applied (column probe)
  const receiptCols = await hasReceiptColumns(db);
  if (receiptCols) {
    if (data.merchant_name) insertPayload.merchant_name = data.merchant_name;
    if (data.receipt_hash) insertPayload.receipt_hash = data.receipt_hash;
  } else if (data.merchant_name) {
    // Graceful fallback: fold merchant into description so OCR scans still save
    const prefix = `[${data.merchant_name}]`;
    insertPayload.description = data.description
      ? `${prefix} ${data.description}`
      : prefix;
  }

  const returnCols = receiptCols
    ? 'id, type, amount, category, description, transaction_date, source, source_ref_id, merchant_name, receipt_hash, created_at'
    : 'id, type, amount, category, description, transaction_date, source, source_ref_id, created_at';

  const { data: tx, error: insertError } = await db
    .from('transactions')
    .insert(insertPayload)
    .select(returnCols)
    .single();

  if (insertError) {
    console.error('[api/expenses POST] insert failed:', insertError);
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-save. Subukan muli.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: tx }, { status: 201 });
}

// ============================================================
// PATCH — Update a transaction (by id in query param)
// ============================================================

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();

  const url = new URL(req.url);
  const txId = url.searchParams.get('id');

  if (!txId) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Kailangan ng transaction ID.' } },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Mali ang request format.' } },
      { status: 400 }
    );
  }

  const parsed = UpdateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message_tl: 'Mali ang data.',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  let patchUserId: string;

  if (SKIP_AUTH) {
    patchUserId = DEV_USER.id;
  } else {
    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message_tl: 'Kailangan mag-login muna.' } },
        { status: 401 }
      );
    }

    patchUserId = user.id;
  }

  // Dev bypass uses service client to bypass RLS; auth path uses normal client
  const db = SKIP_AUTH ? createServiceClient() : supabase;

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const d = parsed.data;
  if (d.amount !== undefined) updateData.amount = d.amount;
  if (d.category !== undefined) updateData.category = d.category;
  if (d.description !== undefined) updateData.description = d.description;
  if (d.transaction_date !== undefined) updateData.transaction_date = d.transaction_date;

  const { data: tx, error: updateError } = await db
    .from('transactions')
    .update(updateData)
    .eq('id', txId)
    .eq('user_id', patchUserId)
    .is('deleted_at', null)
    .select('id, type, amount, category, description, transaction_date, source, source_ref_id, created_at')
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-update. Subukan muli.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: tx });
}

// ============================================================
// DELETE — Soft-delete a transaction (by id in query param)
// ============================================================

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();

  const url = new URL(req.url);
  const txId = url.searchParams.get('id');

  if (!txId) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Kailangan ng transaction ID.' } },
      { status: 400 }
    );
  }

  let deleteUserId: string;

  if (SKIP_AUTH) {
    deleteUserId = DEV_USER.id;
  } else {
    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message_tl: 'Kailangan mag-login muna.' } },
        { status: 401 }
      );
    }

    deleteUserId = user.id;
  }

  // Dev bypass uses service client to bypass RLS; auth path uses normal client
  const db = SKIP_AUTH ? createServiceClient() : supabase;

  const { error: deleteError } = await db
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', txId)
    .eq('user_id', deleteUserId)
    .is('deleted_at', null);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-delete. Subukan muli.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: { id: txId, deleted: true } });
}
