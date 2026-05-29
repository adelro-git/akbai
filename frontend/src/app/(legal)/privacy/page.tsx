'use client';

// ============================================================
// /privacy — Privacy Policy (DRAFT)
//
// Static content page. Client component ('use client') so it is
// safe under Capacitor static export (output: 'export') — no server
// data fetch, no server-only Metadata export, no useSearchParams.
//
// ⚠️ This is a DRAFT for review by a licensed Philippine attorney
// before publication. See Gap A2 (gap-registry.md) and the
// security-compliance skill: "Engage a PH tech lawyer — do NOT
// self-draft." Every bracketed [PLACEHOLDER] must be resolved by
// Anton + counsel before this page goes live.
//
// Outside the (app) route group on purpose: legal pages must be
// publicly reachable WITHOUT auth, the bottom-nav, or the biometric
// overlay. No (app)/layout.tsx wrapper applies here.
// ============================================================

import Link from 'next/link';
import { PageBackground } from '@/components/ui/page-background';

// Resolve before publication. Effective date is the date counsel signs off.
const LAST_UPDATED = '[EFFECTIVE DATE — set on lawyer sign-off]';
const CONTACT_EMAIL = '[privacy@akbai.app — confirm before launch]';
const DPO_NAME = 'Anton del Rosario (initial DPO)';
const ENTITY_NAME = '[Registered entity name — DTI/SEC pending]';
const NPC_REG_NO = '[NPC Registration No. — pending filing]';

