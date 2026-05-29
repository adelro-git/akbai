'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Capacitor } from '@capacitor/core';
import BottomNav from '@/components/dashboard/bottom-nav';
import SidebarNav from '@/components/dashboard/sidebar-nav';
import SessionGuard from '@/components/auth/session-guard';
import BiometricOverlay from '@/components/auth/biometric-overlay';
import {
  verifyBiometric,
  resetFailureCount,
  MAX_BIOMETRIC_FAILURES,
} from '@/lib/capacitor/biometric';
import { initSentryCapacitor } from '@/lib/sentry/capacitor-init';
import { initRevenueCat } from '@/lib/iap/configure';
import { registerDeepLink } from '@/lib/capacitor/deep-link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { clearScans } from '@/lib/ocr/offline-queue';
import { clear as clearChatQueue } from '@/lib/chat/offline-queue';

// ============================================================
// (app) layout — Sprint 15 Capacitor conversion.
//
// Previously a server component that called `loadPersona()` via
// the server Supabase client. Static export forbids `cookies()`
// (transitively used by the server client), so the persona fetch
// moves to a client `useEffect` that calls `GET /api/profile`.
//
// Why a SKELETON not a placeholder-then-redirect: the layout
// wraps every (app) page. A flash of empty `null` persona is
// visually fine (SidebarNav already degrades) but the sidebar
// itself stays mounted across navigations, so we keep the layout
// shell rendered immediately and only the persona pill swaps
// once `/api/profile` resolves. No skeleton block needed —
// SidebarNav handles `name: null` (renders "AKBai") and `tagline:
// null` (falls back to `t('personaFallbackTagline')` via its own
// `useTranslations` hook).
//
// Auth gate: every (app)/** page already adds its own client
// auth-gate `useEffect` (Sprint 15 batch 1). The layout itself
// stays auth-agnostic — belt-and-braces would re-check the
// session here but adds a duplicate round-trip per page mount.
//
// `metadata` export removed (server-only); the root `app/layout.tsx`
// still ships the PWA manifest reference.
// ============================================================

const KNOWN_BUSINESS_TYPES = [
  'food_baking',
  'online_selling',
  'freelance_creative',
  'sari_sari_retail',
  'food_carinderia',
  'service_salon',
  'other',
] as const;
type KnownBusinessType = (typeof KNOWN_BUSINESS_TYPES)[number];

function isKnownBusinessType(value: string | null): value is KnownBusinessType {
  return value !== null && (KNOWN_BUSINESS_TYPES as readonly string[]).includes(value);
}

interface PersonaState {
  name: string | null;
  tagline: string | null;
}

interface ProfileApiPayload {
  display_name: string | null;
  business_name: string | null;
  business_type: string | null;
  // Sprint 16 — biometric second factor (architect §4).
  biometric_enabled?: boolean;
}

// ============================================================
// Sprint 16 — biometric guard state.
// 'pending'     — initial, before we know whether biometric is required
// 'not-required'— web OR native-with-feature-off → render children
// 'verifying'   — native + enabled, BiometricAuth.authenticate() in flight
// 'failed'      — failed (<3) — show retry overlay
// 'verified'    — render children
// ============================================================

