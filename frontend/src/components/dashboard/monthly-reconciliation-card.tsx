'use client';

// ============================================================
// MonthlyReconciliationCard — Sprint 18 month-to-date summary (Build 5).
// Source of truth: /api/reconciliation/monthly.
//
// PURPOSE: a compact month-to-date roll-up — total kita / gastos / tubo plus
// how many days the user has logged out of the days elapsed this month, with
// a gentle Filipino nudge to back-fill missing days. Completeness, not
// narrative (KuwentoCard owns the story).
//
// Layout (mobile-first, matches kuwento-card):
//   - Header row: <IconPera 20> + Fraunces month label.
//   - 3-col KPI grid (Kita / Gastos / Tubo).
//   - Days-logged line + completeness nudge / affirmation PaperNote.
//
// Money rendered via centavosToPeso (UI-layer conversion only).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { IconPera } from '@/components/illustrations/icons';
import { PaperNote } from '@/components/ui/paper-note';
import Money from '@/components/ui/money';
import type { MonthlyReconciliation } from '@/lib/reconciliation';

type CardState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: MonthlyReconciliation }
  | { kind: 'error'; message_tl: string };

export default function MonthlyReconciliationCard() {
  const t = useTranslations('home.reconciliation.monthly');
  const [state, setState] = useState<CardState>({ kind: 'loading' });
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/reconciliation/monthly');
        const json: {
          success: boolean;
          data?: MonthlyReconciliation;
          error?: { message_tl?: string };
        } = await res.json();

        if (cancelled) return;

        if (!json.success || !json.data) {
          setState({
            kind: 'error',
            message_tl:
              json.error?.message_tl ??
              'Pasensya, may problema sa pag-load ngayon. Subukan ulit mamaya.',
          });
          return;
        }
        setState({ kind: 'ready', data: json.data });
      } catch {
        if (!cancelled) {
          setState({
            kind: 'error',
            message_tl:
              'Pasensya, may problema sa pag-load ngayon. Subukan ulit mamaya.',
          });
        }
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === 'loading') {
    return (
      <section
        aria-label={t('label')}
        className="px-4 pb-4"
        data-testid="monthly-reconciliation-loading"
      >
        <div className="rounded-2xl bg-surface-container p-5">
          <div className="flex items-center gap-2">
            <IconPera size={20} />
            <p className="font-serif text-sm text-on-surface-variant">{t('label')}</p>
          </div>
          <div className="mt-3 h-5 w-3/4 rounded bg-on-surface/10 animate-pulse" />
          <div className="mt-2 h-4 w-1/2 rounded bg-on-surface/10 animate-pulse" />
        </div>
      </section>
    );
  }

  if (state.kind === 'error') {
    return (
      <section
        aria-label={t('label')}
        className="px-4 pb-4"
        data-testid="monthly-reconciliation-error"
      >
        <div className="rounded-2xl bg-surface-container p-5">
          <div className="flex items-center gap-2">
            <IconPera size={20} />
            <p className="font-serif text-sm text-on-surface-variant">{t('label')}</p>
          </div>
          <p className="mt-2 text-sm text-on-surface-variant">{state.message_tl}</p>
        </div>
      </section>
    );
  }

  const { data } = state;
  const missingCount = data.missing_dates.length;
  const complete = missingCount === 0;

  return (
    <section
      aria-label={t('label')}
      className="px-4 pb-4"
      data-testid="monthly-reconciliation-card"
    >
      <div className="card-level-1 p-5">
        {/* Header row — month label, e.g. "Mayo 2026". */}
        <div className="flex items-center gap-2">
          <IconPera size={20} />
          <p className="font-serif text-sm text-on-surface-variant">{t('label')}</p>
        </div>
        <h2
          className="mt-1 wp-h2 text-on-surface"
          data-testid="monthly-reconciliation-month"
        >
          {data.month_label}
        </h2>

        {/* 3-col KPI grid (Kita / Gastos / Tubo). */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <KpiTile
            label={t('kita')}
            centavos={data.total_sales_centavos}
            testId="monthly-kpi-kita"
          />
          <KpiTile
            label={t('gastos')}
            centavos={data.total_expenses_centavos}
            testId="monthly-kpi-gastos"
          />
          <KpiTile
            label={t('tubo')}
            centavos={data.net_centavos}
            testId="monthly-kpi-tubo"
            profit
          />
        </div>

        {/* Days-logged line. */}
        <p
          className="mt-4 text-sm text-on-surface-variant"
          data-testid="monthly-reconciliation-days"
        >
          {t('daysLogged', {
            logged: data.days_logged,
            elapsed: data.days_elapsed,
          })}
        </p>

        {/* Completeness nudge OR all-done affirmation. */}
        <div className="mt-4">
          {complete ? (
            <PaperNote tilt="right" tone="sage" padding="md" tape="right">
              <p
                className="font-serif text-sm leading-relaxed"
                data-testid="monthly-reconciliation-complete"
              >
                {t('complete')}
              </p>
            </PaperNote>
          ) : (
            <PaperNote tilt="left" tone="honey" padding="md" tape="left">
              <p
                className="font-serif text-sm leading-relaxed"
                data-testid="monthly-reconciliation-nudge"
              >
                {t('nudge', { count: missingCount })}
              </p>
            </PaperNote>
          )}
        </div>

        {/* Back-fill link — check-in flow lives on /dashboard (modal). */}
        {!complete && (
          <Link
            href="/dashboard"
            className="mt-4 inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-honey-deep"
            data-testid="monthly-reconciliation-link"
          >
            {t('backfill')} →
          </Link>
        )}
      </div>
    </section>
  );
}

function KpiTile({
  label,
  centavos,
  testId,
  profit,
}: {
  label: string;
  centavos: number;
  testId: string;
  /** Tubo tile: pale honey secondary-container fill (Warm Precision). */
  profit?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-3 py-2 text-center ${
        profit ? 'bg-secondary-container' : 'bg-surface-container-low'
      }`}
      data-testid={testId}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-on-surface-variant">
        {label}
      </p>
      <div className="mt-1">
        <Money centavos={centavos} size="md" signed={profit} />
      </div>
    </div>
  );
}
