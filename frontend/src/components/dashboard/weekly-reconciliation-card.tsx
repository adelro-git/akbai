'use client';

// ============================================================
// WeeklyReconciliationCard — Sprint 18 data-completeness nudge (Build 5).
// Source of truth: /api/reconciliation/weekly.
//
// PURPOSE: show the user which of the past 7 days they have NOT logged a
// daily check-in for, with a gentle Filipino nudge to back-fill so their
// financial data is complete. Distinct from KuwentoCard (narrative KPI
// recap) — this is completeness, not storytelling.
//
// Layout (mobile-first, matches kuwento-card):
//   - Header row: <IconCheckin 20> + Fraunces label.
//   - 7-dot week strip (filled = logged, hollow = missing) with day labels.
//   - All-complete state: tonal sage PaperNote "Kumpleto ang linggo mo!".
//   - Incomplete state: honey PaperNote nudge + link to back-fill on /dashboard.
//
// Money rendered via centavosToPeso (UI-layer conversion only).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { IconCheckin } from '@/components/illustrations/icons';
import { PaperNote } from '@/components/ui/paper-note';
import { centavosToPeso } from '@/lib/utils/money';
import type { WeeklyReconciliation } from '@/lib/reconciliation';

type CardState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: WeeklyReconciliation }
  | { kind: 'error'; message_tl: string };

export default function WeeklyReconciliationCard() {
  const t = useTranslations('home.reconciliation.weekly');
  const [state, setState] = useState<CardState>({ kind: 'loading' });
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/reconciliation/weekly');
        const json: {
          success: boolean;
          data?: WeeklyReconciliation;
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
        data-testid="weekly-reconciliation-loading"
      >
        <div className="rounded-2xl bg-surface-container p-5">
          <div className="flex items-center gap-2">
            <IconCheckin size={20} />
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
        data-testid="weekly-reconciliation-error"
      >
        <div className="rounded-2xl bg-surface-container p-5">
          <div className="flex items-center gap-2">
            <IconCheckin size={20} />
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
      data-testid="weekly-reconciliation-card"
    >
      <div className="card-level-1 p-5">
        {/* Header row */}
        <div className="flex items-center gap-2">
          <IconCheckin size={20} />
          <p className="font-serif text-sm text-on-surface-variant">{t('label')}</p>
        </div>

        <h2 className="mt-1 wp-h2 text-on-surface">
          {t('logged', { logged: data.logged_count, total: data.total_days })}
        </h2>

        {/* 7-dot week strip — filled = logged, hollow ring = missing. */}
        <div
          className="mt-4 flex items-center justify-between gap-1"
          data-testid="weekly-reconciliation-strip"
        >
          {data.days.map((day) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                aria-hidden
                data-testid={day.logged ? 'recon-dot-logged' : 'recon-dot-missing'}
                className={
                  day.logged
                    ? 'h-3.5 w-3.5 rounded-full bg-tertiary'
                    : 'h-3.5 w-3.5 rounded-full border-2 border-on-surface/25'
                }
              />
              <span className="text-[11px] font-semibold text-on-surface-variant">
                {day.day_label}
              </span>
            </div>
          ))}
        </div>

        {/* Net-so-far line (kita − gastos across logged days).
            i18n-interpolated amount: the key is "Tubo sa ngayon: {amount}" and copy
            is LOCKED, so <Money> (a React node) cannot slot into the t() value
            placeholder without reshaping the key. Per the WP spec §2 caveat we keep
            the plain centavosToPeso string here (the only site where the teal-tabular
            treatment can't apply without a copy/key change). */}
        <p
          className="mt-4 text-sm text-on-surface-variant"
          data-testid="weekly-reconciliation-net"
        >
          {t('netSoFar', { amount: centavosToPeso(data.net_centavos) })}
        </p>

        {/* Completeness nudge OR all-done affirmation. */}
        <div className="mt-4">
          {complete ? (
            <PaperNote tilt="right" tone="sage" padding="md" tape="right">
              <p
                className="font-serif text-sm leading-relaxed"
                data-testid="weekly-reconciliation-complete"
              >
                {t('complete')}
              </p>
            </PaperNote>
          ) : (
            <PaperNote tilt="left" tone="honey" padding="md" tape="left">
              <p
                className="font-serif text-sm leading-relaxed"
                data-testid="weekly-reconciliation-nudge"
              >
                {t('nudge', { count: missingCount })}
              </p>
            </PaperNote>
          )}
        </div>

        {/* Back-fill link — the check-in flow lives on /dashboard (modal). */}
        {!complete && (
          <Link
            href="/dashboard"
            className="mt-4 inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-honey-deep"
            data-testid="weekly-reconciliation-link"
          >
            {t('backfill')} →
          </Link>
        )}
      </div>
    </section>
  );
}
