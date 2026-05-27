'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import BottomNav from '@/components/dashboard/bottom-nav';
import SidebarNav from '@/components/dashboard/sidebar-nav';
import SessionGuard from '@/components/auth/session-guard';

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
}

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('nav');
  const [persona, setPersona] = useState<PersonaState>({ name: null, tagline: null });

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
          return;
        }
        const json = (await res.json()) as
          | { success: true; data: ProfileApiPayload }
          | { success: false };
        if (cancelled || !json.success) {
          return;
        }

        const { display_name, business_name, business_type } = json.data;
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
      } catch {
        // Network failure — leave persona null. SidebarNav already
        // renders a safe fallback so there's no visible break.
      }
    }

    void loadPersona();
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <>
      <SessionGuard />
      <SidebarNav persona={persona} />
      <div className="tablet:ml-60">{children}</div>
      <BottomNav />
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
