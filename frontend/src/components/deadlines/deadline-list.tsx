'use client'

// ============================================================
// DeadlineList — Phase 9b ADOPT HANDOFF (A5)
// Replaces the old grouped-status layout with a single tonally-
// layered list. Pre-deadline Kai paper-note appears when any
// deadline is ≤ 7 days. Each row taps through to chat with the
// ADR-017 deeplink contract.
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import type { DeadlineWithUrgency } from '@/lib/deadlines/types'
import DeadlineRow from './deadline-row'
import DeadlineEmpty from './deadline-empty'
import DeadlinePreCallout from './deadline-pre-callout'

interface DeadlineListProps {
  /**
   * Sprint 16: optional callback invoked after each fetch with whether the
   * user has at least one upcoming deadline within 14 days. The /deadlines
   * page consumes this signal to decide whether to render the native push
   * deferred-prompt card (architect §3 Open Q 2 recommendation (a)).
   */
  onImminentDeadlineSignal?: (hasImminentDeadline: boolean) => void
}

export default function DeadlineList({ onImminentDeadlineSignal }: DeadlineListProps = {}) {
  const [deadlines, setDeadlines] = useState<DeadlineWithUrgency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeadlines = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/deadlines')
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error?.message_tl ?? 'Hindi ko ma-load ang deadlines, boss. I-try mo ulit?')
        return
      }
      setDeadlines(json.data.deadlines as DeadlineWithUrgency[])
    } catch {
      setError('Hindi ko ma-load ang deadlines, boss. I-try mo ulit?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDeadlines()
  }, [fetchDeadlines])

  // Sort: not-yet-filed first, by days_until ascending; filed last.
  const sorted = useMemo(() => {
    const active = deadlines.filter((d) => d.status !== 'filed')
    const filed = deadlines.filter((d) => d.status === 'filed')
    active.sort((a, b) => a.days_until - b.days_until)
    filed.sort((a, b) => a.due_date.localeCompare(b.due_date))
    return [...active, ...filed]
  }, [deadlines])

  // Most-imminent ≤ 7 day deadline drives the Kai pre-deadline callout.
  const calloutDeadline = useMemo(() => {
    return sorted.find(
      (d) => d.status !== 'filed' && d.days_until >= -30 && d.days_until <= 7
    ) ?? null
  }, [sorted])

  // Next-due id (the first non-filed row gets the subtle honey left-edge bar).
  const nextDueId = useMemo(() => {
    return sorted.find((d) => d.status !== 'filed')?.id ?? null
  }, [sorted])

  // Sprint 16: surface "any non-filed deadline due within 14 days" so the
  // parent page can mount the native-push deferred-prompt card. Recomputes
  // every time `sorted` changes (post-fetch); a single useEffect calls the
  // callback so React doesn't trigger setState-during-render warnings.
  const hasImminentDeadline = useMemo(() => {
    return sorted.some(
      (d) => d.status !== 'filed' && d.days_until >= 0 && d.days_until <= 14
    )
  }, [sorted])

  useEffect(() => {
    if (loading) return
    onImminentDeadlineSignal?.(hasImminentDeadline)
  }, [hasImminentDeadline, loading, onImminentDeadlineSignal])

  // ── Loading
  if (loading) {
    return (
      <div className="flex flex-col gap-3" data-testid="deadline-loading">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-2xl bg-surface-container-low animate-pulse motion-reduce:animate-none"
          />
        ))}
      </div>
    )
  }

  // ── Error
  if (error) {
    return (
      <div className="py-6 text-center" data-testid="deadline-error">
        <p className="text-sm text-on-surface mb-3">{error}</p>
        <button
          type="button"
          onClick={fetchDeadlines}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 bg-honey-deep text-white text-sm font-semibold rounded-xl shadow-ambient"
          data-testid="retry-btn"
        >
          <RefreshCw className="w-4 h-4" />
          Subukan ulit
        </button>
      </div>
    )
  }

  // ── Empty
  if (deadlines.length === 0) {
    return <DeadlineEmpty />
  }

  return (
    <div className="flex flex-col gap-3" data-testid="deadline-list">
      {calloutDeadline && <DeadlinePreCallout deadline={calloutDeadline} />}
      {sorted.map((dl) => (
        <DeadlineRow
          key={dl.id}
          deadline={dl}
          highlightNextDue={dl.id === nextDueId}
        />
      ))}
    </div>
  )
}
