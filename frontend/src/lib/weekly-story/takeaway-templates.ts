// ============================================================
// takeaway-templates.ts — Phase 7 D6 tonal rotation (static).
// Pure module (no IO). Tested via vitest.
//
// 9 templates: 3 tones × 3 week-shapes (positive tubo / flat / negative).
// Tone selection is deterministic per `dayOfYear % 3` so the same user sees
// the same tone within a calendar day (Q D6 + Phase 1.5 Hooked rule).
// Phase 10 swaps these templates for an LLM call without changing the API
// contract — `pickTakeaway` still returns a string.
//
// Conversational Filipino conventions (per copy-guide): VSO frame retained,
// second-position enclitics ("ngayong linggo" not "this week"), Filipinized
// "i-/mag-/na-" verbs, peso amounts via Intl in PHP, no English SVO
// constructions, no "based sa" or "yung", no bare English verbs.
// ============================================================

import type { WeeklyStory, WeeklyStoryTone } from './types';

const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function fmt(centavos: number): string {
  return phpFormatter.format(centavos / 100);
}

/**
 * Compute day-of-year (1..366) from a YYYY-MM-DD string. Used as the rotation
 * index for tone selection. Pure / deterministic.
 */
export function dayOfYear(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / (1000 * 60 * 60 * 24));
}

const TONES: readonly WeeklyStoryTone[] = ['energetic', 'observant', 'celebratory'] as const;

/** Pick the tone for a given Manila date (deterministic mod-3 rotation). */
export function pickTone(today: string): WeeklyStoryTone {
  return TONES[dayOfYear(today) % 3];
}

type WeekShape = 'positive' | 'flat' | 'negative';

function classifyWeek(story: Pick<WeeklyStory, 'tubo_centavos' | 'kita_centavos' | 'gastos_centavos'>): WeekShape {
  if (story.tubo_centavos > 0) return 'positive';
  if (story.tubo_centavos < 0) return 'negative';
  // Tubo == 0 — could be a flat zero-volume week or a balanced one.
  return 'flat';
}

/**
 * Pick a takeaway sentence for the home Kuwento card. Static templates per
 * tone × shape (Phase 7). `name` falls back to "Boss" if unset.
 *
 * Templates intentionally observe-not-advise — no tax claims, no commands,
 * pure conversational reflection.
 */
export function pickTakeaway(
  tone: WeeklyStoryTone,
  story: Pick<WeeklyStory, 'kita_centavos' | 'gastos_centavos' | 'tubo_centavos'>,
  name?: string,
): string {
  const safeName = name && name.trim().length > 0 ? name : 'Boss';
  const kita = fmt(story.kita_centavos);
  const gastos = fmt(story.gastos_centavos);
  const tubo = fmt(Math.abs(story.tubo_centavos));
  const shape = classifyWeek(story);

  // 9 cells. Each line is a single observation — no advice, no commands.
  if (tone === 'energetic') {
    if (shape === 'positive') {
      return `Ginalingan mo ngayong linggo, ${safeName}! Tubo: ${tubo}. Tuloy lang.`;
    }
    if (shape === 'flat') {
      return `Patas ang linggo, ${safeName}. Kita: ${kita}, gastos: ${gastos}. Bukas, isa pang round.`;
    }
    return `Mahirap ang linggo, ${safeName}, pero nandito pa rin tayo. Tubo: -${tubo}.`;
  }

  if (tone === 'observant') {
    if (shape === 'positive') {
      return `Pumasok ang ${kita} ngayong linggo. Gastos: ${gastos}. Net: ${tubo}.`;
    }
    if (shape === 'flat') {
      return `Pantay ang kita at gastos ngayong linggo. Kita: ${kita}, gastos: ${gastos}.`;
    }
    return `Mas mataas ang gastos kesa kita ngayong linggo. Kita: ${kita}, gastos: ${gastos}.`;
  }

  // celebratory
  if (shape === 'positive') {
    return `Wow, ${tubo} ang tubo ngayong linggo, ${safeName}! Pinaghirapan mo 'yan.`;
  }
  if (shape === 'flat') {
    return `Tabla ngayong linggo, ${safeName} — pero ramdam ko, may pinaghirapan ka pa rin.`;
  }
  return `Hindi madali ang linggo, ${safeName}, pero kasama mo ako. Bukas, balikan natin.`;
}
