'use client'

// ============================================================
// DeadlineDateChip — 56×56 cream-honey date chip
// Phase 9b spec §2.3. Urgent (≤ 7 days) variant uses honey-deep fill
// with cream text. English month abbreviation (per Q6 — keep EN
// abbreviations for BIR formality, body copy stays Filipino).
// ============================================================

const MONTH_ABBR_EN = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

interface DeadlineDateChipProps {
  /** YYYY-MM-DD (Manila). */
  dueDate: string
  /** True when the deadline is ≤ 7 days away (or overdue). */
  urgent?: boolean
}

export function DeadlineDateChip({ dueDate, urgent = false }: DeadlineDateChipProps) {
  const date = new Date(`${dueDate}T00:00:00+08:00`)
  const month = MONTH_ABBR_EN[date.getMonth()] ?? '???'
  const day = date.getDate()

  const fill = urgent
    ? 'bg-honey-deep text-honey-cream'
    : 'bg-honey-cream text-honey-deep'

  return (
    <div
      className={`w-14 h-14 rounded-xl ${fill} flex flex-col items-center justify-center flex-shrink-0`}
      aria-hidden
    >
      <span className={`text-[10px] font-extrabold tracking-wider leading-none ${urgent ? 'text-honey-cream/80' : 'text-honey-deep/70'}`}>
        {month}
      </span>
      <span
        className={`font-serif text-[22px] leading-none mt-1 ${urgent ? 'text-honey-cream' : 'text-on-surface'}`}
        style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 600 }}
      >
        {day}
      </span>
    </div>
  )
}

export default DeadlineDateChip
