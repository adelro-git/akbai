'use client';

/**
 * Category Chart — stacked bar showing expense breakdown as % of total gastos.
 * Single bar with colored segments + legend below.
 * No external chart library — pure CSS. Zero bundle cost.
 */

import Money from '@/components/ui/money';
import { getCategoryDef } from '@/lib/expenses/categories';

interface CategoryData {
  category: string;
  total: number;   // centavos
  count: number;
}

interface CategoryChartProps {
  data: CategoryData[];
}

// Segment colors — design system tokens.
// Warm Precision W1 role-change turned tertiary-container (#cdeee2) and
// secondary-container (#fef3d9) into near-white pale fills, which rendered
// invisible as chart segments. Replaced with saturated chart-contrast tokens.
// Every entry resolves to a DISTINCT hex (verified vs globals.css :root) so no
// two categories ever render an indistinguishable segment — the previous set
// aliased honey↔primary-container (#f59e0b) and sage-deep↔tertiary (#006b54).
const SEGMENT_COLORS = [
  'bg-honey',              // #f59e0b — saturated honey
  'bg-tertiary',           // #006b54 — deep teal
  'bg-primary',            // #855300 — dark brown
  'bg-sage',               // #5fb89a — mid sage
  'bg-secondary',          // #904d00 — burnt amber
  'bg-primary-fixed-dim',  // #ffb95f — light honey
  'bg-outline',            // #867461 — warm taupe
  'bg-warning',            // #FBBF24 — amber
  'bg-error-fill',         // #F87171 — soft red
  'bg-honey-bright',       // #f5b347 — bright honey
];

export default function CategoryChart({ data }: CategoryChartProps) {
  if (data.length === 0) return null;

  const grandTotal = data.reduce((sum, d) => sum + d.total, 0);
  if (grandTotal === 0) return null;

  // Compute percentages
  const segments = data.map((item, idx) => {
    const pct = Math.round((item.total / grandTotal) * 100);
    return {
      ...item,
      percentage: pct,
      color: SEGMENT_COLORS[idx % SEGMENT_COLORS.length],
      label: getCategoryDef(item.category)?.label ?? item.category,
    };
  });

  // Fix rounding so segments sum to 100%
  const pctSum = segments.reduce((s, seg) => s + seg.percentage, 0);
  if (pctSum !== 100 && segments.length > 0) {
    segments[0].percentage += 100 - pctSum;
  }

  return (
    <div data-testid="category-chart">
      {/* Stacked bar */}
      <div
        className="flex h-5 rounded-full overflow-hidden bg-surface-container-high"
        role="img"
        aria-label="Expense breakdown by category"
      >
        {segments.map((seg) => (
          <div
            key={seg.category}
            className={`${seg.color} transition-all duration-300`}
            style={{ width: `${seg.percentage}%`, minWidth: seg.percentage > 0 ? '4px' : '0' }}
            title={`${seg.label}: ${seg.percentage}%`}
            data-testid={`segment-${seg.category}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 space-y-2">
        {segments.map((seg) => (
          <div
            key={seg.category}
            className="flex items-center justify-between"
            data-testid={`category-row-${seg.category}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full ${seg.color} flex-shrink-0`} />
              <span className="text-on-surface text-xs font-semibold truncate">
                {seg.label}
              </span>
              <span className="text-on-surface-variant text-[10px]">
                {seg.percentage}%
              </span>
            </div>
            <span className="ml-2">
              <Money centavos={seg.total} size="sm" countUp={false} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
