'use client';

/**
 * CostingSummary — Summary card showing total cost, suggested price, margin, break-even
 *
 * Displayed at the top of the costing card detail/edit view.
 * All monetary values arrive as integer centavos — display conversion here.
 */

import type { ReactNode } from 'react';
import Money from '@/components/ui/money';
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
          valueNode={<Money centavos={totalCostCentavos} size="md" />}
          testId="summary-total-cost"
        />
        <SummaryItem
          label={`Gastos per ${yieldUnit}`}
          valueNode={<Money centavos={costPerUnit} size="md" />}
          testId="summary-cost-per-unit"
        />
        <SummaryItem
          label="Suggested price"
          valueNode={
            suggestedPriceCentavos !== null ? (
              <Money centavos={suggestedPriceCentavos} size="md" />
            ) : undefined
          }
          value="—"
          testId="summary-suggested-price"
        />
        <SummaryItem
          label="Presyo mo"
          valueNode={
            sellingPriceCentavos !== null ? (
              <Money centavos={sellingPriceCentavos} size="md" />
            ) : undefined
          }
          value="Hindi pa set"
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
  valueNode,
  testId,
}: {
  label: string;
  /** Fallback string (placeholders like "—" / "Hindi pa set"). */
  value?: string;
  /** Preferred render: a <Money> node for real amounts (teal, tabular). */
  valueNode?: ReactNode;
  testId: string;
}) {
  return (
    <div className="text-center" data-testid={testId}>
      <p className="text-on-surface-variant text-xs font-semibold mb-0.5">{label}</p>
      {valueNode ? (
        <p>{valueNode}</p>
      ) : (
        <p className="text-lg font-extrabold text-on-surface">{value}</p>
      )}
    </div>
  );
}
