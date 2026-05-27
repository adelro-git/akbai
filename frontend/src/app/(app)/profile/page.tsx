'use client';

// ============================================================
// /profile — Client Component (Sprint 15 Capacitor conversion)
//
// Per sprint-15-conversion-pattern.md §3 row 15: standard §2 template,
// fetches the existing /api/profile GET (returns ProfileData). The
// server page used service-client to bypass RLS in SKIP_AUTH=true dev
// mode; that path moves to the API route, which already handles it.
//
// `profileVersion = 1` was a hard-coded constant on the server page; the
// API already exposes `profile_version` so we read it from the response
// rather than re-asserting client-side.
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SKIP_AUTH } from '@/lib/supabase/dev-auth';
import ProfileView from '@/components/profile/profile-view';
import { PageBackground } from '@/components/ui/page-background';

interface ProfileData {
  display_name: string | null;
  email: string | null;
  business_name: string | null;
  business_type: string | null;
  income_range: string | null;
  bir_registered: boolean;
  bir_tax_type: string | null;
  // Sprint 16 — biometric second factor (architect §4 + migration 021).
  biometric_enabled: boolean;
  biometric_setup_at: string | null;
  profile_version: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profile');
      const json = await res.json();
      if (!json.success) {
        setError(json.error?.message_tl ?? 'Hindi makuha ang profile.');
        return;
      }
      setData(json.data as ProfileData);
    } catch {
      setError('Hindi makakonekta. I-check mo ang internet mo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function bootstrap() {
      if (!SKIP_AUTH) {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          router.replace('/login');
          return;
        }
      }
      await fetchData();
    }
    bootstrap().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('profile page bootstrap failed', err);
      setError('Hindi makapag-load. Subukan muli.');
      setLoading(false);
    });
  }, [router, fetchData]);

  if (loading) {
    return (
      <PageBackground variant="profile">
        <div className="min-h-dvh flex items-center justify-center text-on-surface-variant">
          Loading...
        </div>
      </PageBackground>
    );
  }

  if (error || !data) {
    return (
      <PageBackground variant="profile">
        <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
          <p className="text-destructive text-sm mb-2">{error ?? 'Walang data.'}</p>
          <button
            onClick={fetchData}
            type="button"
            className="text-primary text-sm font-semibold"
          >
            Subukan muli
          </button>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground variant="profile">
      <div
        className="min-h-dvh pb-20"
        data-testid="profile-page"
      >
        <ProfileView
          displayName={data.display_name}
          email={data.email}
          businessName={data.business_name}
          businessType={data.business_type}
          incomeRange={data.income_range}
          birRegistered={data.bir_registered}
          birTaxType={data.bir_tax_type}
          biometricEnabled={data.biometric_enabled}
          biometricSetupAt={data.biometric_setup_at}
          profileVersion={data.profile_version}
        />
      </div>
    </PageBackground>
  );
}
