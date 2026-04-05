/**
 * BIR Deadline Watcher Page — Lists all BIR filing deadlines
 * Feature: Build 6 — BIR Deadline Watcher (Sprint 9)
 * Role: Server page that renders the deadline list with BIR disclaimer.
 *       Mobile-first layout, grouped by status (overdue → upcoming → filed).
 */

import { Metadata } from 'next';
import { ChevronLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import DeadlineList from '@/components/deadlines/deadline-list';
import { PageBackground } from '@/components/ui/page-background';

export const metadata: Metadata = {
  title: 'BIR Deadlines — AKBai',
};

export default function DeadlinesPage() {
  return (
    <PageBackground variant="deadlines">
    <div
      className="min-h-dvh bg-background pb-20"
      data-testid="deadlines-page"
    >
      {/* ─── Header ─── */}
      <header className="flex items-center gap-3 px-4 py-4">
        <Link
          href="/dashboard"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors"
          aria-label="Back to dashboard"
          data-testid="deadlines-back-btn"
        >
          <ChevronLeft className="w-6 h-6 text-on-surface" />
        </Link>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-container" />
          <h1 className="text-xl font-bold text-on-surface">BIR Deadlines</h1>
        </div>
      </header>

      {/* ─── BIR Disclaimer Banner ─── */}
      <div
        className="mx-4 mb-4 bg-warning-container/10 rounded-xl px-4 py-3"
        data-testid="bir-disclaimer"
      >
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo.
        </p>
      </div>

      {/* ─── Deadline List (client component) ─── */}
      <DeadlineList />
    </div>
    </PageBackground>
  );
}
