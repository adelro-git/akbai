'use client';

// ============================================================
// <Money> — Warm Precision financial figure primitive (W2)
// ------------------------------------------------------------
// The single display primitive for every peso amount in the app.
// Renders a centavo integer through `centavosToPeso` (the repo's
// canonical formatter — never re-implemented here) with the
// "data-confident" treatment: tabular-nums + weight-700 + teal.
//
// Behaviour highlights:
//   • Count-up: 0 → value on first client paint, 600ms cubic
//     ease-out, runs ONCE, honours `prefers-reduced-motion` and a
//     global disable escape hatch.
//   • SSR-safe: server renders the final value; the animation only
//     ever starts inside useEffect (client). No hydration flash for
//     reduced-motion / disabled users.
//   • a11y: aria-label spells the value localized ("3,450 piso").
//
// GLOBAL COUNT-UP DISABLE (single source of truth):
//   Set `data-count-up="off"` on <html> (e.g. from a user setting or
//   a future motion toggle). Read at animation start via
//   `document.documentElement.dataset.countUp === 'off'`. When off,
//   the final value renders immediately with no animation.
//
// Reference algorithm: prototype/app/ui.jsx `PesoNum`.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { centavosToPeso } from '@/lib/utils/money';

// ── Size → Number type class (see globals.css .num-lg/.num-md/.num-sm) ──
const SIZE_CLASS: Record<NonNullable<MoneyProps['size']>, string> = {
  lg: 'num-lg',
  md: 'num-md',
  sm: 'num-sm',
};

// ── Tone → ink override class. Default 'teal' = .num base colour. ──
const TONE_CLASS: Record<NonNullable<MoneyProps['tone']>, string> = {
  teal: '', // .num already resolves to hsl(var(--tertiary))
  ink: 'num-ink',
  white: 'num-white',
};

const COUNT_UP_DURATION_MS = 600;

export interface MoneyProps {
  /** Amount in centavos (canonical integer money unit). */
  centavos: number;
  /** Visual scale → maps to Number-lg/md/sm type tokens. Default 'md'. */
  size?: 'lg' | 'md' | 'sm';
  /** Ink override: teal (default, all financial figures) | 'ink' (on-surface) | 'white' (on honey gradient). */
  tone?: 'teal' | 'ink' | 'white';
  /** Animate 0→value on first paint. Default true. */
  countUp?: boolean;
  /** Show a leading +/- sign (net figures). Default false. */
  signed?: boolean;
  className?: string;
}

/**
 * Format a centavo amount for display, applying the optional explicit sign.
 * `centavosToPeso` already prints a leading "-" for negatives, so when
 * `signed` is set we format the magnitude and prepend the sign ourselves to
 * avoid a double "--" and to surface an explicit "+" for non-negative values.
 */
function format(centavos: number, signed: boolean): string {
  if (!signed) return centavosToPeso(centavos);
  const sign = centavos < 0 ? '-' : '+';
  return `${sign}${centavosToPeso(Math.abs(centavos))}`;
}

/** Localized screen-reader label: integer pesos, grouped, peso → "piso". */
function ariaLabel(centavos: number, signed: boolean): string {
  const pesos = Math.round(centavos / 100);
  const sign = signed ? (centavos < 0 ? '-' : '+') : '';
  const magnitude = Math.abs(pesos).toLocaleString('en-PH');
  return `${sign}${magnitude} piso`;
}

export default function Money({
  centavos,
  size = 'md',
  tone = 'teal',
  countUp = true,
  signed = false,
  className,
}: MoneyProps) {
  // SSR + reduced-motion + disabled users all start (and stay) at the final value.
  const [display, setDisplay] = useState(centavos);
  const started = useRef(false);

  useEffect(() => {
    // Resolve runtime gates only on the client, at the moment we'd animate.
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const globallyDisabled =
      typeof document !== 'undefined' &&
      document.documentElement.dataset.countUp === 'off';

    if (!countUp || prefersReduced || globallyDisabled) {
      setDisplay(centavos);
      return;
    }
    // Animate ONCE on first paint; later prop changes snap to the new value.
    if (started.current) {
      setDisplay(centavos);
      return;
    }
    started.current = true;

    const target = centavos;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / COUNT_UP_DURATION_MS);
      const eased = 1 - Math.pow(1 - p, 3); // cubic ease-out
      if (p < 1) {
        setDisplay(Math.round(target * eased));
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(target); // snap to exact on completion
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Run once on mount; the `started` guard handles in-flight value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centavos, countUp]);

  const cls = ['num', SIZE_CLASS[size], TONE_CLASS[tone], className]
    .filter(Boolean)
    .join(' ');

  // Width is reserved by an invisible sizer rendering the FINAL formatted
  // string, so the visible (animating) value can change digit-count without
  // reflowing surrounding layout.
  const finalText = format(centavos, signed);
  const liveText = format(display, signed);

  return (
    <span
      className={cls}
      aria-label={ariaLabel(centavos, signed)}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <span aria-hidden style={{ visibility: 'hidden' }}>
        {finalText}
      </span>
      <span aria-hidden style={{ position: 'absolute', inset: 0 }}>
        {liveText}
      </span>
    </span>
  );
}
