/**
 * Deadline Empty State — Shown when user has no BIR deadlines
 * Feature: Build 6 — BIR Deadline Watcher (Sprint 9)
 * Role: Taglish empty state guiding user to set up their tax type.
 */

'use client';

import Link from 'next/link';
import { IllustrationWrapper } from '@/components/illustrations/IllustrationWrapper';

export default function DeadlineEmpty() {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
      data-testid="deadline-empty"
    >
      <div className="mb-4">
        <IllustrationWrapper
          src="empty-states/no-deadlines.webp"
          alt="Wala pang BIR deadlines"
          category="empty-state"
        />
      </div>

      <h2 className="text-lg font-bold text-on-surface mb-2">
        Wala pang BIR deadlines
      </h2>

      <p className="text-sm text-on-surface-variant mb-6 max-w-[280px]">
        I-setup mo muna ang tax type mo sa Profile para makita ang mga upcoming BIR deadlines mo.
      </p>

      <Link
        href="/profile"
        className="inline-flex items-center justify-center min-h-[44px] px-6 bg-primary-container text-on-primary font-semibold rounded-xl transition-colors hover:bg-primary"
        data-testid="setup-tax-type-btn"
      >
        I-setup sa Profile
      </Link>
    </div>
  );
}
