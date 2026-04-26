'use client';

// ============================================================
// KumustahanHero — Phase 7 home hero (canonical layout per
// design_handoff_akbai_redesign/synthesis/screens/00-home.md §1)
//
// Composition (mobile-first, then `tablet:` left-Kai right-text on >=860px):
//   1. KaiSitting 168px (B6 kai-breathe — globally reduced-motion-gated)
//   2. Time-of-day pill (Magandang umaga / hapon / gabi) — Manila clock
//   3. Fraunces 30px / 500 user name line
//   4. Fraunces italic 26px / 500 "kumusta ka?" with Squiggle underline
//   5. Optional aiTagline one-liner from the morning-briefing extension
//   6. Optional CapizPattern bg at 0.18 opacity (gated on prefers-reduced-motion
//      and on the showCapiz prop default true)
//
// SSR-then-rehydrate: server initial time-of-day comes from props (the page
// computes it via toManila()); client useEffect refreshes it once after mount
// and on tab focus so the pill stays in sync if the user crosses noon while
// the tab is open.
// ============================================================

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { KaiSitting } from '@/components/illustrations/kai/kai-sitting';
import { Squiggle } from '@/components/illustrations/svg/decorative/Squiggle';
import { CapizPattern } from '@/components/illustrations/svg/decorative/CapizPattern';
import { computeTimeOfDay, type TimeOfDay } from '@/lib/timezone/time-of-day';

export type { TimeOfDay };
export type AiTone = 'energetic' | 'observant' | 'celebratory';

export type KumustahanHeroProps = {
  /** Display name from users.display_name (server-fetched). */
  userName: string;
  /** Initial time-of-day computed server-side via toManila() so SSR matches first paint. */
  initialTimeOfDay: TimeOfDay;
  /**
   * Optional Kai micro-tagline — populated by the morning-briefing extension
   * (Phase 7 build-ai parallel work). When null, the hero degrades gracefully.
   */
  aiTagline?: string | null;
  /** Tonal calibration metadata (D6 rotation). Reserved for future styling hooks. */
  aiTone?: AiTone | null;
  /** Toggle the CapizPattern background. Default true; opt out when LCP-sensitive. */
  showCapiz?: boolean;
  className?: string;
};

// computeTimeOfDay lives in `@/lib/timezone/time-of-day` so Server Components
// can reuse it without picking up this file's `'use client'` boundary. The
// import above re-uses the same pure implementation for the client refresh hook.

function getCurrentManilaHour(): number {
  // Browser-side: Intl handles the Asia/Manila offset deterministically.
  const parts = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  // Some locales emit "24" at midnight — normalize to 0.
  return hour === 24 ? 0 : hour;
}

export default function KumustahanHero({
  userName,
  initialTimeOfDay,
  aiTagline = null,
  aiTone = null,
  showCapiz = true,
  className,
}: KumustahanHeroProps) {
  const t = useTranslations('home');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(initialTimeOfDay);

  // Refresh the time-of-day if the user crosses a band boundary (e.g. opens
  // the tab at 11:58 AM and idles past noon). Cheap; runs once on mount and
  // again whenever the tab regains focus.
  useEffect(() => {
    const refresh = () => setTimeOfDay(computeTimeOfDay(getCurrentManilaHour()));
    refresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // aiTone is currently informational (D6 rotation hooks land in Phase 10
  // when the LLM tone selection feeds visual variants). Reference it so
  // strict-mode TypeScript doesn't flag the prop as unused without losing
  // the public API surface that the page passes.
  void aiTone;

  return (
    <section
      aria-label="Kumustahan"
      data-testid="kumustahan-hero"
      className={`relative overflow-hidden px-5 pt-6 pb-4 ${className ?? ''}`}
    >
      {showCapiz && (
        <div
          className="absolute inset-0 motion-reduce:hidden pointer-events-none"
          aria-hidden
        >
          <CapizPattern opacity={0.18} />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-4 tablet:flex-row tablet:items-center tablet:gap-6 tablet:text-left">
        {/* Kai mark — 168px, breathing animation (B6) — paired with the greeting block. */}
        <div className="flex-shrink-0">
          <KaiSitting size={168} animated />
        </div>

        <div className="flex flex-col items-center text-center tablet:items-start tablet:text-left">
          {/* Time-of-day pill */}
          <span
            className="inline-flex items-center rounded-full bg-honey-pale px-3 py-1 text-xs font-semibold text-honey-deep"
            data-testid="kumustahan-greeting-pill"
          >
            {t(`greeting.${timeOfDay}`)}
          </span>

          {/* Name line — Fraunces 30px / 500 */}
          <h1
            className="mt-2 font-serif text-[30px] font-medium leading-tight text-on-surface"
            data-testid="kumustahan-name"
          >
            {userName},
          </h1>

          {/* "kumusta ka?" — Fraunces italic 26px / 500 + Squiggle underline (single accent) */}
          <p
            className="mt-1 font-serif italic text-[26px] font-medium leading-tight text-on-surface"
            data-testid="kumustahan-question"
          >
            {t('kumustaKa')}
          </p>
          <span aria-hidden className="mt-1 block">
            <Squiggle width={120} />
          </span>

          {/* Optional Kai micro-tagline (graceful degradation when null) */}
          {aiTagline && (
            <p
              className="mt-2 font-serif italic text-[14px] text-honey-deep"
              data-testid="kumustahan-ai-tagline"
            >
              {aiTagline}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
