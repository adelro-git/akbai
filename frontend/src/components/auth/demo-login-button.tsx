'use client';

// ============================================================
// Demo Login Button — App Store / Play reviewer entry point.
// Feature: Reviewer demo bypass (Sprint 18, Gap §11 P0).
//
// Renders a subtle "Demo (para sa reviewer)" button that signs in the seeded
// demo account WITHOUT the email OTP round-trip, by POSTing to /api/demo-login.
//
// VISIBILITY (cosmetic gate only): the button renders ONLY when
//   NEXT_PUBLIC_DEMO_MODE === 'true'. In a normal production build that var is
//   unset, so this returns null and normal users never see it. The REAL
//   enforcement is server-side (DEMO_MODE_ENABLED gates /api/demo-login); this
//   flag just avoids showing a button that would 404 anyway.
//
// Copy is literal conversational Filipino for now (frontend/messages/*.json is
// owned by another stream this sprint). i18n keys reported to PM for wiring.
// ============================================================

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_EMAIL, isDemoButtonVisible } from '@/lib/demo/config';

export default function DemoLoginButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read at render time. NEXT_PUBLIC_* is inlined at build; when unset this is
  // false and the component renders nothing.
  if (!isDemoButtonVisible()) {
    return null;
  }

  return <DemoLoginButtonInner router={router} loading={loading} setLoading={setLoading} error={error} setError={setError} />;
}

// Inner component keeps the early `return null` above the hooks-bearing body so
// hook order stays stable across renders (the visibility flag is build-constant,
// but this is the defensively-correct shape).
function DemoLoginButtonInner({
  router,
  loading,
  setLoading,
  error,
  setError,
}: {
  router: ReturnType<typeof useRouter>;
  loading: boolean;
  setLoading: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
}) {
  const handleDemoLogin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DEMO_EMAIL }),
      });

      if (!res.ok) {
        setError('Hindi available ang demo ngayon. Subukan muli mamaya.');
        return;
      }

      // Genuine cookie session is now set server-side. Land on the dashboard.
      router.push('/');
      router.refresh();
    } catch {
      setError('May problema sa demo sign-in. Subukan muli.');
    } finally {
      setLoading(false);
    }
  }, [router, setLoading, setError]);

  return (
    <div className="space-y-2" data-testid="demo-login">
      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={loading}
        className="w-full min-h-[44px] py-3 px-6 bg-surface-container-low text-on-surface-variant text-sm font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        data-testid="demo-login-btn"
      >
        {loading ? 'Pinapasok ka namin…' : 'Demo (para sa reviewer)'}
      </button>
      {error && (
        <p className="text-on-error-container text-xs text-center" data-testid="demo-login-error">
          {error}
        </p>
      )}
    </div>
  );
}
