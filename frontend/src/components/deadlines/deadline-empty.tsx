'use client'

// ============================================================
// DeadlineEmpty — Phase 9b voice-manual canonical empty state
// "Wala pang BIR deadlines na naka-set up. I-setup natin batay
// sa business type mo?" Action-oriented (voice manual §5).
// ============================================================

import Link from 'next/link'
import { IllustrationWrapper } from '@/components/illustrations/IllustrationWrapper'

export default function DeadlineEmpty() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      data-testid="deadline-empty"
    >
      <div className="mb-4">
        <IllustrationWrapper
          src="empty-states/no-deadlines.webp"
          alt="Wala pang BIR deadlines"
          category="empty-state"
        />
      </div>

      <p className="text-on-surface text-[14px] font-semibold mb-1">
        Wala pang BIR deadlines na naka-set up.
      </p>

      <p className="text-ink-soft text-[13px] mb-5 max-w-[300px]">
        I-setup natin batay sa business type mo?
      </p>

      <Link
        href="/profile"
        className="inline-flex items-center justify-center min-h-[44px] px-5 bg-honey-deep text-white font-semibold rounded-xl shadow-ambient transition-colors hover:bg-honey-deep/90"
        data-testid="setup-tax-type-btn"
      >
        I-setup sa Profile
      </Link>
    </div>
  )
}
