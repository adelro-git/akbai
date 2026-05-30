'use client'

// ============================================================
// DeadlinePreCallout — Kai paper-note shown above the deadline
// list when at least one deadline is ≤ 7 days away. Tap → same
// /chat deeplink as the urgent row (ADR-017 §1).
// ============================================================

import { useRouter } from 'next/navigation'
import type { DeadlineWithUrgency } from '@/lib/deadlines/types'
import { Kai } from '@/components/illustrations/kai/kai'
import { Pill } from '@/components/ui/pill'
import { isKnownFormCode, FORM_CODE_DESCRIPTIONS } from '@/lib/bir/forms'
import { trackDeadlineChatOpened } from '@/lib/posthog/events'

interface DeadlinePreCalloutProps {
  /** The most-imminent ≤ 7 day deadline. */
  deadline: DeadlineWithUrgency
}

// Filipino month abbreviations — hardcoded for stability across runtimes
// (browser/Node `fil-PH` locale support varies).
const FIL_MONTH_ABBR = [
  'Ene', 'Peb', 'Mar', 'Abr', 'May', 'Hun',
  'Hul', 'Ago', 'Set', 'Okt', 'Nob', 'Dis',
] as const

function formatFilipinoMonthDay(yyyyMmDd: string): string {
  const dueDate = new Date(`${yyyyMmDd}T00:00:00+08:00`)
  const month = FIL_MONTH_ABBR[dueDate.getMonth()]
  const day = dueDate.getDate()
  return `${month} ${day}`
}

function buildCopy(deadline: DeadlineWithUrgency): string {
  const formCode = deadline.form_name.toUpperCase()
  const days = deadline.days_until
  const monthDay = formatFilipinoMonthDay(deadline.due_date)

  if (days < 0) {
    return `Lipas na po ang ${formCode} ng ${Math.abs(days)} araw. Tingnan natin kung paano mauunahan?`
  }
  if (days === 0) {
    return `Ngayon na po ang due ng ${formCode}. Andito pa po ako — i-prepare ko na ang numero mo?`
  }
  if (days === 1) {
    return `Bukas na po ang ${formCode}. Nandiyan pa ang 1 araw — i-walk-through ko na ba ang form?`
  }
  return `Paparating na po ang ${formCode} sa ${monthDay}. Nandiyan pa ang ${days} araw — i-prepare ko na ang numero mo?`
}

/** Short days-left tag copy (reuses the repo's "araw" phrasing; no new strings). */
function daysLeftTag(daysUntil: number): string {
  if (daysUntil < 0) return `Lipas na ng ${Math.abs(daysUntil)} araw`
  if (daysUntil === 0) return 'Due ngayong araw'
  if (daysUntil === 1) return 'Huling 1 araw'
  return `Huling ${daysUntil} araw`
}

export default function DeadlinePreCallout({ deadline }: DeadlinePreCalloutProps) {
  const router = useRouter()
  const formCode = deadline.form_name.toUpperCase()
  const copy = buildCopy(deadline)
  const formNameDisplay =
    deadline.description ?? FORM_CODE_DESCRIPTIONS[formCode] ?? formCode

  // Warm Precision: the urgency accent is a warning-AMBER left bar (NOT red),
  // shown when the deadline is within 3 days (or overdue).
  const showAmberBar = deadline.days_until <= 3

  function handleTap() {
    if (!isKnownFormCode(formCode)) {
      router.push('/chat')
      return
    }
    const clampedN = Math.max(-30, Math.min(30, deadline.days_until))
    const url = `/chat?topic=${encodeURIComponent(formCode)}&context=deadline-${clampedN}d`
    trackDeadlineChatOpened('callout', formCode, clampedN)
    router.push(url)
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      className="w-full text-left card-level-3 relative overflow-hidden p-[18px]"
      // Warm cream gradient surface (token-based, ambient — not a flat hardcoded fill).
      style={{
        background:
          'linear-gradient(165deg, hsl(var(--honey-cream)) 0%, hsl(var(--secondary-container)) 100%)',
      }}
      data-testid="deadlines-kai-callout"
      aria-label={`I-open kay Kai: ${copy}`}
    >
      {/* Left urgency bar — warning amber (4px) when ≤3 days. */}
      {showAmberBar && (
        <span aria-hidden className="absolute left-0 top-0 h-full w-1 bg-warning" />
      )}

      <div className="flex items-center gap-3.5">
        <span className="flex-shrink-0">
          <Kai expression="concerned" size={66} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="wp-h2 text-on-surface">{formCode}</span>
            <Pill variant="overdue" size="tag">
              {daysLeftTag(deadline.days_until)}
            </Pill>
          </div>
          <p className="mt-0.5 text-[13px] text-on-surface-variant">{formNameDisplay}</p>
        </div>
      </div>

      {/* Reassuring body copy (voice manual — locked). */}
      <p
        className="mt-3.5 font-serif italic text-[14px] leading-relaxed text-on-surface"
        style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
      >
        {copy}
      </p>
    </button>
  )
}
