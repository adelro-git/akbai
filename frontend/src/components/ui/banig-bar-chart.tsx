'use client';

// ============================================================
// BanigBarChart — Phase 7 home Kuwento + future /kuwento + /expenses chart.
// Recharts custom <Bar shape> renders banig stripes inside each bar via SVG
// pattern. Sampaguita marker floats above the peak-day bar (kita peak).
//
// Mobile-first: full-width container, height 140px. Y-axis hidden, x-axis
// 11px Filipino weekday abbreviations (Lun..Lin) from `day_label`.
//
// Reduced-motion: Recharts' `isAnimationActive` is gated off when
// prefers-reduced-motion is set so layout is identical without entry slide.
// ============================================================

import { useEffect, useState, useId } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis } from 'recharts';
import { IconSampaguita } from '@/components/illustrations/icons';
import type { WeeklyStoryDay } from '@/lib/weekly-story/types';

export type BanigBarChartProps = {
  days: WeeklyStoryDay[];
  /** 0..6 index into `days` of the kita-peak bar. Null hides the marker. */
  peakDayIndex: number | null;
  /** Override the bar fill. Default uses honey-deep CSS variable. */
  barColor?: string;
};

type ChartDatum = {
  day_label: string;
  kita: number;
  isPeak: boolean;
  index: number;
};

/**
 * usePrefersReducedMotion — small hook so we can stop Recharts animating on
 * first render when the user set OS-level reduced-motion. Returns false on
 * SSR (stable default) and updates after mount.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/**
 * Resolve a design-token CSS var (`--token`, stored as an HSL triplet) to a
 * usable `hsl(...)` color string for SVG fills/strokes, which cannot take
 * Tailwind utility classes. Mirrors `expenses-donut.tsx` `resolveBgColor`.
 * SSR-safe: returns the fallback hex on the server and re-resolves on mount,
 * so the stripe follows the active theme instead of a hardcoded light literal.
 */
function useResolvedVar(token: string, fallback: string): string {
  const [color, setColor] = useState(fallback);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(`--${token}`)
      .trim();
    if (value) setColor(`hsl(${value})`);
  }, [token]);
  return color;
}

// Custom Bar shape — pulls a striped <pattern> over the bar so each bar
// reads as a banig (woven mat) stripe. The peak bar gets the IconSampaguita
// floated above it via a foreignObject.
type RechartsBarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  patternId: string;
  payload?: ChartDatum;
};

function BanigBar(props: RechartsBarShapeProps) {
  // `fill` is always supplied by the parent (resolved from --honey-deep / the
  // barColor override); the literal default is an unreachable last-resort.
  const { x = 0, y = 0, width = 0, height = 0, fill = '#855300', patternId, payload } = props;
  if (width <= 0 || height <= 0) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} />
      <rect x={x} y={y} width={width} height={height} fill={`url(#${patternId})`} rx={4} ry={4} />
      {payload?.isPeak && (
        <g transform={`translate(${x + width / 2 - 7}, ${y - 18})`}>
          <foreignObject width={14} height={14}>
            <span style={{ display: 'inline-block', lineHeight: 0 }}>
              <IconSampaguita size={14} />
            </span>
          </foreignObject>
        </g>
      )}
    </g>
  );
}

export function BanigBarChart({ days, peakDayIndex, barColor }: BanigBarChartProps) {
  const reducedMotion = usePrefersReducedMotion();
  const patternId = useId();

  const data: ChartDatum[] = days.map((d, i) => ({
    day_label: d.day_label,
    kita: d.kita_centavos / 100,
    isPeak: peakDayIndex === i,
    index: i,
  }));

  // Resolve fill color — Tailwind tokens need to be inlined for SVG fills,
  // so we read the CSS var. Default to honey-deep when no override.
  const honeyDeep = useResolvedVar('honey-deep', '#855300');
  const fill = barColor ?? honeyDeep;
  // Stripe follows the active surface (was a hardcoded #fdf9f2 light literal
  // that broke dark mode); tick follows the faint-ink token.
  const stripeColor = useResolvedVar('surface', '#fdfaf4');
  const tickColor = useResolvedVar('ink-faint', '#8a7558');

  return (
    <div className="w-full" style={{ height: 140 }} data-testid="banig-bar-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 8, bottom: 4, left: 8 }}>
          <defs>
            {/* Banig stripe pattern — three horizontal lines over the bar fill. */}
            <pattern
              id={patternId}
              width={6}
              height={6}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(0)"
            >
              <line x1={0} y1={2} x2={6} y2={2} stroke={stripeColor} strokeWidth={0.6} opacity={0.7} />
              <line x1={0} y1={4} x2={6} y2={4} stroke={stripeColor} strokeWidth={0.6} opacity={0.5} />
            </pattern>
          </defs>
          <XAxis
            dataKey="day_label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: tickColor }}
            interval={0}
          />
          <Bar
            dataKey="kita"
            isAnimationActive={!reducedMotion}
            shape={(props: unknown) => {
              const p = props as RechartsBarShapeProps;
              return <BanigBar {...p} fill={fill} patternId={patternId} />;
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BanigBarChart;
