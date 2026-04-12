'use client';

/**
 * CostingCardForm — Create/edit form for costing cards
 *
 * Uses useRef + onClick pattern (React 19 controlled input bug).
 * Money input in pesos, converted to centavos before API call.
 * Includes live margin preview as Maria edits items.
 */

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { pesoToCentavos } from '@/lib/utils/money';
import {
  calculateTotalCost,
  calculateSuggestedPrice,
  calculateActualMargin,
} from '@/lib/costing/calculations';
import type { CostingCardWithItems } from '@/lib/costing/types';
import ItemLineEditor, { type LineItem } from './item-line-editor';
import MarginDisplay from './margin-display';

// ─── Types ──────────────────────────────────────────────────────────

interface CostingCardFormProps {
  /** Existing card for edit mode; undefined for create */
  card?: CostingCardWithItems;
}

// ─── Component ──────────────────────────────────────────────────────

export default function CostingCardForm({ card }: CostingCardFormProps) {
  const router = useRouter();
  const isEdit = !!card;

  // ── Refs for header fields (React 19 controlled input bug) ──
  const nameRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const marginRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const fixedCostsRef = useRef<HTMLInputElement>(null);
  const yieldQtyRef = useRef<HTMLInputElement>(null);
  const yieldUnitRef = useRef<HTMLInputElement>(null);

  // ── Items state (dynamic rows need state) ──
  const [items, setItems] = useState<LineItem[]>(() => {
    if (card?.items.length) {
      return card.items.map((item) => ({
        id: item.id,
        item_name: item.item_name,
        item_type: item.item_type,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost_centavos: item.unit_cost_centavos,
      }));
    }
    return [{
      id: 'new-1',
      item_name: '',
      item_type: 'ingredient' as const,
      quantity: 1,
      unit: '',
      unit_cost_centavos: 0,
    }];
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Live margin preview ──
  const totalCost = calculateTotalCost(items);
  const liveMarginTarget = card?.target_margin_pct ?? 30;
  const liveSuggested = calculateSuggestedPrice(totalCost, liveMarginTarget);

  // Read selling price from ref for live margin (fallback to card value)
  const [liveSellingPrice, setLiveSellingPrice] = useState<number>(
    card?.selling_price_centavos ?? 0
  );
  const liveMargin = liveSellingPrice > 0
    ? calculateActualMargin(liveSellingPrice, totalCost)
    : null;

  const handlePriceBlur = useCallback(() => {
    const val = parseFloat(priceRef.current?.value ?? '0');
    setLiveSellingPrice(isNaN(val) || val < 0 ? 0 : pesoToCentavos(val));
  }, []);

  // ── Submit ──
  const handleSave = useCallback(async () => {
    setError(null);

    const productName = nameRef.current?.value?.trim() ?? '';
    if (!productName) {
      setError('Kailangan ng product name.');
      return;
    }

    const validItems = items.filter((i) => i.item_name.trim());
    if (validItems.length === 0) {
      setError('Kailangan ng kahit isang item na may pangalan.');
      return;
    }

    const targetMargin = parseFloat(marginRef.current?.value ?? '30');
    const sellingPeso = parseFloat(priceRef.current?.value ?? '0');
    const fixedPeso = parseFloat(fixedCostsRef.current?.value ?? '0');
    const yieldQty = parseInt(yieldQtyRef.current?.value ?? '1', 10);

    const payload = {
      product_name: productName,
      product_category: categoryRef.current?.value?.trim() || undefined,
      description: descRef.current?.value?.trim() || undefined,
      target_margin_pct: isNaN(targetMargin) ? 30 : targetMargin,
      selling_price_centavos: sellingPeso > 0 ? pesoToCentavos(sellingPeso) : undefined,
      monthly_fixed_costs_centavos: fixedPeso > 0 ? pesoToCentavos(fixedPeso) : undefined,
      yield_quantity: isNaN(yieldQty) || yieldQty < 1 ? 1 : yieldQty,
      yield_unit: yieldUnitRef.current?.value?.trim() || 'piece',
      items: validItems.map((item) => ({
        item_name: item.item_name,
        item_type: item.item_type,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost_centavos: item.unit_cost_centavos,
      })),
    };

    setSaving(true);

    try {
      const url = isEdit ? `/api/costing/${card.id}` : '/api/costing';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error?.message_tl ?? 'Hindi ma-save. Subukan muli.');
        return;
      }

      // Navigate to detail view or back to list
      router.push(`/costing/${json.data.id}`);
      router.refresh();
    } catch {
      setError('Hindi makapag-connect. I-check ang internet mo.');
    } finally {
      setSaving(false);
    }
  }, [items, isEdit, card?.id, router]);

  return (
    <div className="min-h-dvh pb-20 md:pb-6" data-testid="costing-card-form">
      {/* ── Header ── */}
      <header className="px-4 pt-5 pb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
          aria-label="Bumalik"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <h1 className="text-on-surface text-lg font-extrabold">
          {isEdit ? 'I-edit ang Costing Card' : 'Bagong Costing Card'}
        </h1>
      </header>

      {/* ── Live margin preview ── */}
      <div className="px-4 mb-4 flex justify-center">
        <MarginDisplay marginPct={liveMargin} size="md" />
      </div>

      {/* ── Form fields ── */}
      <div className="px-4 space-y-4">
        {/* Product name */}
        <FieldGroup label="Pangalan ng produkto" required>
          <input
            ref={nameRef}
            type="text"
            defaultValue={card?.product_name ?? ''}
            placeholder="hal. Chocolate Cake (8-inch)"
            className="w-full bg-surface-container-low rounded-xl px-3 py-2.5 text-on-surface text-sm min-h-[44px] placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container"
            data-testid="input-product-name"
          />
        </FieldGroup>

        {/* Category */}
        <FieldGroup label="Kategorya">
          <input
            ref={categoryRef}
            type="text"
            defaultValue={card?.product_category ?? ''}
            placeholder="hal. cakes, bread, ulam"
            className="w-full bg-surface-container-low rounded-xl px-3 py-2.5 text-on-surface text-sm min-h-[44px] placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container"
            data-testid="input-category"
          />
        </FieldGroup>

        {/* Description */}
        <FieldGroup label="Description">
          <textarea
            ref={descRef}
            defaultValue={card?.description ?? ''}
            placeholder="Ano ang produkto na ito? (optional)"
            rows={2}
            className="w-full bg-surface-container-low rounded-xl px-3 py-2.5 text-on-surface text-sm min-h-[44px] placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container resize-none"
            data-testid="input-description"
          />
        </FieldGroup>

        {/* ── Line items ── */}
        <ItemLineEditor items={items} onChange={setItems} />

        {/* ── Pricing section ── */}
        <div className="bg-surface-container-low rounded-2xl p-4 space-y-3">
          <p className="text-on-surface text-xs font-bold uppercase tracking-wider">
            Pricing
          </p>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Target margin (%)">
              <input
                ref={marginRef}
                type="number"
                defaultValue={card?.target_margin_pct ?? 30}
                step="1"
                min="0"
                max="99"
                className="w-full bg-surface-container-lowest rounded-xl px-3 py-2.5 text-on-surface text-sm text-center min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-container"
                data-testid="input-margin"
              />
            </FieldGroup>

            <FieldGroup label="Presyo mo (₱)">
              <input
                ref={priceRef}
                type="number"
                defaultValue={card?.selling_price_centavos ? (card.selling_price_centavos / 100).toFixed(2) : ''}
                placeholder="0.00"
                step="0.01"
                min="0"
                onBlur={handlePriceBlur}
                className="w-full bg-surface-container-lowest rounded-xl px-3 py-2.5 text-on-surface text-sm text-right min-h-[44px] placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container"
                data-testid="input-selling-price"
              />
            </FieldGroup>
          </div>

          {liveSuggested !== null && liveSuggested > 0 && (
            <p className="text-tertiary text-xs font-semibold text-center">
              Suggested price: ₱{(liveSuggested / 100).toFixed(2)}
            </p>
          )}
        </div>

        {/* ── Yield + Fixed costs ── */}
        <div className="bg-surface-container-low rounded-2xl p-4 space-y-3">
          <p className="text-on-surface text-xs font-bold uppercase tracking-wider">
            Yield at Fixed Costs
          </p>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Yield quantity">
              <input
                ref={yieldQtyRef}
                type="number"
                defaultValue={card?.yield_quantity ?? 1}
                min="1"
                step="1"
                className="w-full bg-surface-container-lowest rounded-xl px-3 py-2.5 text-on-surface text-sm text-center min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-container"
                data-testid="input-yield-qty"
              />
            </FieldGroup>

            <FieldGroup label="Yield unit">
              <input
                ref={yieldUnitRef}
                type="text"
                defaultValue={card?.yield_unit ?? 'piece'}
                placeholder="piece, slice, box"
                className="w-full bg-surface-container-lowest rounded-xl px-3 py-2.5 text-on-surface text-sm min-h-[44px] placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container"
                data-testid="input-yield-unit"
              />
            </FieldGroup>
          </div>

          <FieldGroup label="Monthly fixed costs (₱)">
            <input
              ref={fixedCostsRef}
              type="number"
              defaultValue={card?.monthly_fixed_costs_centavos ? (card.monthly_fixed_costs_centavos / 100).toFixed(2) : ''}
              placeholder="hal. renta, kuryente (optional)"
              step="0.01"
              min="0"
              className="w-full bg-surface-container-lowest rounded-xl px-3 py-2.5 text-on-surface text-sm min-h-[44px] placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container"
              data-testid="input-fixed-costs"
            />
          </FieldGroup>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-error-container rounded-xl p-3 text-center">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* ── Save button ── */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary-container text-on-primary font-semibold rounded-xl py-3 min-h-[44px] flex items-center justify-center gap-2 transition-colors hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="save-costing-btn"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sini-save...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {isEdit ? 'I-save ang changes' : 'I-save ang costing card'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Reusable field group ───────────────────────────────────────────

function FieldGroup({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-on-surface-variant text-xs font-semibold mb-1 block">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
