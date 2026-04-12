'use client';

/**
 * Scan Results — Editable OCR extraction display
 * Feature: Resibo Scanner (Build 3)
 * Role: Shows parsed receipt fields after OCR. Each field is editable
 *       so the user can correct mistakes before saving as a transaction.
 *       Includes category selector and confidence badges per field.
 *
 * Flow: Display parsed data -> user edits -> confirm -> onSave callback
 *
 * Dependencies: ReceiptParseResult (lib/ocr/types), expense categories,
 *               ConfidenceBadge component, centavosToPeso/pesoToCentavos
 * Design: useRef + onClick (React 19 bug), design system tokens, 44px touch targets
 */

import { useRef, useState, useCallback } from 'react';
import { Save, X, ChevronDown } from 'lucide-react';
import type { ReceiptParseResult } from '@/lib/ocr/types';
import { EXPENSE_CATEGORIES } from '@/lib/expenses/categories';
import { centavosToPeso, pesoToCentavos } from '@/lib/utils/money';
import { ConfidenceBadge } from './confidence-badge';

// ============================================================
// Types
// ============================================================

/** Data shape sent to the save handler after user edits */
export interface EditedScanData {
  merchant_name: string;
  transaction_date: string;
  amount: number; // centavos
  category: string;
  description: string;
  receipt_hash: string | null;
}

interface ScanResultsProps {
  /** Parsed OCR result from the API */
  data: ReceiptParseResult;
  /** Receipt hash from dedup check (if available) */
  receiptHash: string | null;
  /** Called when user confirms and saves the edited data */
  onSave: (editedData: EditedScanData) => void;
  /** Called when user cancels (discards the scan) */
  onCancel: () => void;
}

// ============================================================
// Helpers
// ============================================================

/** Extract string value from a ReceiptField, defaulting to empty string */
function fieldString(value: string | number | null): string {
  if (value === null) return '';
  return String(value);
}

