import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { UpdateCostingCardSchema } from '@/lib/costing/schemas';
import {
  calculateTotalCost,
  calculateItemTotalCost,
  calculateSuggestedPrice,
  calculateActualMargin,
  calculateBreakEven,
  calculateCostPerUnit,
} from '@/lib/costing/calculations';

// ============================================================
// Auth helper
// ============================================================

async function getAuthUserId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<
  { userId: string; error?: never } | { userId?: never; error: NextResponse }
> {
  if (SKIP_AUTH) return { userId: DEV_USER.id };

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      error: NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message_tl: 'Kailangan mag-login muna.' } },
        { status: 401 }
      ),
    };
  }
  return { userId: user.id };
}

// ============================================================
// GET — Single costing card with all line items
// ============================================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await getAuthUserId(supabase);
  if (auth.error) return auth.error;

  const db = SKIP_AUTH ? createServiceClient() : supabase;

  const { data: card, error: cardError } = await db
    .from('costing_cards')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.userId)
    .is('deleted_at', null)
    .single();

  if (cardError || !card) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message_tl: 'Hindi mahanap ang costing card.' } },
      { status: 404 }
    );
  }

  const { data: items } = await db
    .from('costing_card_items')
    .select('*')
    .eq('costing_card_id', id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  return NextResponse.json({
    success: true,
    data: { ...card, items: items ?? [] },
  });
}

// ============================================================
// PATCH — Update costing card and optionally replace items
// ============================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await getAuthUserId(supabase);
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message_tl: 'Mali ang request format.' } },
      { status: 400 }
    );
  }

  const parsed = UpdateCostingCardSchema.safeParse(body);
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
  const db = SKIP_AUTH ? createServiceClient() : supabase;

  // ── Verify ownership ──
  const { data: existing, error: findError } = await db
    .from('costing_cards')
    .select('id, total_cost_centavos, target_margin_pct, selling_price_centavos, monthly_fixed_costs_centavos, yield_quantity')
    .eq('id', id)
    .eq('user_id', auth.userId)
    .is('deleted_at', null)
    .single();

  if (findError || !existing) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message_tl: 'Hindi mahanap ang costing card.' } },
      { status: 404 }
    );
  }

  // ── If items are provided, replace all items (soft-delete old, insert new) ──
  let newTotalCost = existing.total_cost_centavos;
  let overheadCentavos = 0;
  let laborCentavos = 0;
  let packagingCentavos = 0;

  if (data.items) {
    // Soft-delete existing items
    await db
      .from('costing_card_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('costing_card_id', id)
      .is('deleted_at', null);

    // Recalculate from new items
    newTotalCost = calculateTotalCost(data.items);

    for (const item of data.items) {
      const itemTotal = calculateItemTotalCost(item.quantity ?? 1, item.unit_cost_centavos);
      const type = item.item_type ?? 'ingredient';
      if (type === 'overhead') overheadCentavos += itemTotal;
      else if (type === 'labor') laborCentavos += itemTotal;
      else if (type === 'packaging') packagingCentavos += itemTotal;
    }

    // Insert new items
    const itemRows = data.items.map((item, idx) => ({
      user_id: auth.userId,
      costing_card_id: id,
      item_name: item.item_name,
      item_type: item.item_type ?? 'ingredient',
      quantity: item.quantity ?? 1,
      unit: item.unit ?? '',
      unit_cost_centavos: item.unit_cost_centavos,
      total_cost_centavos: calculateItemTotalCost(item.quantity ?? 1, item.unit_cost_centavos),
      sort_order: idx,
    }));

    const { error: itemsError } = await db
      .from('costing_card_items')
      .insert(itemRows);

    if (itemsError) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-update ang mga items. Subukan muli.' } },
        { status: 500 }
      );
    }
  }

  // ── Recalculate derived fields ──
  const targetMargin = data.target_margin_pct ?? existing.target_margin_pct;
  const sellingPrice = data.selling_price_centavos !== undefined
    ? data.selling_price_centavos
    : existing.selling_price_centavos;
  const suggestedPrice = calculateSuggestedPrice(newTotalCost, targetMargin);
  const yieldQty = data.yield_quantity ?? existing.yield_quantity;
  const monthlyFixed = data.monthly_fixed_costs_centavos ?? existing.monthly_fixed_costs_centavos;

  const actualMargin = sellingPrice
    ? calculateActualMargin(sellingPrice, newTotalCost)
    : null;

  const costPerUnit = calculateCostPerUnit(newTotalCost, yieldQty);
  // break_even_qty is ALWAYS written in the update payload below, so the guard
  // must not collapse a valid value to null. monthlyFixed === 0 is a VALID
  // nonnegative value (calculateBreakEven(0, price, cost) returns 0), and a
  // PATCH that doesn't touch pricing keeps the existing selling price / fixed
  // costs — so it must recompute the SAME break-even, not wipe it. Use explicit
  // null checks (NOT a falsy `&&` guard). (B4)
  const breakEvenQty =
    sellingPrice != null && monthlyFixed != null
      ? calculateBreakEven(monthlyFixed, sellingPrice, costPerUnit)
      : null;

  // ── Build update payload ──
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    total_cost_centavos: newTotalCost,
    suggested_price_centavos: suggestedPrice,
    actual_margin_pct: actualMargin,
    break_even_qty: breakEvenQty,
    target_margin_pct: targetMargin,
  };

  if (data.product_name !== undefined) updatePayload.product_name = data.product_name;
  if (data.product_category !== undefined) updatePayload.product_category = data.product_category;
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.selling_price_centavos !== undefined) updatePayload.selling_price_centavos = data.selling_price_centavos;
  if (data.monthly_fixed_costs_centavos !== undefined) updatePayload.monthly_fixed_costs_centavos = data.monthly_fixed_costs_centavos;
  if (data.yield_quantity !== undefined) updatePayload.yield_quantity = data.yield_quantity;
  if (data.yield_unit !== undefined) updatePayload.yield_unit = data.yield_unit;

  if (data.items) {
    updatePayload.overhead_centavos = overheadCentavos;
    updatePayload.labor_centavos = laborCentavos;
    updatePayload.packaging_centavos = packagingCentavos;
  }

  const { error: updateError } = await db
    .from('costing_cards')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', auth.userId);

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-update. Subukan muli.' } },
      { status: 500 }
    );
  }

  // ── Return updated card with items ──
  const { data: updatedCard } = await db
    .from('costing_cards')
    .select('*')
    .eq('id', id)
    .single();

  const { data: updatedItems } = await db
    .from('costing_card_items')
    .select('*')
    .eq('costing_card_id', id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  return NextResponse.json({
    success: true,
    data: { ...updatedCard, items: updatedItems ?? [] },
  });
}

// ============================================================
// DELETE — Soft-delete a costing card and its items
// ============================================================

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const auth = await getAuthUserId(supabase);
  if (auth.error) return auth.error;

  const db = SKIP_AUTH ? createServiceClient() : supabase;
  const now = new Date().toISOString();

  // Soft-delete the card
  const { error: deleteError } = await db
    .from('costing_cards')
    .update({ deleted_at: now })
    .eq('id', id)
    .eq('user_id', auth.userId)
    .is('deleted_at', null);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-delete. Subukan muli.' } },
      { status: 500 }
    );
  }

  // Soft-delete all items
  await db
    .from('costing_card_items')
    .update({ deleted_at: now })
    .eq('costing_card_id', id)
    .is('deleted_at', null);

  return NextResponse.json({ success: true, data: { id, deleted: true } });
}
