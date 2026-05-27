// ============================================================
// Sprint 15 (Capacitor static export) — client-side locale switch
//
// Static export forbids `'use server'`, so the original cookie-
// writing server action is replaced with a browser-side cookie
// write + localStorage backup + hard reload. The reload is the
// trigger that picks up the new message bundle on the next
// request (next-intl re-runs `request.ts` per nav, but in static
// export the bundle was inlined at build time — see comment in
// `request.ts`).
//
// `localStorage` is belt-and-braces: Capacitor's WebView has
// occasionally been observed to lose document.cookie state on
// app cold start. The `LanguageToggle` reads neither at runtime
// (`useLocale()` does), but the value is here so future client-
// side bootstrap can rehydrate the user choice if/when we move
// to per-locale prerender.
// ============================================================

import { isLocale, localeCookieName, type Locale } from './config'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365
const LOCAL_STORAGE_KEY = 'akbai_locale'

export async function setLocaleCookie(locale: Locale): Promise<void> {
  if (!isLocale(locale)) {
    throw new Error(`Invalid locale: ${String(locale)}`)
  }

  // SSR / build-time guard. The function is only meaningfully
  // callable in the browser; on the server it is a no-op so the
  // module remains safe to import from client trees that ship
  // to prerender.
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return
  }

  document.cookie =
    `${localeCookieName}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`

  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, locale)
  } catch {
    // localStorage may be unavailable (private-mode Safari, some
    // WebView configs). The cookie is the source of truth; the
    // localStorage write is best-effort backup.
  }

  // Force a full reload so the inlined static-export bundle is
  // re-fetched. `router.refresh()` would not re-run the build-
  // time message import — only a hard reload does.
  window.location.reload()
}