/** Extract number value from a ReceiptField (centavos), defaulting to 0 */
function fieldCentavos(value: string | number | null): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/** Convert centavos to peso display string for input (without peso sign) */
function centavosToInputPeso(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

// ============================================================
// Component
// ============================================================

export function ScanResults({ data, receiptHash, onSave, onCancel }: ScanResultsProps) {
  const { fields } = data;

  // --- Editable state initialized from OCR results ---
  const [merchant, setMerchant] = useState(fieldString(fields.merchant.value));
  const [date, setDate] = useState(fieldString(fields.date.value));
  const [amountPeso, setAmountPeso] = useState(centavosToInputPeso(fieldCentavos(fields.total.value)));
  const [category, setCategory] = useState('other_expense');
  const [description, setDescription] = useState('');
  const [showCategories, setShowCategories] = useState(false);

  // --- Refs for input values (React 19 controlled input bug) ---
  const merchantRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // ============================================================
  // Sync refs -> state on blur (React 19 workaround)
  // ============================================================

  const syncMerchant = useCallback(() => {
    if (merchantRef.current) setMerchant(merchantRef.current.value);
  }, []);

  const syncDate = useCallback(() => {
    if (dateRef.current) setDate(dateRef.current.value);
  }, []);

  const syncAmount = useCallback(() => {
    if (amountRef.current) setAmountPeso(amountRef.current.value);
  }, []);

  const syncDescription = useCallback(() => {
    if (descriptionRef.current) setDescription(descriptionRef.current.value);
  }, []);

  // ============================================================
  // Category Selection
  // ============================================================

  const handleCategorySelect = useCallback((key: string) => {
    setCategory(key);
    setShowCategories(false);
  }, []);

  const selectedCategory = EXPENSE_CATEGORIES.find((c) => c.key === category);

  // ============================================================
  // Save Handler
  // ============================================================

  const handleSave = useCallback(() => {
    // Read final values from refs (React 19 bug workaround)
    const finalMerchant = merchantRef.current?.value ?? merchant;
    const finalDate = dateRef.current?.value ?? date;
    const finalAmountStr = amountRef.current?.value ?? amountPeso;
    const finalDescription = descriptionRef.current?.value ?? description;

    const amountCentavos = pesoToCentavos(parseFloat(finalAmountStr) || 0);

    onSave({
      merchant_name: finalMerchant,
      transaction_date: finalDate,
      amount: amountCentavos,
      category,
      description: finalDescription,
      receipt_hash: receiptHash,
    });
  }, [merchant, date, amountPeso, description, category, receiptHash, onSave]);

  // ============================================================
  // Items Display
  // ============================================================

  const hasItems = fields.items && fields.items.length > 0;

  return (
    <div className="w-full space-y-4" data-testid="scan-results">
      {/* --- Header --- */}
      <div className="text-center">
        <p className="text-on-surface font-semibold text-base">
          Ito ang nakita ko sa resibo mo
        </p>
        <p className="text-on-surface-variant text-sm">
          I-check kung tama lahat bago natin i-save
        </p>
      </div>

      {/* --- Editable Fields Card --- */}
      <div className="bg-surface-container-low rounded-2xl p-4 space-y-4">
        {/* Merchant Name */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
              Tindahan
            </label>
            <ConfidenceBadge level={fields.merchant.confidence} />
          </div>
          <input
            ref={merchantRef}
            type="text"
            defaultValue={merchant}
            onBlur={syncMerchant}
            placeholder="Pangalan ng tindahan"
            className="w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-container min-h-[44px]"
            data-testid="merchant-input"
          />
        </div>

        {/* Date */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
              Petsa
            </label>
            <ConfidenceBadge level={fields.date.confidence} />
          </div>
          <input
            ref={dateRef}
            type="date"
            defaultValue={date}
            onBlur={syncDate}
            className="w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-on-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-container min-h-[44px]"
            data-testid="date-input"
          />
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
              Total
            </label>
            <ConfidenceBadge level={fields.total.confidence} />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-extrabold text-sm">
              &#8369;
            </span>
            <input
              ref={amountRef}
              type="number"
              step="0.01"
              min="0"
              defaultValue={amountPeso}
              onBlur={syncAmount}
              placeholder="0.00"
              className="w-full bg-surface-container-lowest rounded-lg pl-8 pr-3 py-2.5 text-on-surface text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-primary-container min-h-[44px]"
              data-testid="amount-input"
            />
          </div>
        </div>

        {/* Category Selector */}
        <div>
          <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1 block">
            Category
          </label>
          <button
            type="button"
            onClick={() => setShowCategories(!showCategories)}
            className="flex items-center justify-between w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-on-surface text-sm font-medium min-h-[44px]"
            data-testid="category-selector"
          >
            <span>{selectedCategory?.label ?? 'Pumili ng category'}</span>
            <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform ${showCategories ? 'rotate-180' : ''}`} />
          </button>

          {/* Category Dropdown */}
          {showCategories && (
            <div
              className="mt-1 bg-surface-container-lowest rounded-lg shadow-[0_4px_40px_rgba(133,83,0,0.08)] max-h-48 overflow-y-auto"
              data-testid="category-dropdown"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleCategorySelect(cat.key)}
                  className={`w-full text-left px-3 py-2.5 text-sm min-h-[44px] transition-colors ${
                    cat.key === category
                      ? 'bg-primary-container/10 text-primary font-semibold'
                      : 'text-on-surface hover:bg-surface-container-low'
                  }`}
                  data-testid={`category-option-${cat.key}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description / Notes */}
        <div>
          <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-1 block">
            Notes (optional)
          </label>
          <textarea
            ref={descriptionRef}
            defaultValue={description}
            onBlur={syncDescription}
            placeholder="Dagdag na detalye tungkol sa resibo"
            rows={2}
            className="w-full bg-surface-container-lowest rounded-lg px-3 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-container resize-none"
            data-testid="description-input"
          />
        </div>
      </div>

      {/* --- Line Items (read-only display) --- */}
      {hasItems && (
        <div className="bg-surface-container-low rounded-2xl p-4">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">
            Mga Items
          </p>
          <div className="space-y-2">
            {fields.items!.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-on-surface font-medium truncate block">
                    {item.name}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-on-surface-variant text-xs">
                      {item.quantity}x @ {centavosToPeso(item.unitPrice)}
                    </span>
                  )}
                </div>
                <span className="text-on-surface font-extrabold ml-2">
                  {centavosToPeso(item.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Action Buttons --- */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center gap-2 flex-1 min-h-[44px] bg-surface-container-high text-on-surface font-semibold rounded-xl py-3"
          data-testid="cancel-save-btn"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center justify-center gap-2 flex-[2] min-h-[44px] bg-primary-container text-on-primary font-semibold rounded-xl py-3 transition-opacity hover:opacity-90 active:scale-[0.98]"
          data-testid="save-btn"
        >
          <Save className="w-4 h-4" />
          I-save ang resibo
        </button>
      </div>
    </div>
  );
}

export default ScanResults;
