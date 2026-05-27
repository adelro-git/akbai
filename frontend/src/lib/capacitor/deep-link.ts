'use client';

/**
 * Capacitor Deep Link — listen for inbound `com.akbai.app://` URLs and
 * forward them to the Next.js router.
 *
 * Feature: Deep Linking (Sprint 16, Gap G4 mitigation — supports magic-link
 *          auth callback returning to the native app from an email client)
 * Role: Native-only @capacitor/app `appUrlOpen` listener that parses the
 *       inbound URL and routes the user to the in-app path. Web is a no-op.
 *
 * Scope (Sprint 16): handles `com.akbai.app://auth/callback?code=…&next=…`.
 *                    The /auth/callback page (Sprint 15 PKCE exchange) is
 *                    UNTOUCHED in its core logic — deep-link routes inbound
 *                    URLs onto it and the existing useSearchParams handler
 *                    takes over.
 *
 * Architect reference: sprint-16-native-plugin-pattern.md §5.
 *
 * Design choice — `forwardPath` instead of receiving a router directly:
 *   we pass a callback that receives a string path. This keeps the module
 *   router-implementation-agnostic and trivially testable: the test asserts
 *   that the right path string is passed, no need to fake `next/navigation`.
 */

import { Capacitor } from '@capacitor/core';
import { App, type URLOpenListenerEvent } from '@capacitor/app';

/** Type of the navigation callback the listener invokes. */
export type DeepLinkForwarder = (path: string) => void;

// ============================================================
// Public — parse an inbound deep-link URL and return the in-app path
// it should map to. Returns null when the URL doesn't match any known
// host/path. Exported so vitest can test the parser without faking
// the App plugin.
//
// Supported routes:
//   com.akbai.app://auth/callback?code=X&next=Y → /auth/callback?code=X&next=Y
//
// Future routes (Sprint 17+): just extend the switch on url.host.
// ============================================================

export function parseDeepLinkUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);

    // url.host carries the chunk between `://` and the next `/`. For
    // `com.akbai.app://auth/callback?…` that's `auth`. Note: for some
    // URL parser behaviours, the bundle id `com.akbai.app` may appear
    // as the protocol — handle both shapes defensively.
    if (url.host === 'auth' && url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const next = url.searchParams.get('next') ?? '/dashboard';
      const error = url.searchParams.get('error');

      // Build the canonical /auth/callback path. The PKCE exchange
      // page already knows how to handle `code` + `next` + `error`.
      const params = new URLSearchParams();
      if (code) params.set('code', code);
      if (next) params.set('next', next);
      if (error) params.set('error', error);

      const qs = params.toString();
      return qs.length > 0 ? `/auth/callback?${qs}` : '/auth/callback';
    }

    return null;
  } catch {
    // Malformed URL — ignore. The listener stays bound for the next event.
    return null;
  }
}

// ============================================================
// Public — register the deep-link listener. Returns a cleanup function
// that removes the listener. Native-only: on web, registerDeepLink is
// a no-op and the cleanup is also a no-op.
//
// Usage in (app)/layout.tsx:
//   useEffect(() => {
//     if (!Capacitor.isNativePlatform()) return;
//     const cleanup = registerDeepLink((path) => router.replace(path));
//     return () => { void cleanup(); };
//   }, [router]);
// ============================================================

export function registerDeepLink(
  forwardPath: DeepLinkForwarder,
): () => Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return async () => {
      // no-op cleanup on web
    };
  }

  // Hold the listener handle so we can remove it on cleanup.
  // App.addListener returns a Promise<PluginListenerHandle>; we keep
  // the unresolved promise so the cleanup can await it.
  const handlePromise = App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    const path = parseDeepLinkUrl(event.url);
    if (path) {
      forwardPath(path);
    }
  });

  return async () => {
    try {
      const handle = await handlePromise;
      await handle.remove();
    } catch {
      // Listener removal failures are non-fatal (the listener just
      // stays bound until WebView teardown). Best-effort cleanup.
    }
  };
}
