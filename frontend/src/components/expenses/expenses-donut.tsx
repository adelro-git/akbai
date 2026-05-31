'use client'

// ============================================================
// ExpensesDonut — Phase 8d Saan Napunta total card
// Recharts <PieChart><Pie> with custom centre label. Each slice
// uses the EXPENSE_CATEGORIES tailwind color resolved to a hex via
// CSS variables at runtime (Recharts SVG fills can't take Tailwind
// utility classes). Reduced-motion gates Recharts animation.
// ============================================================

import { useEffect, useId, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { EXPENSE_CATEGORIES } from '@/lib/expenses/categories'
import Money from '@/components/ui/money'

interface ExpensesDonutProps {
  /** Map of category-key → centavos. */
  categoryTotals: Array<{ key: string; total: number }>
  /** Total spend in centavos for the centre label. */
  totalCentavos: number
}

const DEFAULT_SLICE_HEX = '#855300'

/** Resolve `bg-honey-deep` → `hsl(...)` by reading the matching CSS var. */
function resolveBgColor(bgClass: string, fallback = DEFAULT_SLICE_HEX): string {
  if (typeof window === 'undefined') return fallback
  // Strip the `bg-` prefix → CSS var name maps to `--<token>`.
  const token = bgClass.replace(/^bg-/, '')
  const styles = getComputedStyle(document.documentElement)
  const value = styles.getPropertyValue(`--${token}`).trim()
  return value ? `hsl(${value})` : fallback
}

/**
 * Resolve a list of `bg-*` design-token classes to `hsl(...)` fills inside an
 * effect, so render stays SSR-stable (recharts SVG fills can't take Tailwind
 * classes). Mirrors `banig-bar-chart.tsx` `useResolvedVar`: returns the
 * fallback hex on the server / first client paint, then re-resolves on mount
 * and whenever the class list changes — no hydration mismatch.
 */
function useResolvedFills(bgClasses: string[]): string[] {
  // Join into a stable dependency so the effect only re-runs when the actual
  // set of classes changes (not on every render's fresh array reference).
  const key = bgClasses.join('|')
  const [fills, setFills] = useState<string[]>(() => bgClasses.map(() => DEFAULT_SLICE_HEX))
  useEffect(() => {
    if (typeof window === 'undefined') return
    setFills(bgClasses.map((c) => resolveBgColor(c)))
    // `key` captures the class list; bgClasses is derived from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return fills
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export function ExpensesDonut({ categoryTotals, totalCentavos }: ExpensesDonutProps) {
  const reducedMotion = usePrefersReducedMotion()
  const id = useId()

  const data = useMemo(() => {
    return categoryTotals
      .map((c) => {
        const def = EXPENSE_CATEGORIES.find((d) => d.key === c.key)
        return {
          key: c.key,
          label: def?.label ?? c.key,
          value: c.total,
          colorClass: def?.color ?? 'bg-honey-deep',
        }
      })
      .filter((d) => d.value > 0)
  }, [categoryTotals])

  // Resolve slice fills in an effect (SSR-stable) instead of calling
  // getComputedStyle during render, which caused a first-paint fill mismatch.
  const fills = useResolvedFills(data.map((d) => d.colorClass))

  if (data.length === 0) {
    return (
      <div
        className="w-[140px] h-[140px] rounded-full bg-surface-container-low flex items-center justify-center"
        data-testid="expenses-donut"
        data-empty="true"
      >
        <span className="text-[11px] text-ink-faint">Walang gastos</span>
      </div>
    )
  }

  return (
    <div className="relative" data-testid="expenses-donut">
      <div style={{ width: 140, height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="key"
              innerRadius={42}
              outerRadius={66}
              paddingAngle={2}
              stroke="none"
              isAnimationActive={!reducedMotion}
            >
              {data.map((d, i) => (
                <Cell key={`${id}-${i}`} fill={fills[i] ?? DEFAULT_SLICE_HEX} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="wp-label text-honey-deep">
          TOTAL
        </span>
        <span className="mt-0.5">
          <Money centavos={totalCentavos} size="md" />
        </span>
      </div>
    </div>
  )
}

export default ExpensesDonut
