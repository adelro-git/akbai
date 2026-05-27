import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import LoginForm from '@/components/auth/login-form';
import LoginBanner from '@/components/auth/login-banner';
import { PageBackground } from '@/components/ui/page-background';
import { KaiSitting } from '@/components/illustrations/kai';
import { CapizPattern } from '@/components/illustrations/svg/decorative/CapizPattern';
import { FloatingPetals } from '@/components/illustrations/svg/decorative/FloatingPetals';

export const metadata: Metadata = {
  title: 'Login — AKBai',
};

// ============================================================
// Phase 6 — Login redesign.
// KaiSitting hero (168px) + Fraunces serif title + ambient
// FloatingPetals (4 petals — perf-light, day-1 visible) + a
// single CapizPattern background. Form internals untouched.
// ============================================================

export default async function LoginPage() {
  const t = await getTranslations('auth.login');
  return (
    <PageBackground variant="login">
      <main
        className="relative min-h-dvh flex flex-col items-center justify-center px-6 py-12 overflow-hidden"
        data-testid="login-page"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <CapizPattern opacity={0.1} />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <FloatingPetals count={4} />
        </div>

        <section className="relative w-full max-w-md tablet:max-w-lg flex flex-col gap-10">
          <header className="flex flex-col items-center text-center gap-5">
            <KaiSitting size={168} animated />
            <div className="space-y-2">
              <h1 className="font-serif text-3xl tablet:text-4xl font-medium leading-tight tracking-tight text-on-surface">
                {t('title')}
              </h1>
              <p className="text-on-surface-variant leading-relaxed max-w-[320px] mx-auto">
                {t('subtitle')}
              </p>
            </div>
          </header>

          {/*
            Sprint 16 UX gap 1 — surfaces ?error=biometric_failed and
            ?error=auth_callback_error. The (app) layout hard-redirects
            here after 3 consecutive biometric failures (Apple 4.2
            reviewer signal); without this banner the user lands on a
            silent sign-out and assumes the app crashed.
            LoginBanner ships its own <Suspense> wrapper internally.
          */}
          <LoginBanner />

          <LoginForm />

          <div className="relative flex items-center py-2" aria-hidden>
            <div className="flex-grow border-t border-outline-soft/40" />
            <span className="flex-shrink mx-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-honey-deep/70">
              {t('secureAccess')}
            </span>
            <div className="flex-grow border-t border-outline-soft/40" />
          </div>

          <footer className="text-center space-y-3">
            <p className="text-on-surface-variant text-sm">
              {t('noAccount')} <span className="text-honey-deep font-bold">{t('autoSignup')}</span>
            </p>
            <p className="text-on-surface-variant/70 text-[11px] leading-relaxed max-w-[320px] mx-auto">
              {t('disclaimer')}
            </p>
          </footer>
        </section>
      </main>
    </PageBackground>
  );
}
