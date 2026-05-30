'use client';

// ============================================================
// KpiTile — shared Warm Precision KPI cell for the home summary cards.
// Extracted verbatim from the identical private copies that lived in
// kuwento-card.tsx and monthly-reconciliation-card.tsx so the markup,
// props (label / centavos / testId / profit), and Money treatment stay
// in one place. The tubo (profit) tile uses the pale honey
// secondary-container fill and a signed figure; all others use the
// recessed surface-container-low fill.
// ============================================================

import Money from '@/components/ui/money';

interface KpiTileProps {
  label: string;
  centavos: number;
  testId: string;
  /** Tubo tile: pale honey secondary-container fill (Warm Precision). */
  profit?: boolean;
}

export default function KpiTile({ label, centavos, testId, profit }: KpiTileProps) {
  return (
    <div
      className={`rounded-xl px-3 py-2 text-center ${
        profit ? 'bg-secondary-container' : 'bg-surface-container-low'
      }`}
      data-testid={testId}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-on-surface-variant">
        {label}
      </p>
      <div className="mt-1">
        <Money centavos={centavos} size="md" signed={profit} />
      </div>
    </div>
  );
}