function DraftBanner() {
  return (
    <div
      role="alert"
      className="mb-8 rounded-2xl border-2 border-amber-500 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <p className="font-semibold">
        ⚠️ DRAFT — NOT LEGAL ADVICE.
      </p>
      <p className="mt-1">
        Requires review &amp; sign-off by a licensed Philippine attorney before
        publication (NPC RA 10173 compliance). Bracketed [placeholders] are
        unresolved and must be completed by the data controller and counsel.
      </p>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-8 scroll-mt-6">
      <h2 className="text-xl font-semibold text-on-surface">{title}</h2>
      <div className="mt-3 space-y-3 text-base leading-relaxed text-on-surface-variant">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <PageBackground variant="profile">
      <main className="mx-auto min-h-dvh max-w-[720px] bg-background/80 px-5 py-10 sm:px-6">
        <DraftBanner />

        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-on-surface-variant">
            AKBai — Katuwang ng Negosyo Mo
          </p>
          <h1 className="mt-1 text-3xl font-bold text-on-surface">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="mt-4 text-base leading-relaxed text-on-surface-variant">
            Pinapahalagahan namin ang privacy mo. This Privacy Policy explains
            what personal and business data AKBai collects, why we collect it,
            who we share it with, and the rights you have under the Philippine
            Data Privacy Act of 2012 (Republic Act No. 10173, &quot;RA
            10173&quot;). Plain-language summaries are provided so it is easy to
            follow.
          </p>
        </header>

        <Section id="controller" title="1. Who we are (Data Controller)">
          <p>
            AKBai is operated by {ENTITY_NAME} (&quot;AKBai&quot;,
            &quot;we&quot;, &quot;us&quot;), founded by Anton del Rosario. For
            purposes of RA 10173, AKBai is the Personal Information Controller
            (PIC) for the data described here.
          </p>
          <p>
            <strong>Data Protection Officer (DPO):</strong> {DPO_NAME}. You can
            reach our DPO at{' '}
            <span className="font-medium text-on-surface">{CONTACT_EMAIL}</span>.
          </p>
          <p>
            <strong>NPC Registration:</strong> {NPC_REG_NO}.
          </p>
        </Section>

        <Section id="data-we-collect" title="2. What data we collect and why">
          <p>
            We collect only what AKBai needs to act as your business partner.
            The categories below map to how the app actually works.
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Account &amp; identity</strong> — your email address (used
              for magic-link / one-time-passcode sign-in), and a display name if
              you provide one. <em>Why:</em> to create and secure your account.
            </li>
            <li>
              <strong>Business profile</strong> — business name, business type,
              income range, and BIR registration details you share during
              onboarding (&quot;Kilala Kita&quot;). <em>Why:</em> to personalise
              Kai&apos;s insights and surface the right BIR deadlines.
            </li>
            <li>
              <strong>Financial records</strong> — daily sales and expenses you
              record, categories, and amounts (stored in centavos).{' '}
              <em>Why:</em> to compute your cash position, trends, and summaries.
            </li>
            <li>
              <strong>Receipt images &amp; OCR text</strong> — photos of
              receipts you scan and the text extracted from them.{' '}
              <em>Why:</em> to turn receipts into structured expense entries.
            </li>
            <li>
              <strong>Conversations with Kai</strong> — the messages you
              exchange with our AI assistant. <em>Why:</em> to provide replies,
              briefings, and continuity across sessions.
            </li>
            <li>
              <strong>Subscription &amp; billing status</strong> — your tier
              (Starter, Pro Monthly, Pro Annual) and entitlement status.{' '}
              <em>Why:</em> to unlock the features you paid for. We do{' '}
              <strong>not</strong> store your card or payment-method numbers —
              those are handled by Apple, Google, and RevenueCat (see §3).
            </li>
            <li>
              <strong>Device &amp; usage data</strong> — app interactions,
              feature usage, crash reports, device type, and a push-notification
              token if you opt in. <em>Why:</em> to keep the app stable, send
              reminders, and improve the product.
            </li>
          </ul>
          <p>
            <strong>Sensitive information:</strong> Under RA 10173, financial
            information is treated with heightened protection. We apply stricter
            access controls and encryption to your financial records, receipts,
            and BIR information.
          </p>
        </Section>

        <Section id="legal-basis" title="3. Our legal basis for processing">
          <p>We process your data on these lawful bases under RA 10173:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Consent</strong> — you give explicit consent during
              onboarding before any personal data is collected.
            </li>
            <li>
              <strong>Performance of a contract</strong> — to deliver the
              subscription service you signed up for.
            </li>
            <li>
              <strong>Legitimate interests</strong> — to secure the service,
              prevent abuse, and improve features, balanced against your rights.
            </li>
          </ul>
        </Section>

        <Section
          id="processors"
          title="4. Third parties who process data for us"
        >
          <p>
            We use trusted service providers (Personal Information Processors)
            to run AKBai. Each is bound by a Data Processing Agreement and may
            only use your data to provide their service to us.
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Supabase</strong> — database, authentication, and file
              storage (your account, financial records, receipts).
            </li>
            <li>
              <strong>Anthropic (Claude API)</strong> — AI processing. Your Kai
              messages and receipt text are sent to Anthropic to generate
              responses. We rely on Anthropic&apos;s commitment not to train its
              models on API customer data. [Confirm current Anthropic data-use
              terms at sign-off.]
            </li>
            <li>
              <strong>RevenueCat + Apple App Store / Google Play</strong> —
              in-app purchases and subscription management. Only a pseudonymous
              user identifier is shared with RevenueCat — not your name, email,
              or phone.
            </li>
            <li>
              <strong>Sentry</strong> — crash and error monitoring. Configured
              to scrub personal data from error reports.
            </li>
            <li>
              <strong>PostHog</strong> — product analytics. Used to understand
              feature usage; we avoid placing personal data in analytics events.
            </li>
            <li>
              <strong>Email provider</strong> — [Resend, pending DPA] — sends
              sign-in links, BIR deadline reminders, and account notifications.
            </li>
          </ul>
        </Section>

        <Section
          id="transfer"
          title="5. Where your data is stored and transferred"
        >
          <p>
            Some of our processors store data on servers outside the
            Philippines. RA 10173 permits cross-border transfers where there is
            adequate protection or your consent. We rely on our processors&apos;
            contractual safeguards and your consent to this Policy. [Confirm
            Supabase data-region selection at sign-off.]
          </p>
        </Section>

        <Section id="retention" title="6. How long we keep your data">
          <p>
            We keep your data only as long as needed (Gap D11 — data retention):
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>While your account is active</strong> — for as long as you
              use AKBai.
            </li>
            <li>
              <strong>Financial records, receipts, and BIR data</strong> —
              retained for [1 year] after your account becomes inactive or you
              churn, then purged. [Confirm exact period with counsel — note BIR
              record-keeping norms may favour a longer window.]
            </li>
            <li>
              <strong>Conversations with Kai</strong> — retained for [90 days]
              after churn, then purged.
            </li>
            <li>
              <strong>On deletion request</strong> — your data is soft-deleted
              immediately and permanently purged within 7 calendar days (see
              §7).
            </li>
          </ul>
        </Section>

        <Section id="rights" title="7. Your rights under RA 10173">
          <p>As a data subject, you have the right to:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Be informed</strong> — about how your data is processed
              (this Policy).
            </li>
            <li>
              <strong>Access</strong> — request a copy of the personal data we
              hold about you.
            </li>
            <li>
              <strong>Rectify / correct</strong> — fix inaccurate data (you can
              edit much of this in your profile settings).
            </li>
            <li>
              <strong>Erasure / blocking</strong> — request deletion of your
              data.
            </li>
            <li>
              <strong>Object</strong> — opt out of non-essential processing.
            </li>
            <li>
              <strong>Data portability</strong> — receive your data in a
              machine-readable format.
            </li>
            <li>
              <strong>Damages</strong> — claim compensation for harm from
              unlawful processing.
            </li>
            <li>
              <strong>File a complaint</strong> — with the National Privacy
              Commission (see §11).
            </li>
          </ul>
          <p>
            <strong>How to exercise your rights:</strong> Email us at{' '}
            <span className="font-medium text-on-surface">{CONTACT_EMAIL}</span>.
            We will respond within a reasonable time. Deletion requests are
            honoured within 7 calendar days. We may need to verify your identity
            before acting on a request.
          </p>
        </Section>

        <Section id="automated" title="8. AI and automated processing">
          <p>
            AKBai uses AI (Kai) to read receipts, categorise expenses, and
            generate summaries, reminders, and draft messages. These are
            assistive outputs — they do not make legally significant decisions
            about you without your involvement, and you remain responsible for
            your own records and filings. AKBai does not provide tax, legal, or
            financial advice (see our Terms of Service).
          </p>
        </Section>

        <Section id="cookies" title="9. Cookies, analytics, and tracking">
          <p>
            We use a minimal set of cookies and local storage to keep you signed
            in, remember your language preference, and operate the app. We use
            PostHog for product analytics. We do not sell your personal data and
            we do not use third-party advertising trackers. [Confirm a cookie
            consent mechanism with counsel if required for the web build.]
          </p>
        </Section>

        <Section id="children" title="10. Children">
          <p>
            AKBai is intended for business owners and is not directed at children
            under 18. We do not knowingly collect data from children. If you
            believe a child has provided us data, contact us and we will delete
            it.
          </p>
        </Section>

        <Section id="changes" title="11. Changes to this Policy">
          <p>
            We may update this Policy. For material changes, we will notify you
            by email and/or in-app before they take effect. The &quot;Last
            updated&quot; date above reflects the current version.
          </p>
        </Section>

        <Section id="complaints" title="12. Contact us & NPC complaints">
          <p>
            Questions or requests? Contact our DPO at{' '}
            <span className="font-medium text-on-surface">{CONTACT_EMAIL}</span>.
          </p>
          <p>
            If you believe your data privacy rights have been violated, you may
            file a complaint with the{' '}
            <strong>National Privacy Commission (NPC)</strong>:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Website: privacy.gov.ph</li>
            <li>Email: [complaints@privacy.gov.ph — verify current address]</li>
            <li>
              Address: 5th Floor, Philippine International Convention Center,
              Pasay City, Metro Manila [verify current address at sign-off]
            </li>
          </ul>
        </Section>

        <footer className="mt-10 border-t border-outline/30 pt-6 text-sm text-on-surface-variant">
          <p>
            See also our{' '}
            <Link
              href="/terms"
              className="font-medium text-primary underline underline-offset-2"
            >
              Terms of Service
            </Link>
            .
          </p>
          <p className="mt-2 italic">
            ⚠️ DRAFT — not legal advice. Pending review by a licensed Philippine
            attorney.
          </p>
        </footer>
      </main>
    </PageBackground>
  );
}