type BiometricStatus = 'pending' | 'not-required' | 'verifying' | 'failed' | 'verified';

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('nav');
  const router = useRouter();
  const [persona, setPersona] = useState<PersonaState>({ name: null, tagline: null });
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus>('pending');
  const [biometricAttemptsRemaining, setBiometricAttemptsRemaining] = useState<number>(
    MAX_BIOMETRIC_FAILURES,
  );

  // ----------------------------------------------------------
  // Sprint 16 — biometric verify loop, extracted as a callable
  // so the retry button on the overlay can re-fire it without
  // re-running the persona fetch. Side effects:
  //   - sets biometricStatus
  //   - on ≥3 failures: signs the user out + redirects to /login
  // ----------------------------------------------------------
  const runBiometricVerify = useCallback(async () => {
    setBiometricStatus('verifying');
    const { verified, failureCount } = await verifyBiometric();
    if (verified) {
      setBiometricStatus('verified');
      return;
    }
    if (failureCount >= MAX_BIOMETRIC_FAILURES) {
      // Hard fallback — sign out, force OTP. Reset the counter so a
      // future enable doesn't start from 3-strikes-already-bricked.
      await resetFailureCount();
      try {
        const supabase = createClient();
        // F5 (security): captured offline receipt images + queued chat drafts
        // sit unencrypted in localStorage. Wipe them on this forced sign-out so
        // a session's PII (resibo photos, message text) never outlives that
        // session on a shared device. Best-effort — both clears are no-throw
        // SSR-safe no-ops. Mirrors profile-view.tsx.
        clearScans();
        clearChatQueue();
        await supabase.auth.signOut();
      } catch {
        // signOut should never throw, but if it does the redirect
        // below still happens — the session-watcher will catch up.
      }
      // window.location.href instead of router.replace: we want the
      // hardest possible context reset (clear React tree, dump any
      // in-memory state, force a full re-bootstrap on /login).
      window.location.href = '/login?error=biometric_failed';
      return;
    }
    setBiometricAttemptsRemaining(MAX_BIOMETRIC_FAILURES - failureCount);
    setBiometricStatus('failed');
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPersona() {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
          // 401 (no session yet) is expected on first paint when
          // session is still rehydrating; the per-page auth gate
          // will then push to /login. Leave persona null — sidebar
          // degrades to "AKBai" until the gate resolves.
          // Biometric guard: also skip — we can't verify a user
          // we don't have a session for (per architect §4: biometric
          // is a SECOND factor, never first).
          if (!cancelled) setBiometricStatus('not-required');
          return;
        }
        const json = (await res.json()) as
          | { success: true; data: ProfileApiPayload }
          | { success: false };
        if (cancelled || !json.success) {
          if (!cancelled) setBiometricStatus('not-required');
          return;
        }

        const { display_name, business_name, business_type, biometric_enabled } = json.data;
        const name = business_name ?? display_name ?? null;

        let tagline: string | null = null;
        if (business_type) {
          if (business_type.startsWith('other:')) {
            const custom = business_type.slice('other:'.length).trim();
            tagline = custom.length > 0 ? custom : t('businessTypeLabel.other');
          } else if (isKnownBusinessType(business_type)) {
            tagline = t(`businessTypeLabel.${business_type}`);
          }
        }

        setPersona({ name, tagline });

        // ----------------------------------------------------------
        // Sprint 16 — biometric on-open guard (architect §4 + §7 #3).
        // Branches:
        //   web                              → not-required
        //   native + biometric_enabled=false → not-required
        //   native + biometric_enabled=true  → run verify
        // ----------------------------------------------------------
        if (!Capacitor.isNativePlatform()) {
          if (!cancelled) setBiometricStatus('not-required');
          return;
        }
        if (biometric_enabled !== true) {
          if (!cancelled) setBiometricStatus('not-required');
          return;
        }
        if (!cancelled) {
          void runBiometricVerify();
        }
      } catch {
        // Network failure — leave persona null. SidebarNav already
        // renders a safe fallback so there's no visible break.
        // Biometric also defaults to not-required: a no-network app
        // open shouldn't hard-brick on a biometric verify we couldn't
        // even decide to fire.
        if (!cancelled) setBiometricStatus('not-required');
      }
    }

    void loadPersona();
    return () => {
      cancelled = true;
    };
  }, [t, runBiometricVerify]);

  // ----------------------------------------------------------
  // Sprint 16 — deep-link listener (architect §5). Native-only;
  // returns a no-op cleanup on web. Mount once per layout life.
  // ----------------------------------------------------------
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const cleanup = registerDeepLink((path) => {
      router.replace(path);
    });
    return () => {
      void cleanup();
    };
  }, [router]);

  // ----------------------------------------------------------
  // Sprint 16 — Sentry native crash SDK init (architect §6).
  // Native-only; web continues with @sentry/nextjs unchanged.
  // ----------------------------------------------------------
  useEffect(() => {
    void initSentryCapacitor();
  }, []);

  // ----------------------------------------------------------
  // Sprint 17 — RevenueCat configure on app open (architect §2).
  // Native-only; web no-op. The init call needs user.id for
  // Purchases.configure({ appUserID }); we fetch it via
  // supabase.auth.getUser() here because the persona load
  // useEffect above calls /api/profile but doesn't surface the
  // raw auth id. The idempotent guard inside initRevenueCat()
  // makes accidental re-fires safe.
  // ----------------------------------------------------------
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    async function configure() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        await initRevenueCat(user?.id ?? null);
      } catch (err) {
        // Non-fatal — PaywallModal (Sprint 17 batch 3) will defer-init
        // on first display if this layout-level init failed.
        // eslint-disable-next-line no-console
        console.error('[iap] layout configure failed', err);
      }
    }
    void configure();
    return () => {
      cancelled = true;
    };
  }, []);

  // ----------------------------------------------------------
  // Render gate: while biometric is verifying or failed, the overlay
  // covers children completely. NEVER render children underneath an
  // unverified session (Apple Guideline 4.2 reviewer signal).
  //
  // 'pending' renders the shell scaffolding but with no children
  // body — keeps SidebarNav warmed up while the persona fetch
  // resolves. (The shell itself doesn't leak any user-scoped data.)
  // ----------------------------------------------------------
  const showOverlay =
    biometricStatus === 'verifying' || biometricStatus === 'failed';
  const showChildren =
    biometricStatus === 'not-required' || biometricStatus === 'verified';

  return (
    <>
      <SessionGuard />
      <SidebarNav persona={persona} />
      <div className="tablet:ml-60">{showChildren ? children : null}</div>
      <BottomNav />
      {showOverlay && (
        <BiometricOverlay
          status={biometricStatus === 'verifying' ? 'verifying' : 'failed'}
          attemptsRemaining={biometricAttemptsRemaining}
          onRetry={biometricStatus === 'failed' ? () => void runBiometricVerify() : undefined}
        />
      )}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `,
        }}
      />
    </>
  );
}
