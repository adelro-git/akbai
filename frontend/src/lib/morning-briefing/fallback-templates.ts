/**
 * Morning Briefing — Deterministic Fallback Templates
 * Feature: Phase 7 graceful Claude fallback (Anton's operational call 2026-04-26)
 * Role: When Claude is unreachable (no API key, credit-balance error, 5xx),
 *       return a deterministic Kumustahan one-liner + briefing paragraph
 *       using the same D6 tonal rotation. NO financial figures, NO tax claims.
 *
 * Conventions:
 * - Conversational Filipino (CLAUDE.md non-negotiable rule #5).
 * - Filipino syntactic frame: VSO, second-position enclitics, Filipino conjunctions.
 * - Tagline ≤ 80 chars (hero constraint).
 * - Briefing ≈ 80–120 words (matches the live briefing card's visual weight).
 * - {name} interpolated with the user's first name; falls back to "ka-partner"
 *   (matches assemble.ts default).
 * - 3 templates per tone (9 total) — picked deterministically by template index
 *   so the same user on the same day with the same tone always sees the same
 *   copy. Variety comes from the day-of-year rotation, not RNG.
 */

import type { MorningTone } from './types';

interface FallbackBundle {
  tagline: string;
  briefing: string;
}

/**
 * 3 templates per tone. Index is selected deterministically from briefingDate
 * (see pickFallback below) so a given user sees the same fallback within a day.
 */
