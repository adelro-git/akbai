/**
 * Invoice Detail API — Get, Update, Delete single invoice
 * Feature: Invoice Cards (Build 8)
 * Role: Single-invoice operations including status transitions
 *
 * GET    /api/invoices/[id]   — Get invoice with line items
 * PATCH  /api/invoices/[id]   — Update invoice header, items, or status
 * DELETE /api/invoices/[id]   — Soft-delete invoice and its items
 *
 * Dependencies: Supabase (invoices + invoice_items), Zod schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { UpdateInvoiceSchema, UpdateInvoiceStatusSchema } from '@/lib/invoices/schemas';
import type { Invoice, InvoiceItem, InvoiceStatus } from '@/lib/invoices/types';

// ============================================================
// Status Transition Rules — valid transitions only
// ============================================================

const VALID_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['viewed', 'paid', 'overdue', 'cancelled'],
  viewed: ['paid', 'overdue', 'cancelled'],
  paid: [],        // Terminal state
  overdue: ['paid', 'cancelled'],
  cancelled: [],   // Terminal state
};

function isValidTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================
// Auth Helper — extract user ID
// ============================================================

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{ userId: string; db: ReturnType<typeof createServiceClient> | Awaited<ReturnType<typeof createClient>> } | NextResponse> {
  if (SKIP_AUTH) {
    return { userId: DEV_USER.id, db: createServiceClient() };
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message_tl: 'Kailangan mag-login muna.' } },
      { status: 401 }
    );
  }

  return { userId: user.id, db: supabase };
}

// ============================================================
// GET — Single invoice with line items
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await getUserId(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const { userId, db } = authResult;

  // --- Fetch invoice header ---
  const { data: invoice, error: invoiceError } = await db
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message_tl: 'Hindi makita ang invoice na ito.' } },
      { status: 404 }
    );
  }

  // --- Fetch line items ---
  const { data: items, error: itemsError } = await db
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (itemsError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi makuha ang line items.' } },
      { status: 500 }
    );
  }

  const invoiceWithItems = {
    ...(invoice as Invoice),
    items: (items ?? []) as InvoiceItem[],
  };

  return NextResponse.json({ success: true, data: invoiceWithItems });
}

// ============================================================
// PATCH — Update invoice (header, items, or status)
// ============================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await getUserId(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const { userId, db } = authResult;

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

  // --- Fetch current invoice to validate ownership and status ---
  const { data: current, error: fetchError } = await db
    .from('invoices')
    .select('id, user_id, status')
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !current) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message_tl: 'Hindi makita ang invoice na ito.' } },
      { status: 404 }
    );
  }

  const currentStatus = (current as Record<string, unknown>).status as InvoiceStatus;

  // --- Check if this is a status-only update ---
  const statusParsed = UpdateInvoiceStatusSchema.safeParse(body);
  if (statusParsed.success && Object.keys(body as Record<string, unknown>).length === 1) {
    const newStatus = statusParsed.data.status;

    if (!isValidTransition(currentStatus, newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message_tl: `Hindi puwedeng palitan ang status mula ${currentStatus} patungong ${newStatus}.`,
          },
        },
        { status: 400 }
      );
    }

    // --- Set timestamp fields based on status ---
    const statusUpdate: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'sent') statusUpdate.sent_at = new Date().toISOString();
    if (newStatus === 'paid') statusUpdate.paid_at = new Date().toISOString();
    if (newStatus === 'cancelled') statusUpdate.cancelled_at = new Date().toISOString();

    const { data: updated, error: updateError } = await db
      .from('invoices')
      .update(statusUpdate)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, invoice_number, status, sent_at, paid_at, cancelled_at, updated_at')
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-update ang status.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  }

  // --- Full update (header + items) — only allowed for drafts ---
  if (currentStatus !== 'draft') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_EDITABLE',
          message_tl: 'Mga draft invoice lang ang puwedeng i-edit.',
        },
      },
      { status: 400 }
    );
  }

  const parsed = UpdateInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message_tl: 'May mali sa data.',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // --- Build update payload ---
  const updatePayload: Record<string, unknown> = {};
  if (data.invoice_number !== undefined) updatePayload.invoice_number = data.invoice_number;
  if (data.invoice_date !== undefined) updatePayload.invoice_date = data.invoice_date;
  if (data.due_date !== undefined) updatePayload.due_date = data.due_date;
  if (data.client_name !== undefined) updatePayload.client_name = data.client_name;
  if (data.client_email !== undefined) updatePayload.client_email = data.client_email;
  if (data.client_phone !== undefined) updatePayload.client_phone = data.client_phone;
  if (data.client_address !== undefined) updatePayload.client_address = data.client_address;
  if (data.discount_centavos !== undefined) updatePayload.discount_centavos = data.discount_centavos;
  if (data.tax_rate_pct !== undefined) updatePayload.tax_rate_pct = data.tax_rate_pct;
  if (data.notes !== undefined) updatePayload.notes = data.notes;
  if (data.internal_notes !== undefined) updatePayload.internal_notes = data.internal_notes;

  // --- If items provided, recalculate totals ---
  if (data.items) {
    const subtotalCentavos = data.items.reduce(
      (sum, item) => sum + item.unit_price_centavos * (item.quantity ?? 1),
      0
    );
    const discountCentavos = data.discount_centavos ?? 0;
    const taxRatePct = data.tax_rate_pct ?? 0;
    const taxableAmount = subtotalCentavos - discountCentavos;
    const taxAmountCentavos = Math.round(taxableAmount * (taxRatePct / 100));
    const totalCentavos = taxableAmount + taxAmountCentavos;

    updatePayload.subtotal_centavos = subtotalCentavos;
    updatePayload.tax_amount_centavos = taxAmountCentavos;
    updatePayload.total_centavos = totalCentavos;

    // --- Soft-delete old items, insert new ones ---
    await db
      .from('invoice_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('invoice_id', id)
      .eq('user_id', userId)
      .is('deleted_at', null);

    const newItems = data.items.map((item, index) => ({
      user_id: userId,
      invoice_id: id,
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
      .insert(newItems);

    if (itemsError) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-update ang line items.' } },
        { status: 500 }
      );
    }
  }

  // --- Update invoice header ---
  if (Object.keys(updatePayload).length > 0) {
    const { data: updated, error: updateError } = await db
      .from('invoices')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, invoice_number, client_name, total_centavos, status, updated_at')
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-update ang invoice.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  }

  return NextResponse.json({ success: true, data: { id, updated: true } });
}

// ============================================================
// DELETE — Soft-delete invoice and its items
// ============================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const authResult = await getUserId(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const { userId, db } = authResult;

  const now = new Date().toISOString();

  // --- Soft-delete invoice ---
  const { error: deleteError } = await db
    .from('invoices')
    .update({ deleted_at: now })
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-delete ang invoice.' } },
      { status: 500 }
    );
  }

  // --- Soft-delete associated items ---
  await db
    .from('invoice_items')
    .update({ deleted_at: now })
    .eq('invoice_id', id)
    .eq('user_id', userId)
    .is('deleted_at', null);

  return NextResponse.json({ success: true, data: { id, deleted: true } });
}
