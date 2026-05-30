'use client'

// ============================================================
// CategoryBreakdownRow — Phase 8d "Bawat Kategorya" entry
// 56px min-height tap-friendly row: icon + name on the left, peso +
// percentage on the right, 6px progress bar below in the category color.
// ============================================================

import { EXPENSE_CATEGORIES } from '@/lib/expenses/categories'
import * as LucideIcons from 'lucide-react'
import Money from '@/components/ui/money'

// Banig (woven-mat) diagonal stripe overlay — the Warm Precision chart texture.
// Composited over the category fill via a layered background; the stripe is a
// translucent sampaguita-white so it reads on every category color.
const BANIG_STRIPE =
  'repeating-linear-gradient(45deg, hsl(var(--sampaguita) / 0.25) 0 2px, transparent 2px 4px)'

interface CategoryBreakdownRowProps {
  categoryKey: string
  totalCentavos: number
  /** Percentage of overall expenses (0..100). */
  percent: number
}

/** Lucide icons are PascalCase; the registry stores kebab-case identifiers. */
function lucideForKey(iconName: string): React.ComponentType<{ size?: number; className?: string }> {
  const pascal = iconName
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
  const Component = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[pascal]
  return Component ?? LucideIcons.Tag
}

export function CategoryBreakdownRow({ categoryKey, totalCentavos, percent }: CategoryBreakdownRowProps) {
  const def = EXPENSE_CATEGORIES.find((d) => d.key === categoryKey)
  const label = def?.label ?? categoryKey
  const colorClass = def?.color ?? 'bg-honey-deep'
  const Icon = lucideForKey(def?.icon ?? 'tag')
  const clampedPercent = Math.min(100, Math.max(0, percent))

  return (
    <div
      className="min-h-[56px] py-2.5 border-t border-outline-variant/[0.18] first:border-t-0"
      data-testid={`expenses-category-row-${categoryKey}`}
    >
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-7 h-7 rounded-full ${colorClass} bg-opacity-30 flex items-center justify-center flex-shrink-0`}
            aria-hidden
          >
            <Icon size={14} className="text-on-surface" />
          </span>
          <span className="text-[14px] font-semibold text-on-surface truncate">
            {label}
          </span>
        </div>
        <div className="flex items-baseline gap-2 flex-shrink-0">
          <Money centavos={totalCentavos} size="sm" countUp={false} />
          <span className="text-[11px] text-ink-soft tabular-nums">{clampedPercent.toFixed(0)}%</span>
        </div>
      </div>
      {/* Banig-textured progress bar in the category color (Warm Precision §4). */}
      <div className="h-1.5 rounded-full bg-surface-container-low overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full transition-[width] duration-500 motion-reduce:transition-none`}
          style={{ width: `${clampedPercent}%`, backgroundImage: BANIG_STRIPE }}
        />
      </div>
    </div>
  )
}

export default CategoryBreakdownRow
