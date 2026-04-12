/**
 * Invoice PDF API — Generate printable HTML invoice
 * Feature: Invoice Cards (Build 8)
 * Role: Serve a print-ready HTML page for the invoice that users can save as PDF
 *
 * GET /api/invoices/[id]/pdf — Returns HTML response (not JSON)
 *
 * For MVP, this returns HTML with print-optimized CSS. The user uses
 * their browser's "Print > Save as PDF" functionality. A future iteration
 * can use a server-side PDF library for direct download.
 *
 * Dependencies: Invoice data (from DB), business profile, pdf-generator template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { generateInvoiceHtml } from '@/lib/invoices/pdf-generator';
import type { Invoice, InvoiceItem, InvoiceWithItems } from '@/lib/invoices/types';

// ============================================================
// GET — Generate printable HTML invoice
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // --- Auth check ---
  let userId: string;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
  } else {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message_tl: 'Kailangan mag-login muna.' } },
        { status: 401 }
      );
    }
    userId = user.id;
  }

  const db = SKIP_AUTH ? createServiceClient() : supabase;

  // --- Fetch invoice ---
  const { data: invoice, error: invoiceError } = await db
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message_tl: 'Hindi makita ang invoice.' } },
      { status: 404 }
    );
  }

  // --- Fetch line items ---
  const { data: items } = await db
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  // --- Fetch business profile for header ---
  const { data: profile } = await db
    .from('business_profiles')
    .select('business_name, owner_name, business_address')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  // --- Fetch user contact info ---
  const { data: userData } = await db
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();

  const invoiceWithItems: InvoiceWithItems = {
    ...(invoice as Invoice),
    items: (items ?? []) as InvoiceItem[],
  };

  const businessInfo = {
    business_name: (profile as Record<string, unknown>)?.business_name as string | null ?? null,
    owner_name: (profile as Record<string, unknown>)?.owner_name as string | null ?? null,
    address: (profile as Record<string, unknown>)?.business_address as string | null ?? null,
    phone: null,
    email: (userData as Record<string, unknown>)?.email as string | null ?? null,
  };

  // --- Generate HTML ---
  const html = generateInvoiceHtml(invoiceWithItems, businessInfo);

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
