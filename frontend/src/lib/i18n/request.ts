// ============================================================
// Sprint 15 (Capacitor static export) — locale resolver
//
// `output: 'export'` forbids `cookies()` / `headers()` in the
// request-config callback because both APIs force every page to
// be dynamic — which static prerender cannot satisfy. The
// resolver therefore returns `defaultLocale` synchronously at
// build time and lets the client take over post-hydration:
//
//   - `set-locale.ts` writes `document.cookie` + `localStorage`
//     and forces `window.location.reload()`. The reload still
//     serves prerendered HTML in the default locale; the
//     `LanguageToggle` re-render is purely client-side.
//
// Sprint 16+ may wire per-locale prerender bundles via
// `generateStaticParams` if FIL/EN parity proves required at
// first paint. For Sprint 15 the documented happy path is FIL
// out of the gate; EN switch survives reload via the cookie.
// ============================================================

import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, type Locale } from './config'

export async function resolveLocale(): Promise<Locale> {
  // Static prerender has no browser context. Always return the
  // build-time default; the client swap happens after hydration.
  return defaultLocale
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale()
  const messages = (await import(`@/../messages/${locale}.json`)).default
  return { locale, messages }
})

export { defaultLocale }
