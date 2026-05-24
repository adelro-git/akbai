'use client'

// ============================================================
// DeadlineRow — Phase 9b redesigned deadline list row
// Tap → /chat?topic={form_code}&context=deadline-{N}d (ADR-017).
// First (next-due) row gets a 2px honey-deep ring; others rely on
// tonal surface layering (No-Line Rule).
// ============================================================

import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import type { DeadlineWithUrgency } from '@/lib/deadlines/types'
import { isKnownFormCode, FORM_CODE_DESCRIPTIONS } from '@/lib/bir/forms'
import { trackDeadlineChatOpened } from '@/lib/posthog/events'
import DeadlineDateChip from './deadline-date-chip'

interface DeadlineRowProps {
  deadline: DeadlineWithUrgency
  /** Add 2px honey-deep ring (next-due row). */
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

  const ringClass = highlightNextDue ? 'ring-2 ring-honey-deep' : ''
  const opacityClass = isFiled ? 'opacity-60' : ''
  const testid = highlightNextDue
    ? `deadlines-row-urgent-${deadline.id}`
    : `deadlines-row-${deadline.id}`

  return (
    <button
      type="button"
      onClick={handleTap}
      disabled={isFiled}
      className={`w-full text-left rounded-2xl bg-surface-container-lowest p-3 shadow-ambient flex items-center gap-3 min-h-[72px] transition-colors ${ringClass} ${opacityClass} ${isFiled ? 'cursor-default' : 'hover:bg-honey-cream/30 active:bg-honey-cream/40'}`}
      data-testid={testid}
      data-form-code={formCode}
      aria-label={`I-open kay Kai: ${formCode}, ${daysLeft}`}
    >
      <DeadlineDateChip dueDate={deadline.due_date} urgent={isUrgent} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-[12px] font-extrabold tracking-wide rounded-full bg-honey-pale text-honey-deep px-2 py-0.5">
            {formCode}
          </span>
          <span
            className={
              tone === 'overdue'
                ? 'text-[12px] font-semibold text-[#F87171]'
                : tone === 'urgent'
                  ? 'text-[12px] font-semibold text-honey-deep'
                  : tone === 'filed'
                    ? 'text-[12px] font-semibold text-ink-faint'
                    : 'text-[12px] font-semibold text-ink-soft'
            }
          >
            {daysLeft}
          </span>
        </div>
        <div
          className="font-serif text-[16px] leading-tight text-on-surface truncate"
          style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 500 }}
        >
          {formNameDisplay}
        </div>
      </div>
      {!isFiled && (
        <ChevronRight size={16} className="text-ink-faint flex-shrink-0" aria-hidden />
      )}
    </button>
  )
}
