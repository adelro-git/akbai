'use client';

/**
 * Line Item Editor — add/remove/edit invoice line items
 * Feature: Invoice Cards (Build 8)
 * Role: Dynamic form for managing invoice line items with running totals
 *
 * Uses useRef + onClick pattern (React 19 controlled input bug).
 * All prices entered in pesos, converted to centavos for API.
 *
 * Dependencies: money.ts (centavosToPeso, pesoToCentavos)
 */

import { useRef, useCallback, useEffect, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { pesoToCentavos } from '@/lib/utils/money';
import Money from '@/components/ui/money';

// ============================================================
// Types
// ============================================================

export interface LineItemData {
  /**
   * Stable client-side identity for React reconciliation. Optional on the
   * public API (the API payload never uses it) — the editor backfills one
   * for any item that arrives without it (see `ensureIds`). Using a stable
   * id as the list key (instead of the array index) is what stops a removed
   * middle row's uncontrolled-input text from bleeding into the row that
   * shifts up into its old index.
   */
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price_centavos: number;
  costing_card_id?: string;
}

interface LineItemEditorProps {
  items: LineItemData[];
  onItemsChange: (items: LineItemData[]) => void;
}

// ============================================================
// Stable id helpers
// ============================================================

/** Monotonic counter fallback for environments without crypto.randomUUID. */
let lineItemIdCounter = 0;

/** Generate a stable, collision-resistant line-item id. */
function newLineItemId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  lineItemIdCounter += 1;
  return `li-${Date.now().toString(36)}-${lineItemIdCounter}`;
}

/**
 * Return `items` guaranteed to each carry an `id`. If every item already has
 * one, the SAME array reference is returned (so callers can cheaply detect a
 * no-op and avoid an extra render/state write).
 */
export function ensureIds(items: LineItemData[]): LineItemData[] {
  if (items.every((item) => item.id)) return items;
  return items.map((item) => (item.id ? item : { ...item, id: newLineItemId() }));
}

// ============================================================
// Single Line Item Row
// ============================================================

interface LineItemRowProps {
  item: LineItemData;
  index: number;
  onUpdate: (index: number, item: LineItemData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

function LineItemRow({ item, index, onUpdate, onRemove, canRemove }: LineItemRowProps) {
  const descRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const unitRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  const lineTotal = item.unit_price_centavos * item.quantity;

  const handleBlur = useCallback(() => {
    const description = descRef.current?.value ?? item.description;
    const quantity = parseFloat(qtyRef.current?.value ?? '') || item.quantity;
    const unit = unitRef.current?.value ?? item.unit;
    const priceVal = parseFloat(priceRef.current?.value ?? '');
    const unit_price_centavos = isNaN(priceVal) ? item.unit_price_centavos : pesoToCentavos(priceVal);

    // Preserve the row's stable id (and costing_card_id) so reconciliation
    // by identity keeps holding after an edit.
    onUpdate(index, {
      ...item,
      description,
      quantity,
      unit,
      unit_price_centavos,
    });
  }, [index, item, onUpdate]);

  return (
    <div className="bg-surface-container-lowest rounded-xl p-3 space-y-2" data-testid={`line-item-${index}`}>
      {/* Description */}
      <div>
        <label className="text-on-surface-variant text-xs font-semibold block mb-1">
          Item
        </label>
        <input
          ref={descRef}
          type="text"
          defaultValue={item.description}
          onBlur={handleBlur}
          placeholder="e.g., Chocolate Cake 8-inch"
          className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container min-h-[44px]"
          data-testid={`line-item-desc-${index}`}
        />
      </div>

      {/* Quantity + Unit + Price row */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-on-surface-variant text-xs font-semibold block mb-1">
            Qty
          </label>
          <input
            ref={qtyRef}
            type="number"
            defaultValue={item.quantity}
            onBlur={handleBlur}
            min="0.001"
            step="any"
            className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container min-h-[44px]"
            data-testid={`line-item-qty-${index}`}
          />
        </div>
        <div>
          <label className="text-on-surface-variant text-xs font-semibold block mb-1">
            Unit
          </label>
          <input
            ref={unitRef}
            type="text"
            defaultValue={item.unit}
            onBlur={handleBlur}
            placeholder="piece"
            className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container min-h-[44px]"
            data-testid={`line-item-unit-${index}`}
          />
        </div>
        <div>
          <label className="text-on-surface-variant text-xs font-semibold block mb-1">
            Price (₱)
          </label>
          <input
            ref={priceRef}
            type="number"
            defaultValue={(item.unit_price_centavos / 100).toFixed(2)}
            onBlur={handleBlur}
            min="0"
            step="0.01"
            className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container min-h-[44px]"
            data-testid={`line-item-price-${index}`}
          />
        </div>
      </div>

      {/* Line total + remove */}
      <div className="flex items-center justify-between pt-1">
        <Money centavos={lineTotal} size="sm" countUp={false} />
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="text-destructive p-2 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
            type="button"
            aria-label="Alisin ang item"
            data-testid={`line-item-remove-${index}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main Editor Component
// ============================================================

export default function LineItemEditor({ items, onItemsChange }: LineItemEditorProps) {
  // Reconcile by stable id, never by array index. Items may arrive without an
  // id (e.g. initialData from an edited invoice), so we backfill once and push
  // the id-bearing array back up to the parent state in an effect — after that
  // the parent is the single source of truth and ids stay stable across
  // add/remove/edit.
  const normalized = useMemo(() => ensureIds(items), [items]);

  useEffect(() => {
    if (normalized !== items) onItemsChange(normalized);
    // Only re-sync when the incoming `items` reference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized]);

  const subtotal = normalized.reduce(
    (sum, item) => sum + item.unit_price_centavos * item.quantity,
    0
  );

  const handleUpdate = useCallback((index: number, updatedItem: LineItemData) => {
    const newItems = [...normalized];
    newItems[index] = updatedItem;
    onItemsChange(newItems);
  }, [normalized, onItemsChange]);

  const handleRemove = useCallback((index: number) => {
    const newItems = normalized.filter((_, i) => i !== index);
    onItemsChange(newItems);
  }, [normalized, onItemsChange]);

  const handleAdd = useCallback(() => {
    onItemsChange([
      ...normalized,
      { id: newLineItemId(), description: '', quantity: 1, unit: 'piece', unit_price_centavos: 0 },
    ]);
  }, [normalized, onItemsChange]);

  return (
    <div className="space-y-3" data-testid="line-item-editor">
      <div className="flex items-center justify-between">
        <h3 className="text-on-surface text-xs font-bold uppercase tracking-wider">
          Mga Item
        </h3>
        <span className="inline-flex items-baseline gap-1.5 text-on-surface-variant text-xs">
          Subtotal: <Money centavos={subtotal} size="sm" countUp={false} />
        </span>
      </div>

      {/* Item rows — keyed by stable id so React reconciles by identity, not
          index. Removing a middle row no longer reuses an uncontrolled input
          for a different item. */}
      <div className="space-y-2">
        {normalized.map((item, index) => (
          <LineItemRow
            key={item.id}
            item={item}
            index={index}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
            canRemove={normalized.length > 1}
          />
        ))}
      </div>

      {/* Add item button */}
      <button
        onClick={handleAdd}
        className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold py-2.5 min-h-[44px]"
        type="button"
        data-testid="add-line-item"
      >
        <Plus className="w-4 h-4" />
        Dagdagan ng item
      </button>
    </div>
  );
}