const TEMPLATES: Record<MorningTone, readonly FallbackBundle[]> = {
  energetic: [
    {
      tagline: 'Tara, simulan na natin ang araw, {name}!',
      briefing:
        'Magandang umaga, {name}! Tara, simulan na natin ang araw. Kahit medyo offline pa si Kai sa mga numbers ngayon, nandito pa rin ako para sa\'yo. Kumusta ang negosyo? Pwede mong i-record ang mga bagong transaction, i-scan ang resibo, o tingnan ang mga deadline mo — ready lahat. Pag bumalik na ang full briefing bukas, mas detalyado tayo. Sa ngayon, basta gawin natin ang tama: konting ayos sa books, konting hakbang pasulong. Laban lang!',
    },
    {
      tagline: 'Game na tayo, {name} — gawin natin maganda ang araw.',
      briefing:
        'Magandang umaga, {name}! Game na tayo — gawin natin maganda ang araw. Pansamantalang offline ang full briefing ko, pero nandito pa rin ako. Kumusta ang negosyo mo ngayon? Habang naghihintay tayo ng updates, pwede mong asikasuhin ang ilang transaction o i-check ang mga upcoming deadline. Walang malaking bagay, kahit maliliit na hakbang lang muna. Kapag kumpleto na ulit ang briefing bukas, mas magaan tayong mag-uusap. Tuloy lang, kaya mo \'yan.',
    },
    {
      tagline: 'Sige na, {name}, isang hakbang muna ngayon.',
      briefing:
        'Magandang umaga, {name}! Sige na, isang hakbang muna ngayon. Hindi pa available ang full briefing ko, pero okay lang — nandito pa rin ako sa likod. Kumusta ang negosyo? Kung may bagong resibo o transaction ka, pwede mo nang i-record habang sariwa pa. Kung gusto mo munang umupo at mag-isip, pwede rin. Walang pressure. Bukas, mas detalyado tayong magse-set up. Sa ngayon, ramdam ko handa ka.',
    },
  ],
  observant: [
    {
      tagline: 'Magandang araw, {name}. Dahan-dahan lang muna tayo ngayon.',
      briefing:
        'Magandang araw, {name}. Dahan-dahan lang muna tayo ngayon. Pansamantalang hindi available ang full briefing ko — kaya hindi muna ako mag-iimbento ng numero. Pero kumusta ka? Kumusta ang negosyo? Pag handa ka na, pwede mong i-check ang mga huling transaction o resibo mo nang mismo. Kung walang nangyari kahapon, walang problema — minsan, tahimik na araw lang ang kailangan. Bukas, babalik tayo sa regular na flow ng briefing. Maraming salamat sa pasensya.',
    },
    {
      tagline: 'Kumusta ang umaga mo, {name}? Hinaan lang ang takbo.',
      briefing:
        'Magandang araw, {name}. Kumusta ang umaga mo? Hinaan lang ang takbo. Hindi pa available ang full briefing ngayon, kaya wala muna akong figures na ipapakita — ayoko mag-imbento. Pero ramdam ko, may sariling pace ka rin sa araw na ito. Kapag handa ka na, tingnan natin ang mga transaction mo nang sama-sama. Kung gusto mong magpahinga muna, ayos lang din. Bukas, full briefing ulit. Salamat sa tiwala.',
    },
    {
      tagline: 'Magandang umaga, {name}. Hayaan natin maglinaw ang araw.',
      briefing:
        'Magandang umaga, {name}. Hayaan natin maglinaw ang araw. Hindi pa kumpleto ang briefing ko ngayon, kaya hindi muna ako magpapakita ng numero — ayoko mali ang sasabihin. Kumusta ang negosyo? Kung may pinag-iisipan ka, pwede tayong dahan-dahan. Kapag may resibo o transaction kang naipon, andito ang scanner at recorder pag handa ka na. Bukas, mas malinaw tayong magse-summarise. Walang madaliang bagay.',
    },
  ],
  celebratory: [
    {
      tagline: 'Ayos, {name}! Tuloy-tuloy lang ang ganitong rhythm.',
      briefing:
        'Ayos, {name}! Tuloy-tuloy lang ang ganitong rhythm. Hindi pa available ang full briefing ko ngayon, kaya wala muna akong specific na figures — pero ramdam ko, kaya mong panatilihin ang momentum mo. Kumusta ang negosyo? Kapag handa ka, pwede mong tingnan ang mga huling transaction at resibo mo. Kahit small wins, ito ang nagpapatatag ng business. Bukas, balik tayo sa regular na briefing. Salamat sa consistency mo.',
    },
    {
      tagline: 'Galing, {name}! Patuloy ang ganda ng pagsisimula mo.',
      briefing:
        'Galing, {name}! Patuloy ang ganda ng pagsisimula mo. Pansamantalang offline ang full briefing — kaya wala muna akong eksaktong figures, pero alam kong may pinaghirapan ka kahapon. Kumusta ang negosyo ngayon? Pag handa ka na, andito ako para sa scanner, sa recorder, at sa mga deadline mo. Bukas, mas detalyado tayong magce-celebrate ng progreso. Sa ngayon, kilalanin natin: nandito ka, tuloy ka, ayos \'yan.',
    },
    {
      tagline: 'Saludo ako sa\'yo, {name} — tuloy ang trabaho.',
      briefing:
        'Saludo ako sa\'yo, {name} — tuloy ang trabaho. Hindi pa available ang full briefing ko ngayon, kaya hindi muna ako magpapakita ng financial details. Pero kumusta ang negosyo? Ramdam ko, kahit walang briefing ngayon, may sariling rhythm ka na. Pag handa ka, asikasuhin natin ang mga bagong transaction o resibo. Bukas, babalik ang regular na briefing. Sa ngayon, salamat sa pananatili mo sa journey na \'to.',
    },
  ],
};

/**
 * Pick the deterministic fallback for a given tone + date.
 * Same (tone, date) always returns the same template — no RNG.
 *
 * Note: tone itself is already date-derived via pickTone(), so in practice
 * each calendar day has exactly one fallback. We still take both args so
 * the API is explicit and tests can pin them independently.
 */
export function pickFallback(
  tone: MorningTone,
  briefingDate: string,
  firstName: string | null
): FallbackBundle {
  const bundles = TEMPLATES[tone];
  // Date-derived index — same date, same template variant.
  const seed = hashDate(briefingDate);
  const idx = seed % bundles.length;
  const bundle = bundles[idx];
  const name = firstName?.trim() || 'ka-partner';
  return {
    tagline: bundle.tagline.replaceAll('{name}', name),
    briefing: bundle.briefing.replaceAll('{name}', name),
  };
}

/** Tiny stable hash on YYYY-MM-DD — sum of char codes. Deterministic, no deps. */
function hashDate(briefingDate: string): number {
  let h = 0;
  for (let i = 0; i < briefingDate.length; i += 1) {
    h = (h + briefingDate.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Exposed for tests — readonly view of the template registry. */
export const FALLBACK_TEMPLATES = TEMPLATES;
