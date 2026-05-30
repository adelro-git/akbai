'use client'

// ============================================================
// DeadlineRow — Phase 9b redesigned deadline list row
// Tap → /chat?topic={form_code}&context=deadline-{N}d (ADR-017).
// First (next-due) row gets a SUBTLE honey left-edge bar (replacing the
// old heavy 2px ring); others rely on tonal surface layering (No-Line Rule).
// ============================================================

import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import type { DeadlineWithUrgency } from '@/lib/deadlines/types'
import { isKnownFormCode, FORM_CODE_DESCRIPTIONS } from '@/lib/bir/forms'
import { trackDeadlineChatOpened } from '@/lib/posthog/events'
import { Pill, type PillProps } from '@/components/ui/pill'
import DeadlineDateChip from './deadline-date-chip'

interface DeadlineRowProps {
  deadline: DeadlineWithUrgency
  /** Add the subtle honey left-edge bar (next-due row). */
  highlightNextDue?: boolean
}

function buildDaysLeftCopy(daysUntil: number, status: string): { copy: string; tone: 'urgent' | 'normal' | 'overdue' | 'filed' } {
  if (status === 'filed') return { copy: 'Na-file na', tone: 'filed' }
  if (daysUntil < 0) return { copy: `Lipas na ng ${Math.abs(daysUntil)} araw`, tone: 'overdue' }
  if (daysUntil === 0) return { copy: 'Due ngayong araw', tone: 'urgent' }
  if (daysUntil === 1) return { copy: 'Huling 1 araw', tone: 'urgent' }
  if (daysUntil <= 7) return { copy: `Huling ${daysUntil} araw`, tone: 'urgent' }
  return { copy: `Huling ${daysUntil} araw`, tone: 'normal' }
}

function normalizeFormCode(formName: string): string {
  // Database stores e.g. "1601-EQ"; ADR-017 allowlist handles both with/without hyphen.
  // Keep the hyphenated form for display & deeplink.
  return formName.toUpperCase()
}

// Map the days-left tone onto a Warm Precision Pill status variant (§5).
const TONE_TO_PILL: Record<'urgent' | 'overdue' | 'filed' | 'normal', PillProps['variant']> = {
  overdue: 'overdue',
  urgent: 'pending',
  filed: 'info',
  normal: 'info',
}

/**
 * Map a raw days-until value onto the urgency Pill variant — the same
 * overdue→pending→info ladder the row tag uses, exported so the
 * DeadlinePreCallout tag stays in lockstep instead of hardcoding 'overdue'.
 * `days_until < 0` → overdue; `0..7` → pending; else info.
 */
export function daysUntilToPillVariant(daysUntil: number): PillProps['variant'] {
  if (daysUntil < 0) return TONE_TO_PILL.overdue
  if (daysUntil <= 7) return TONE_TO_PILL.urgent
  return TONE_TO_PILL.normal
}

export default function DeadlineRow({ deadline, highlightNextDue = false }: DeadlineRowProps) {
  const router = useRouter()
  const formCode = normalizeFormCode(deadline.form_name)
  const { copy: daysLeft, tone } = buildDaysLeftCopy(deadline.days_until, deadline.status)
  const isUrgent = tone === 'urgent' || tone === 'overdue'
  const isFiled = tone === 'filed'

  function handleTap() {
    if (isFiled) return
    if (!isKnownFormCode(formCode)) {
      // Fall through to plain chat — never block the user.
      router.push('/chat')
      return
    }
    const clampedN = Math.max(-30, Math.min(30, deadline.days_until))
    const url = `/chat?topic=${encodeURIComponent(formCode)}&context=deadline-${clampedN}d`
    trackDeadlineChatOpened('row', formCode, clampedN)
    router.push(url)
  }

  // Prefer DB description; fall back to allowlist friendly name; fall back
  // to the code itself so unknown future BIR forms still render safely.
  const formNameDisplay = deadline.description ?? FORM_CODE_DESCRIPTIONS[formCode] ?? formCode

  const opacityClass = isFiled ? 'opacity-60' : ''
  const testid = highlightNextDue
    ? `deadlines-row-urgent-${deadline.id}`
    : `deadlines-row-${deadline.id}`

  return (
    <button
      type="button"
      onClick={handleTap}
      disabled={isFiled}
      // Upcoming list row — Level-1 static tonal card, tonal layering (No-Line).
      // next-due gets a subtle honey left-edge bar (not the old heavy ring).
      className={`relative overflow-hidden w-full text-left card-level-1 p-3 flex items-center gap-3.5 min-h-[72px] transition-colors ${opacityClass} ${isFiled ? 'cursor-default' : 'hover:bg-honey-cream/30 active:bg-honey-cream/40'}`}
      data-testid={testid}
      data-form-code={formCode}
      aria-label={`I-open kay Kai: ${formCode}, ${daysLeft}`}
    >
      {highlightNextDue && !isFiled && (
        <span aria-hidden className="absolute left-0 top-0 h-full w-1 bg-honey-deep" />
      )}
      <DeadlineDateChip dueDate={deadline.due_date} urgent={isUrgent} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <Pill variant="form-code" size="tag">
            {formCode}
          </Pill>
          <Pill variant={TONE_TO_PILL[tone]} size="tag">
            {daysLeft}
          </Pill>
        </div>
        <div className="wp-h3 text-on-surface truncate">
          {formNameDisplay}
        </div>
      </div>
      {!isFiled && (
        <ChevronRight size={16} className="text-ink-faint flex-shrink-0" aria-hidden />
      )}
    </button>
  )
}
