'use client';

/**
 * CostingSummary — Summary card showing total cost, suggested price, margin, break-even
 *
 * Displayed at the top of the costing card detail/edit view.
 * All monetary values arrive as integer centavos — display conversion here.
 */

import { centavosToPeso } from '@/lib/utils/money';
import MarginDisplay from './margin-display';

interface CostingSummaryProps {
  totalCostCentavos: number;
  suggestedPriceCentavos: number | null;
  sellingPriceCentavos: number | null;
  actualMarginPct: number | null;
  breakEvenQty: number | null;
  yieldQuantity: number;
  yieldUnit: string;
}

export default function CostingSummary({
  totalCostCentavos,
  suggestedPriceCentavos,
  sellingPriceCentavos,
  actualMarginPct,
  breakEvenQty,
  yieldQuantity,
  yieldUnit,
}: CostingSummaryProps) {
  const costPerUnit = yieldQuantity > 0
    ? Math.round(totalCostCentavos / yieldQuantity)
    : totalCostCentavos;

  return (
    <div
      className="bg-surface-container-low rounded-2xl p-4 space-y-4"
      data-testid="costing-summary"
    >
      {/* ── Margin indicator (hero position) ── */}
      <div className="flex justify-center">
        <MarginDisplay marginPct={actualMarginPct} size="lg" />
      </div>

      {/* ── Cost & price grid ── */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryItem
          label="Total na gastos"
          value={centavosToPeso(totalCostCentavos)}
          testId="summary-total-cost"
        />
        <SummaryItem
          label={`Gastos per ${yieldUnit}`}
          value={centavosToPeso(costPerUnit)}
          testId="summary-cost-per-unit"
        />
        <SummaryItem
          label="Suggested price"
          value={suggestedPriceCentavos !== null ? centavosToPeso(suggestedPriceCentavos) : '—'}
          testId="summary-suggested-price"
          highlight
        />
        <SummaryItem
          label="Presyo mo"
          value={sellingPriceCentavos !== null ? centavosToPeso(sellingPriceCentavos) : 'Hindi pa set'}
          testId="summary-selling-price"
        />
      </div>

      {/* ── Break-even ── */}
      {breakEvenQty !== null && (
        <div className="bg-surface-container-lowest rounded-xl p-3 text-center">
          <p className="text-on-surface-variant text-xs font-semibold">Break-even</p>
          <p className="text-on-surface text-lg font-extrabold" data-testid="summary-break-even">
            {breakEvenQty} {yieldUnit}{breakEvenQty !== 1 ? 's' : ''}
          </p>
          <p className="text-on-surface-variant text-xs">
            bago ka kumita sa fixed costs mo
          </p>
        </div>
      )}

      {/* ── Yield ── */}
      <div className="text-center">
        <p className="text-on-surface-variant text-xs">
          Yield: <span className="font-bold text-on-surface">{yieldQuantity} {yieldUnit}{yieldQuantity !== 1 ? 's' : ''}</span> per batch
        </p>
      </div>
    </div>
  );
}

// ── Reusable summary item ──

function SummaryItem({
  label,
  value,
  testId,
  highlight,
}: {
  label: string;
  value: string;
  testId: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center" data-testid={testId}>
      <p className="text-on-surface-variant text-xs font-semibold mb-0.5">{label}</p>
      <p className={`text-lg font-extrabold ${highlight ? 'text-tertiary' : 'text-on-surface'}`}>
        {value}
      </p>
    </div>
  );
}
