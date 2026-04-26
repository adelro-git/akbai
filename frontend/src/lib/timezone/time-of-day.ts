// ============================================================
// time-of-day — pure helper for the Manila-localised hero pill bucket.
//
// Pulled out of the `'use client'` KumustahanHero component so Server
// Components (e.g. dashboard/page.tsx) can import it without dragging
// the React-only directive boundary across files. No runtime deps,
// no React, no `'use client'`.
//
// Bucketing:
//   05:00–11:59 -> morning
//   12:00–17:59 -> afternoon
//   else        -> evening
//
// The bands match the legacy KaiGreeting copy so the home reads
// consistently with the rest of Kai's surface.
// ============================================================

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export function computeTimeOfDay(manilaHour: number): TimeOfDay {
  if (manilaHour >= 5 && manilaHour < 12) return 'morning';
  if (manilaHour >= 12 && manilaHour < 18) return 'afternoon';
  return 'evening';
}
