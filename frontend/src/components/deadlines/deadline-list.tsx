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

export default function DeadlineList() {
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

  // Next-due id (the first non-filed row gets the 2px honey-deep ring).
  const nextDueId = useMemo(() => {
    return sorted.find((d) => d.status !== 'filed')?.id ?? null
  }, [sorted])

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
