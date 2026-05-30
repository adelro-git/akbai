'use client'

// ============================================================
// DeadlineDateChip — Warm Precision date chip (§8 + prototype .datechip)
// White (surface-container-lowest) chip with el-2 shadow; a colored month
// band over a large tabular day numeral. Urgent (≤ 7 days / overdue) flips the
// month band to error-fill (the prototype's .datechip.urgent .dc-mon). English
// month abbreviation (per Q6 — keep EN abbreviations for BIR formality, body
// copy stays Filipino).
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

  // Month band: honey fill normally, error-fill when urgent (prototype .urgent).
  const monthBand = urgent
    ? 'bg-error-fill text-white'
    : 'bg-honey text-white'

  return (
    <div
      className="w-[52px] rounded-xl bg-surface-container-lowest shadow-el-2 overflow-hidden text-center flex-shrink-0"
      aria-hidden
    >
      <div className={`text-[10px] font-extrabold tracking-[0.08em] uppercase leading-none py-1 ${monthBand}`}>
        {month}
      </div>
      <div className="text-[22px] font-extrabold leading-none tabular-nums text-on-surface py-1.5">
        {day}
      </div>
    </div>
  )
}

export default DeadlineDateChip
