'use client';

// ============================================================
// KuwentoCard — Phase 7 home Kuwento ng Linggo summary.
// Source of truth: /api/weekly-story (ADR-015). Phase 10 will swap the
// underlying takeaway template for an LLM-generated narrative without
// changing the API contract or this component's render shape.
//
// Layout (mobile-first):
//   - Header row: <IconPera 20> + Fraunces 14px label + serif H1 takeaway.
//   - 3-col KPI grid (Kita / Gastos / Tubo).
//   - <BanigBarChart>.
//   - Takeaway as <PaperNote tilt="right" tone="honey">.
//   - Footer link to /expenses (Buksan ang detalye →).
//
// Empty / error state: subdued line + message_tl + "Mag-scan ka ng resibo →"
// link to /scan, per the brief.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { IconPera } from '@/components/illustrations/icons';
import { PaperNote } from '@/components/ui/paper-note';
import { BanigBarChart } from '@/components/ui/banig-bar-chart';
import type { WeeklyStoryResponse, WeeklyStory } from '@/lib/weekly-story/types';

type CardState =
  | { kind: 'loading' }
  | { kind: 'available'; story: WeeklyStory }
  | { kind: 'unavailable'; message_tl: string }
  | { kind: 'error'; message_tl: string };

const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function fmtPeso(centavos: number): string {
  return phpFormatter.format(centavos / 100);
}

export default function KuwentoCard() {
  const t = useTranslations('home.kuwento');
  const [state, setState] = useState<CardState>({ kind: 'loading' });
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/weekly-story');
        const json: { success: boolean; data?: WeeklyStoryResponse } = await res.json();

        if (cancelled) return;

        if (!json.success || !json.data) {
          setState({
            kind: 'error',
            message_tl: 'Pasensya, may problema sa Kuwento ngayon. Try mo ulit mamaya.',
          });
          return;
        }

        const data = json.data;
        if (data.available) {
          setState({ kind: 'available', story: data.story });
        } else {
          setState({ kind: 'unavailable', message_tl: data.message_tl });
        }
      } catch {
        if (!cancelled) {
          setState({
            kind: 'error',
            message_tl: 'Pasensya, may problema sa Kuwento ngayon. Try mo ulit mamaya.',
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
        data-testid="kuwento-card-loading"
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

  if (state.kind === 'unavailable' || state.kind === 'error') {
    return (
      <section aria-label={t('label')} className="px-4 pb-4" data-testid="kuwento-card-empty">
        <div className="rounded-2xl bg-surface-container p-5">
          <div className="flex items-center gap-2">
            <IconPera size={20} />
            <p className="font-serif text-sm text-on-surface-variant">{t('label')}</p>
          </div>
          <p className="mt-2 text-sm text-on-surface-variant">{state.message_tl}</p>
          <Link
            href="/scan"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-honey-deep"
          >
            Mag-scan ka ng resibo →
          </Link>
        </div>
      </section>
    );
  }

  const { story } = state;

  return (
    <section
      aria-label={t('label')}
      className="px-4 pb-4"
      data-testid="kuwento-card"
    >
      <div className="rounded-2xl bg-surface-container p-5 shadow-ambient">
        {/* Header row */}
        <div className="flex items-center gap-2">
          <IconPera size={20} />
          <p className="font-serif text-sm text-on-surface-variant">{t('label')}</p>
        </div>
        <h2
          className="mt-1 font-serif text-[24px] leading-tight font-medium text-on-surface"
          data-testid="kuwento-takeaway-headline"
        >
          {story.takeaway}
        </h2>

        {/* 3-col KPI grid */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <KpiTile label={t('kita')} value={fmtPeso(story.kita_centavos)} testId="kpi-kita" />
          <KpiTile label={t('gastos')} value={fmtPeso(story.gastos_centavos)} testId="kpi-gastos" />
          <KpiTile
            label={t('tubo')}
            value={fmtPeso(story.tubo_centavos)}
            testId="kpi-tubo"
            negative={story.tubo_centavos < 0}
          />
        </div>

        {/* Banig chart */}
        <div className="mt-4">
          <BanigBarChart days={story.daily_breakdown} peakDayIndex={story.peak_day_index} />
        </div>

        {/* Takeaway paper-note (tonal honey, tilt right per spec) */}
        <div className="mt-5">
          <PaperNote tilt="right" tone="honey" padding="md" tape="right">
            <p className="font-serif text-sm leading-relaxed">{story.takeaway}</p>
          </PaperNote>
        </div>

        {/* Footer detail link */}
        <Link
          href="/expenses"
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-honey-deep"
          data-testid="kuwento-footer-link"
        >
          {t('footer')} →
        </Link>
      </div>
    </section>
  );
}

function KpiTile({
  label,
  value,
  testId,
  negative,
}: {
  label: string;
  value: string;
  testId: string;
  negative?: boolean;
}) {
  return (
    <div
      className="rounded-xl bg-surface-container-low px-3 py-2"
      data-testid={testId}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <p
        className={`mt-1 font-serif text-[22px] font-medium leading-none ${
          negative ? 'text-destructive' : 'text-on-surface'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
