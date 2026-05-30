'use client';

/**
 * ItemLineEditor — Dynamic line item editor for costing cards
 *
 * Lets Maria add/remove/edit cost line items (ingredients, labor, overhead, packaging).
 * Uses useRef + onClick pattern (React 19 controlled input bug).
 * All costs in centavos — peso input converted on blur.
 */

import { useRef, useCallback } from 'react';
import { Trash2, Plus } from 'lucide-react';
import type { CostingCardItemType } from '@/lib/costing/types';
import { pesoToCentavos } from '@/lib/utils/money';
import Money from '@/components/ui/money';
import { calculateItemTotalCost } from '@/lib/costing/calculations';

// ─── Types ──────────────────────────────────────────────────────────

export interface LineItem {
  id: string;
  item_name: string;
  item_type: CostingCardItemType;
  quantity: number;
  unit: string;
  unit_cost_centavos: number;
}

interface ItemLineEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

const ITEM_TYPES: { value: CostingCardItemType; label: string }[] = [
  { value: 'ingredient', label: 'Ingredient' },
  { value: 'labor', label: 'Labor' },
  { value: 'overhead', label: 'Overhead' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'other', label: 'Iba pa' },
];

// ─── Component ──────────────────────────────────────────────────────

export default function ItemLineEditor({ items, onChange }: ItemLineEditorProps) {
  const nextIdRef = useRef(items.length + 1);

  const addItem = useCallback(() => {
    const newItem: LineItem = {
      id: `new-${nextIdRef.current++}`,
      item_name: '',
      item_type: 'ingredient',
      quantity: 1,
      unit: '',
      unit_cost_centavos: 0,
    };
    onChange([...items, newItem]);
  }, [items, onChange]);

  const removeItem = useCallback((itemId: string) => {
    if (items.length <= 1) return; // at least 1 item required
    onChange(items.filter((i) => i.id !== itemId));
  }, [items, onChange]);

  const updateItem = useCallback((itemId: string, field: keyof LineItem, value: string | number) => {
    onChange(
      items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  }, [items, onChange]);

  const totalCost = items.reduce(
    (sum, item) => sum + calculateItemTotalCost(item.quantity, item.unit_cost_centavos),
    0
  );

  return (
    <div data-testid="item-line-editor">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-on-surface text-xs font-bold uppercase tracking-wider">
          Mga Gastos
        </p>
        <p className="inline-flex items-baseline gap-1.5 text-on-surface-variant text-xs font-semibold">
          Total: <Money centavos={totalCost} size="sm" countUp={false} />
        </p>
      </div>

      {/* ── Line items ── */}
      <div className="space-y-3">
        {items.map((item, idx) => (
          <ItemRow
            key={item.id}
            item={item}
            index={idx}
            canDelete={items.length > 1}
            onUpdate={updateItem}
            onRemove={removeItem}
          />
        ))}
      </div>

      {/* ── Add button ── */}
      <button
        type="button"
        onClick={addItem}
        className="mt-3 w-full flex items-center justify-center gap-1.5 bg-surface-container-low text-on-surface-variant text-sm font-semibold rounded-xl py-2.5 min-h-[44px] transition-colors hover:bg-surface-container"
        data-testid="add-item-btn"
      >
        <Plus className="w-4 h-4" />
        Mag-add ng item
      </button>
    </div>
  );
}

// ─── Individual Item Row ────────────────────────────────────────────

function ItemRow({
  item,
  index,
  canDelete,
  onUpdate,
  onRemove,
}: {
  item: LineItem;
  index: number;
  canDelete: boolean;
  onUpdate: (id: string, field: keyof LineItem, value: string | number) => void;
  onRemove: (id: string) => void;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const unitRef = useRef<HTMLInputElement>(null);
  const costRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);

  const handleBlur = useCallback((field: keyof LineItem) => {
    switch (field) {
      case 'item_name':
        if (nameRef.current) onUpdate(item.id, 'item_name', nameRef.current.value);
        break;
      case 'quantity': {
        const val = parseFloat(qtyRef.current?.value ?? '1');
        onUpdate(item.id, 'quantity', isNaN(val) || val <= 0 ? 1 : val);
        break;
      }
      case 'unit':
        if (unitRef.current) onUpdate(item.id, 'unit', unitRef.current.value);
        break;
      case 'unit_cost_centavos': {
        const peso = parseFloat(costRef.current?.value ?? '0');
        onUpdate(item.id, 'unit_cost_centavos', isNaN(peso) || peso < 0 ? 0 : pesoToCentavos(peso));
        break;
      }
      case 'item_type':
        if (typeRef.current) onUpdate(item.id, 'item_type', typeRef.current.value as CostingCardItemType);
        break;
    }
  }, [item.id, onUpdate]);

  const itemTotal = calculateItemTotalCost(item.quantity, item.unit_cost_centavos);

  return (
    <div
      className="bg-surface-container-lowest rounded-xl p-3 space-y-2"
      data-testid={`item-row-${index}`}
    >
      {/* Row 1: Name + Delete */}
      <div className="flex items-center gap-2">
        <input
          ref={nameRef}
          type="text"
          defaultValue={item.item_name}
          placeholder="Pangalan ng item"
          onBlur={() => handleBlur('item_name')}
          className="flex-1 bg-surface-container-low rounded-lg px-3 py-2 text-on-surface text-sm min-h-[44px] placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container"
          data-testid={`item-name-${index}`}
        />
        {canDelete && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={`I-remove ang ${item.item_name || 'item'}`}
            data-testid={`remove-item-${index}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Row 2: Type + Qty + Unit + Cost */}
      <div className="grid grid-cols-[1fr_0.6fr_0.6fr_1fr] gap-2">
        <select
          ref={typeRef}
          defaultValue={item.item_type}
          onChange={() => handleBlur('item_type')}
          className="bg-surface-container-low rounded-lg px-2 py-2 text-on-surface text-xs min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-container"
          data-testid={`item-type-${index}`}
        >
          {ITEM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <input
          ref={qtyRef}
          type="number"
          defaultValue={item.quantity}
          placeholder="Qty"
          step="0.01"
          min="0.01"
          onBlur={() => handleBlur('quantity')}
          className="bg-surface-container-low rounded-lg px-2 py-2 text-on-surface text-xs text-center min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-container"
          data-testid={`item-qty-${index}`}
        />

        <input
          ref={unitRef}
          type="text"
          defaultValue={item.unit}
          placeholder="Unit"
          onBlur={() => handleBlur('unit')}
          className="bg-surface-container-low rounded-lg px-2 py-2 text-on-surface text-xs text-center min-h-[44px] placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container"
          data-testid={`item-unit-${index}`}
        />

        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">₱</span>
          <input
            ref={costRef}
            type="number"
            defaultValue={(item.unit_cost_centavos / 100).toFixed(2)}
            placeholder="0.00"
            step="0.01"
            min="0"
            onBlur={() => handleBlur('unit_cost_centavos')}
            className="w-full bg-surface-container-low rounded-lg pl-5 pr-2 py-2 text-on-surface text-xs text-right min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-container"
            data-testid={`item-cost-${index}`}
          />
        </div>
      </div>

      {/* Row 3: Line total */}
      <div className="flex justify-end">
        <span className="inline-flex items-baseline gap-1 text-on-surface-variant text-xs">
          = <Money centavos={itemTotal} size="sm" countUp={false} />
        </span>
      </div>
    </div>
  );
}
