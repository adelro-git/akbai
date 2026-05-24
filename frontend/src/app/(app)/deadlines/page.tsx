// ============================================================
// /deadlines — Phase 9b ADOPT HANDOFF (A5)
// Header eyebrow + Fraunces H1 + caption, then the redesigned
// DeadlineList with Kai pre-deadline callout + tap-through chat
// deeplinks (ADR-017).
// ============================================================

import { Metadata } from 'next';
import DeadlineList from '@/components/deadlines/deadline-list';
import { PageBackground } from '@/components/ui/page-background';
import { IconKalendaryo } from '@/components/illustrations/icons';

export const metadata: Metadata = {
  title: 'BIR Deadlines — AKBai',
};

export default function DeadlinesPage() {
  return (
    <PageBackground variant="deadlines">
      <div
        className="min-h-dvh pb-24 max-w-[760px] mx-auto px-4 py-6"
        data-testid="deadlines-page"
      >
        {/* ── Screen header ── */}
        <header className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-honey-deep" aria-hidden>
              <IconKalendaryo size={28} />
            </span>
            <span className="text-[10px] font-extrabold tracking-[0.08em] text-honey-deep">
              BIR DEADLINES
            </span>
          </div>
          <h1
            className="font-serif text-[28px] leading-tight text-on-surface mb-1"
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontWeight: 500 }}
            data-testid="deadlines-h1"
          >
            Hindi ka mahuhuli kay Kai.
          </h1>
          <p className="text-[13px] text-ink-soft">
            Automatic na paalala bago ang due date.
          </p>
        </header>

        {/* ── BIR disclaimer banner — voice manual §3 canonical ── */}
        <div
          className="mb-5 rounded-xl bg-honey-cream/40 px-4 py-2.5"
          data-testid="deadlines-disclaimer"
          role="status"
          aria-label="BIR disclaimer"
        >
          <p className="text-[11px] text-ink-soft leading-snug">
            Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo.
          </p>
        </div>

        {/* ── Deadline list (client) ── */}
        <DeadlineList />
      </div>
    </PageBackground>
  );
}
