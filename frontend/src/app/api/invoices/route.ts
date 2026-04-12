/**
 * Invoice API — List and Create invoices
 * Feature: Invoice Cards (Build 8)
 * Role: CRUD entry point for invoice headers + line items
 *
 * GET  /api/invoices         — List user's invoices (with optional status filter)
 * POST /api/invoices         — Create invoice with line items
 *
 * Dependencies: Supabase (invoices + invoice_items tables), Zod schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { getManilaToday } from '@/lib/timezone';
import { CreateInvoiceSchema, InvoiceStatusEnum } from '@/lib/invoices/schemas';
import { generateInvoiceNumber } from '@/lib/invoices/number-generator';
import type { Invoice, InvoiceItem } from '@/lib/invoices/types';
import { z } from 'zod';

// ============================================================
// Query Params Schema
// ============================================================

const InvoicesQuerySchema = z.object({
  status: InvoiceStatusEnum.optional(),
  search: z.string().optional(),
});

// ============================================================
// GET — List user's invoices with optional filters
// ============================================================

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // --- Parse query params ---
  const url = new URL(req.url);
  const rawParams: Record<string, string> = {};
  for (const [k, v] of url.searchParams.entries()) {
    rawParams[k] = v;
  }

  const parsed = InvoicesQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Mali ang query parameters.' } },
      { status: 400 }
    );
  }

  const filters = parsed.data;

  // --- Auth check ---
  let userId: string;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
  } else {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message_tl: 'Kailangan mag-login muna.' } },
        { status: 401 }
      );
    }
    userId = user.id;
  }

  const db = SKIP_AUTH ? createServiceClient() : supabase;

  // --- Build query ---
  let query = db
    .from('invoices')
    .select('id, invoice_number, invoice_date, due_date, client_name, client_email, client_phone, subtotal_centavos, discount_centavos, tax_rate_pct, tax_amount_centavos, total_centavos, status, sent_at, paid_at, cancelled_at, notes, created_at, updated_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // --- Apply filters ---
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.search) {
    query = query.or(`client_name.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%`);
  }

  const { data: invoices, error: queryError } = await query;

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi makuha ang mga invoice. Subukan muli.' } },
      { status: 500 }
    );
  }

  // --- Compute summary counts ---
  const rows = (invoices ?? []) as Invoice[];
  const summary = {
    total: rows.length,
    draft: rows.filter((i) => i.status === 'draft').length,
    sent: rows.filter((i) => i.status === 'sent').length,
    paid: rows.filter((i) => i.status === 'paid').length,
    overdue: rows.filter((i) => i.status === 'overdue').length,
    cancelled: rows.filter((i) => i.status === 'cancelled').length,
  };

  return NextResponse.json({ success: true, data: { invoices: rows, summary } });
}

// ============================================================
// POST — Create a new invoice with line items
// ============================================================

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // --- Parse body ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Mali ang request format.' } },
      { status: 400 }
    );
  }

  const parsed = CreateInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message_tl: 'May mali sa data ng invoice.',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // --- Auth check ---
  let userId: string;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
  } else {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message_tl: 'Kailangan mag-login muna.' } },
        { status: 401 }
      );
    }
    userId = user.id;
  }

  const db = SKIP_AUTH ? createServiceClient() : supabase;

  // --- Compute totals from line items ---
  const subtotalCentavos = data.items.reduce(
    (sum, item) => sum + item.unit_price_centavos * (item.quantity ?? 1),
    0
  );
  const discountCentavos = data.discount_centavos ?? 0;
  const taxRatePct = data.tax_rate_pct ?? 0;
  const taxableAmount = subtotalCentavos - discountCentavos;
  const taxAmountCentavos = Math.round(taxableAmount * (taxRatePct / 100));
  const totalCentavos = taxableAmount + taxAmountCentavos;

  // --- Generate invoice number if not provided or use the provided one ---
  const invoiceNumber = data.invoice_number || await generateInvoiceNumber(db, userId, data.invoice_date);
  const invoiceDate = data.invoice_date ?? getManilaToday();

  // --- Insert invoice header ---
  const { data: invoice, error: insertError } = await db
    .from('invoices')
    .insert({
      user_id: userId,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: data.due_date ?? null,
      client_name: data.client_name,
      client_email: data.client_email ?? null,
      client_phone: data.client_phone ?? null,
      client_address: data.client_address ?? null,
      subtotal_centavos: subtotalCentavos,
      discount_centavos: discountCentavos,
      tax_rate_pct: taxRatePct,
      tax_amount_centavos: taxAmountCentavos,
      total_centavos: totalCentavos,
      status: 'draft',
      notes: data.notes ?? null,
      internal_notes: data.internal_notes ?? null,
    })
    .select('id, invoice_number, invoice_date, due_date, client_name, total_centavos, status, created_at')
    .single();

  if (insertError || !invoice) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-save ang invoice. Subukan muli.' } },
      { status: 500 }
    );
  }

  // --- Insert line items ---
  const itemPayloads = data.items.map((item, index) => ({
    user_id: userId,
    invoice_id: (invoice as Record<string, unknown>).id as string,
    description: item.description,
    quantity: item.quantity ?? 1,
    unit: item.unit ?? 'piece',
    unit_price_centavos: item.unit_price_centavos,
    total_centavos: item.unit_price_centavos * (item.quantity ?? 1),
    costing_card_id: item.costing_card_id ?? null,
    sort_order: index,
  }));

  const { error: itemsError } = await db
    .from('invoice_items')
    .insert(itemPayloads);

  if (itemsError) {
    // Roll back invoice if items fail (soft-delete the orphan)
    await db
      .from('invoices')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', (invoice as Record<string, unknown>).id as string);

    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-save ang line items. Subukan muli.' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: invoice }, { status: 201 });
}
