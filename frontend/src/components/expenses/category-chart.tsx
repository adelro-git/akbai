'use client';

/**
 * Category Chart — horizontal bar chart showing expense breakdown by category.
 * No external chart library — pure CSS bars with design system tokens.
 * Numbers displayed with weight-800 per design system spec.
 */

import { centavosToPeso } from '@/lib/utils/money';
import { getCategoryDef, type CategoryDef } from '@/lib/expenses/categories';

interface CategoryData {
  category: string;
  total: number;   // centavos
  count: number;
}

interface CategoryChartProps {
  data: CategoryData[];
}

// Chart bar colors — cycling through design system tokens
const BAR_COLORS = [
  'bg-primary-container',
  'bg-tertiary-container',
  'bg-secondary-container',
  'bg-primary',
  'bg-tertiary',
  'bg-secondary',
  'bg-outline',
  'bg-primary-container/60',
  'bg-tertiary-container/60',
  'bg-outline-variant',
];

export default function CategoryChart({ data }: CategoryChartProps) {
  if (data.length === 0) return null;

  const maxAmount = Math.max(...data.map((d) => d.total));

  return (
    <div className="space-y-3" data-testid="category-chart">
      {data.map((item, idx) => {
        const catDef = getCategoryDef(item.category);
        const label = catDef?.label ?? item.category;
        const barWidth = maxAmount > 0 ? Math.max((item.total / maxAmount) * 100, 4) : 0;
        const barColor = BAR_COLORS[idx % BAR_COLORS.length];

        return (
          <div key={item.category} data-testid={`category-row-${item.category}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-on-surface text-xs font-semibold truncate mr-2">
                {label}
              </span>
              <span className="text-on-surface text-xs font-extrabold whitespace-nowrap">
                {centavosToPeso(item.total)}
              </span>
            </div>
            <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor} transition-all duration-300`}
                style={{ width: `${barWidth}%` }}
                role="meter"
                aria-valuenow={item.total}
                aria-valuemin={0}
                aria-valuemax={maxAmount}
                aria-label={`${label}: ${centavosToPeso(item.total)}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
