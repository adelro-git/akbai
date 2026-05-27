'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ============================================================
// Sprint 15 (Capacitor static export) — auth callback client page
//
// Previously a server route handler (`route.ts`) that used the
// server Supabase client + `cookies()` to exchange the PKCE code.
// Static export forbids both, so the exchange moves to the
// browser Supabase client, which stores its own code_verifier in
// localStorage (the standard supabase-js client default).
//
// Trigger surface: clicked magic-link emails. AKBai's primary
// login flow uses `signInWithOtp` + `verifyOtp` (6-digit paste);
// the magic-link click is the secondary path Supabase always
// emits. Capacitor deep-link config routes `https://akbai.app/auth/callback`
// to the WebView.
//
// `useSearchParams()` requires a Suspense boundary under
// `output: 'export'` (Next 16) or the prerender hard-fails.
//
// Security flag (review-security follow-up): verify
// `exchangeCodeForSession` in the browser client picks up the
// correct `code_verifier` inside Capacitor's sandboxed
// localStorage — if it doesn't, magic-link logins silently fail.
// Out-of-scope for batch-2 implementation; logged in PR.
// ============================================================

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackShell message="Sandali lang…" />}>
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'pending' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      window.location.href = `/login?error=${encodeURIComponent(errorParam)}`;
      return;
    }

    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';

    if (!code) {
      window.location.href = '/login?error=auth_callback_error';
      return;
    }

    const supabase = createClient();
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error: exchangeError }) => {
        if (exchangeError) {
          setStatus('error');
          setErrorMessage(exchangeError.message);
          // Brief pause so the user sees a message before bouncing.
          window.setTimeout(() => {
            window.location.href = '/login?error=auth_callback_error';
          }, 1500);
          return;
        }
        window.location.href = next;
      })
      .catch((err: unknown) => {
        // Hard-fail (network, missing verifier, etc.). Same path
        // as a returned error — render briefly, then redirect.
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'May problema sa pag-login.'
        );
        window.setTimeout(() => {
          window.location.href = '/login?error=auth_callback_error';
        }, 1500);
      });
  }, [searchParams]);

  if (status === 'error') {
    return (
      <CallbackShell
        message={errorMessage ?? 'May problema sa pag-login. Subukan muli.'}
      />
    );
  }
  return <CallbackShell message="Pinapasok ka namin…" />;
}

function CallbackShell({ message }: { message: string }) {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4 text-center">
      <p className="text-on-surface-variant text-sm">{message}</p>
    </main>
  );
}
