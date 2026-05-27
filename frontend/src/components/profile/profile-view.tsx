'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Building2, Settings, LogOut, ChevronLeft, CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { BUSINESS_TYPE_LABELS, INCOME_RANGE_LABELS } from '@/lib/constants/business-options';
import { BIR_TAX_TYPE_LABELS, type BirTaxType } from '@/lib/deadlines/types';
import { trackSignedOut } from '@/lib/posthog/events';
import ProfileEditForm from './profile-edit-form';
import ThemeToggle from './theme-toggle';
import InstallGuide from '@/components/pwa/install-guide';
import NotificationSettings from './notification-settings';
import BiometricToggle from './biometric-toggle';
import { PaywallModal } from '@/components/subscription/paywall-modal';
import { RestorePurchasesLink } from '@/components/subscription/restore-purchases-link';

interface ProfileViewProps {
  displayName: string | null;
  email: string | null;
  businessName: string | null;
  businessType: string | null;
  incomeRange: string | null;
  birRegistered: boolean;
  birTaxType: string | null;
  // Sprint 16 — biometric second factor (architect §4 + migration 021).
  biometricEnabled: boolean;
  biometricSetupAt: string | null;
  profileVersion: number;
}

export default function ProfileView({
  displayName,
  email,
  businessName,
  businessType,
  incomeRange,
  birRegistered,
  birTaxType,
  biometricEnabled,
  biometricSetupAt,
  profileVersion,
}: ProfileViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  // Sprint 17 (architect §8 line 1062): /profile manual paywall trigger.
  // Apple Guideline 3.1.1: restore link MUST be visible here too.
  const [paywallOpen, setPaywallOpen] = useState(false);
  // UX review fix: section heading + restore prompt copy were hardcoded —
  // route through i18n. The restore prompt reuses paywall.cta.restore
  // which already says "May dating purchase ka na? I-restore mo dito."
  const tProfile = useTranslations('profile.section');
  const tPaywallCta = useTranslations('paywall.cta');

  // Local state for optimistic updates after save
  const [localData, setLocalData] = useState({
    displayName,
    businessName,
    businessType,
    incomeRange,
    birRegistered,
    birTaxType,
    profileVersion,
  });

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      trackSignedOut();
      await supabase.auth.signOut();
      router.push('/login');
    } catch {
      setSigningOut(false);
    }
  };

  const handleSaveSuccess = (updated: {
    display_name: string | null;
    business_name: string | null;
    business_type: string | null;
    income_range: string | null;
    bir_registered: boolean;
    bir_tax_type: string | null;
    profile_version: number;
  }) => {
    setLocalData({
      displayName: updated.display_name,
      businessName: updated.business_name,
      businessType: updated.business_type,
      incomeRange: updated.income_range,
      birRegistered: updated.bir_registered,
      birTaxType: updated.bir_tax_type,
      profileVersion: updated.profile_version,
    });
    setEditing(false);
  };

  const businessTypeLabel = localData.businessType
    ? BUSINESS_TYPE_LABELS[localData.businessType] ?? localData.businessType
    : 'Hindi pa na-set';

  const incomeRangeLabel = localData.incomeRange
    ? INCOME_RANGE_LABELS[localData.incomeRange] ?? localData.incomeRange
    : 'Hindi pa na-set';

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto" data-testid="profile-view">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors"
          aria-label="Back to dashboard"
          data-testid="profile-back-btn"
        >
          <ChevronLeft className="w-6 h-6 text-on-surface" />
        </button>
        <h1 className="text-xl font-bold text-on-surface">Profile Mo</h1>
      </header>

      <div className="px-4 flex flex-col gap-4">
        {/* ─── Ikaw Section ─── */}
        <section
          className="bg-surface-container rounded-2xl p-4"
          aria-label="Personal info"
          data-testid="section-ikaw"
        >
          <div className="flex items-center gap-2 mb-3">
            <User className="w-5 h-5 text-primary-container" />
            <h2 className="text-base font-semibold text-on-surface">Ikaw</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-on-surface-variant">Pangalan</p>
              <p className="text-sm font-medium text-on-surface" data-testid="display-name">
                {localData.displayName ?? 'Boss'}
              </p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">Email</p>
              <p className="text-sm font-medium text-on-surface" data-testid="email">
                {email ?? '—'}
              </p>
            </div>
          </div>
        </section>

        {/* ─── Negosyo Mo Section ─── */}
        <section
          className="bg-surface-container rounded-2xl p-4"
          aria-label="Business info"
          data-testid="section-negosyo"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-container" />
              <h2 className="text-base font-semibold text-on-surface">Negosyo Mo</h2>
            </div>
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-sm font-semibold text-primary-container min-w-[44px] min-h-[44px] flex items-center justify-center"
                data-testid="edit-btn"
              >
                I-edit
              </button>
            )}
          </div>

          {editing ? (
            <ProfileEditForm
              displayName={localData.displayName}
              businessName={localData.businessName}
              businessType={localData.businessType}
              incomeRange={localData.incomeRange}
              birRegistered={localData.birRegistered}
              birTaxType={localData.birTaxType}
              onSave={handleSaveSuccess}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div className="space-y-3" data-testid="business-info-readonly">
              <div>
                <p className="text-xs text-on-surface-variant">Pangalan ng negosyo</p>
                <p className="text-sm font-medium text-on-surface" data-testid="business-name">
                  {localData.businessName ?? 'Hindi pa na-set'}
                </p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Type ng negosyo</p>
                <p className="text-sm font-medium text-on-surface" data-testid="business-type">
                  {businessTypeLabel}
                </p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Monthly income mo</p>
                <p className="text-sm font-medium text-on-surface" data-testid="income-range">
                  {incomeRangeLabel}
                </p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">BIR Registered</p>
                <p className="text-sm font-medium text-on-surface" data-testid="bir-status">
                  {localData.birRegistered ? 'Oo' : 'Hindi'}
                </p>
              </div>
              {localData.birRegistered && (
                <div>
                  <p className="text-xs text-on-surface-variant">BIR Tax Type</p>
                  <p className="text-sm font-medium text-on-surface" data-testid="bir-tax-type">
                    {localData.birTaxType
                      ? BIR_TAX_TYPE_LABELS[localData.birTaxType as BirTaxType] ?? localData.birTaxType
                      : 'Hindi pa na-set'}
                  </p>
                </div>
              )}
              <p className="text-[10px] text-on-surface-variant mt-1">
                Profile v{localData.profileVersion}
              </p>
            </div>
          )}
        </section>

        {/* ─── Notification Settings Section ─── */}
        <NotificationSettings />

        {/* ─── Subscription Section (Sprint 17, architect §4 + §8 line 1062) ─── */}
        {/* Mag-upgrade button → PaywallModal source='manual'.            */}
        {/* RestorePurchasesLink visible per Apple Guideline 3.1.1.        */}
        <section
          className="bg-surface-container rounded-2xl p-4"
          aria-label={tProfile('subscription')}
          data-testid="section-subscription"
        >
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-primary-container" />
            <h2 className="text-base font-semibold text-on-surface">{tProfile('subscription')}</h2>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-on-surface-variant">
              {tPaywallCta('restore')}
            </p>
            <RestorePurchasesLink
              testId="profile-restore-link"
              className="min-h-[44px] inline-flex items-center text-sm text-primary-container underline underline-offset-2 transition-opacity hover:opacity-80 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setPaywallOpen(true)}
              className="block w-full min-h-[44px] rounded-xl bg-primary-container text-on-primary-container font-semibold text-sm py-3 transition-opacity hover:opacity-90 active:opacity-80"
              data-testid="profile-manual-upgrade-cta"
            >
              Mag-upgrade
            </button>
          </div>
        </section>

        {/* ─── Biometric Section (Sprint 16, architect §4) ─── */}
        <BiometricToggle
          initialEnabled={biometricEnabled}
          initialSetupAt={biometricSetupAt}
        />

        {/* ─── PWA Install Section ─── */}
        <section
          className="bg-surface-container rounded-2xl p-4"
          aria-label="Install AKBai"
          data-testid="section-install"
        >
          <InstallGuide showDismiss={false} variant="settings" />
        </section>

        {/* ─── App Section ─── */}
        <section
          className="bg-surface-container rounded-2xl p-4"
          aria-label="App settings"
          data-testid="section-app"
        >
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-5 h-5 text-primary-container" />
            <h2 className="text-base font-semibold text-on-surface">App</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-on-surface">Version</p>
              <p className="text-sm text-on-surface-variant">0.1.0</p>
            </div>

            <ThemeToggle />

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-2 w-full min-h-[44px] text-destructive hover:bg-destructive/10 rounded-xl px-3 py-2 transition-colors disabled:opacity-50"
              data-testid="sign-out-btn"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-semibold">
                {signingOut ? 'Signing out...' : 'Mag-sign out'}
              </span>
            </button>
          </div>
        </section>
      </div>

      {/* Sprint 17 — manual paywall (source='manual') wired to Subscription CTA. */}
      <PaywallModal
        open={paywallOpen}
        source="manual"
        onClose={() => setPaywallOpen(false)}
      />
    </div>
  );
}
