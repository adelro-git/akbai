import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { CreateCostingCardSchema } from '@/lib/costing/schemas';
import {
  calculateTotalCost,
  calculateItemTotalCost,
  calculateSuggestedPrice,
  calculateActualMargin,
  calculateBreakEven,
  calculateCostPerUnit,
} from '@/lib/costing/calculations';

// ============================================================
// Auth helper — returns userId or error response
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
// GET — List user's costing cards with item counts
// ============================================================

export async function GET() {
  const supabase = await createClient();
  const auth = await getAuthUserId(supabase);
  if (auth.error) return auth.error;

  const db = SKIP_AUTH ? createServiceClient() : supabase;

  const { data: cards, error: queryError } = await db
    .from('costing_cards')
    .select(`
      id, product_name, product_category, description,
      total_cost_centavos, selling_price_centavos, suggested_price_centavos,
      target_margin_pct, actual_margin_pct, break_even_qty,
      yield_quantity, yield_unit,
      created_at, updated_at,
      costing_card_items(id)
    `)
    .eq('user_id', auth.userId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi makuha ang mga costing card. Subukan muli.' } },
      { status: 500 }
    );
  }

  // Transform: add item_count, remove nested items array
  const result = (cards ?? []).map((card) => {
    const items = card.costing_card_items as { id: string }[] | null;
    const { costing_card_items: _omit, ...rest } = card;
    return { ...rest, item_count: items?.length ?? 0 };
  });

  return NextResponse.json({ success: true, data: result });
}

// ============================================================
// POST — Create a new costing card with line items
// ============================================================

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const auth = await getAuthUserId(supabase);
  if (auth.error) return auth.error;

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

  const parsed = CreateCostingCardSchema.safeParse(body);
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

  // ── Calculate derived fields ──
  const totalCost = calculateTotalCost(data.items);
  const targetMargin = data.target_margin_pct ?? 30; // default 30%
  const suggestedPrice = calculateSuggestedPrice(totalCost, targetMargin);
  const yieldQty = data.yield_quantity ?? 1;

  const actualMargin = data.selling_price_centavos
    ? calculateActualMargin(data.selling_price_centavos, totalCost)
    : null;

  const costPerUnit = calculateCostPerUnit(totalCost, yieldQty);
  const breakEvenQty = data.selling_price_centavos && data.monthly_fixed_costs_centavos
    ? calculateBreakEven(
        data.monthly_fixed_costs_centavos,
        data.selling_price_centavos,
        costPerUnit
      )
    : null;

  // ── Categorize item costs for header summary ──
  let overheadCentavos = 0;
  let laborCentavos = 0;
  let packagingCentavos = 0;

  for (const item of data.items) {
    const itemTotal = calculateItemTotalCost(item.quantity ?? 1, item.unit_cost_centavos);
    const type = item.item_type ?? 'ingredient';
    if (type === 'overhead') overheadCentavos += itemTotal;
    else if (type === 'labor') laborCentavos += itemTotal;
    else if (type === 'packaging') packagingCentavos += itemTotal;
  }

  // ── Insert costing card header ──
  const { data: card, error: cardError } = await db
    .from('costing_cards')
    .insert({
      user_id: auth.userId,
      product_name: data.product_name,
      product_category: data.product_category ?? null,
      description: data.description ?? null,
      total_cost_centavos: totalCost,
      overhead_centavos: overheadCentavos,
      labor_centavos: laborCentavos,
      packaging_centavos: packagingCentavos,
      selling_price_centavos: data.selling_price_centavos ?? null,
      suggested_price_centavos: suggestedPrice,
      target_margin_pct: targetMargin,
      actual_margin_pct: actualMargin,
      break_even_qty: breakEvenQty,
      monthly_fixed_costs_centavos: data.monthly_fixed_costs_centavos ?? 0,
      yield_quantity: yieldQty,
      yield_unit: data.yield_unit ?? 'piece',
    })
    .select('id')
    .single();

  if (cardError || !card) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-save ang costing card. Subukan muli.' } },
      { status: 500 }
    );
  }

  // ── Insert line items ──
  const itemRows = data.items.map((item, idx) => ({
    user_id: auth.userId,
    costing_card_id: card.id,
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
    // Clean up the header if items fail
    await db.from('costing_cards').delete().eq('id', card.id);
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message_tl: 'Hindi ma-save ang mga items. Subukan muli.' } },
      { status: 500 }
    );
  }

  // ── Fetch the complete card with items ──
  const { data: fullCard } = await db
    .from('costing_cards')
    .select('*')
    .eq('id', card.id)
    .single();

  const { data: fullItems } = await db
    .from('costing_card_items')
    .select('*')
    .eq('costing_card_id', card.id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  return NextResponse.json(
    { success: true, data: { ...fullCard, items: fullItems ?? [] } },
    { status: 201 }
  );
}
