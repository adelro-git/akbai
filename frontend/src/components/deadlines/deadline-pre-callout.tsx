'use client'

// ============================================================
// DeadlinePreCallout — Kai paper-note shown above the deadline
// list when at least one deadline is ≤ 7 days away. Tap → same
// /chat deeplink as the urgent row (ADR-017 §1).
// ============================================================

import { useRouter } from 'next/navigation'
import type { DeadlineWithUrgency } from '@/lib/deadlines/types'
import { Kai } from '@/components/illustrations/kai/kai'
import { PaperNote } from '@/components/ui/paper-note'
import { isKnownFormCode } from '@/lib/bir/forms'
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

export default function DeadlinePreCallout({ deadline }: DeadlinePreCalloutProps) {
  const router = useRouter()
  const formCode = deadline.form_name.toUpperCase()
  const copy = buildCopy(deadline)

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
      className="w-full text-left"
      data-testid="deadlines-kai-callout"
      aria-label={`I-open kay Kai: ${copy}`}
    >
      <PaperNote tilt="left" tone="default" padding="md" tape="left">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0">
            <Kai expression="concerned" size={32} />
          </span>
          <p
            className="font-serif italic text-[14px] leading-relaxed text-on-surface"
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
          >
            {copy}
          </p>
        </div>
      </PaperNote>
    </button>
  )
}
