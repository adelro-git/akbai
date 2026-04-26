'use client';

// ============================================================
// FloatingPetalsLayer — Phase 7 home ambient layer (Q2 deferral).
//
// First visit (cold load): renders 4–6 small static IconSampaguita
// decorations in the hero corners. Visceral warmth at day 0 without the
// JS/keyframe overhead — keeps LCP clean (per F4 perf budget).
//
// Day 2+: once `localStorage['akbai_home_visit_count']` >= 2 we swap in
// the animated <FloatingPetals> layer. SW is primed by then so the
// 200KB image budget cold-load gate is no longer at risk.
//
// Reduced-motion: always show the static decorations; never the animated
// layer (per pattern:reduced-motion-respect).
// ============================================================

import { useEffect, useState } from 'react';
import { FloatingPetals } from '@/components/illustrations/svg/decorative/FloatingPetals';
import { IconSampaguita } from '@/components/illustrations/icons';

const VISIT_COUNT_KEY = 'akbai_home_visit_count';

type Mode = 'static' | 'animated';

function readVisitCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(VISIT_COUNT_KEY);
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

function bumpVisitCount(): void {
  if (typeof window === 'undefined') return;
  try {
    const next = readVisitCount() + 1;
    window.localStorage.setItem(VISIT_COUNT_KEY, String(next));
  } catch {
    /* no-op (private mode, etc.) */
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function FloatingPetalsLayer() {
  // SSR-safe initial mode: 'static' on first paint to avoid hydration drift.
  const [mode, setMode] = useState<Mode>('static');

  useEffect(() => {
    bumpVisitCount();
    if (prefersReducedMotion()) {
      setMode('static');
      return;
    }
    if (readVisitCount() >= 2) {
      setMode('animated');
    }
  }, []);

  if (mode === 'animated') {
    return <FloatingPetals count={6} />;
  }

  // Static decorations — 5 sampaguita placed around the hero corners.
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      data-testid="static-sampaguita-decor"
    >
      <span className="absolute top-2 left-3 opacity-70">
        <IconSampaguita size={14} />
      </span>
      <span className="absolute top-6 right-4 opacity-60">
        <IconSampaguita size={12} />
      </span>
      <span className="absolute top-20 right-2 opacity-50">
        <IconSampaguita size={10} />
      </span>
      <span className="absolute top-1/2 left-2 opacity-50">
        <IconSampaguita size={11} />
      </span>
      <span className="absolute top-32 left-1/3 opacity-40">
        <IconSampaguita size={10} />
      </span>
    </div>
  );
}
