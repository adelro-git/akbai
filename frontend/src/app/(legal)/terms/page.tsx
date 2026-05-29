'use client';

// ============================================================
// /terms — Terms of Service (DRAFT)
//
// Static content page. Client component ('use client') so it is
// safe under Capacitor static export (output: 'export') — no server
// data fetch, no server-only Metadata export.
//
// ⚠️ This is a DRAFT for review by a licensed Philippine attorney
// before publication. See Gap A2 (gap-registry.md). Bracketed
// [PLACEHOLDER] values must be resolved by Anton + counsel.
//
// Critical content: the "no tax / legal / financial advice"
// disclaimer in §3 is load-bearing for AKBai's BIR legal posture —
// AKBai surfaces data summaries and reminders, NOT advice.
//
// Outside the (app) route group on purpose: must be publicly
// reachable without auth or the app chrome.
// ============================================================

import Link from 'next/link';
import { PageBackground } from '@/components/ui/page-background';

const LAST_UPDATED = '[EFFECTIVE DATE — set on lawyer sign-off]';
const CONTACT_EMAIL = '[support@akbai.app — confirm before launch]';
const ENTITY_NAME = '[Registered entity name — DTI/SEC pending]';

function DraftBanner() {
  return (
    <div
      role="alert"
      className="mb-8 rounded-2xl border-2 border-amber-500 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <p className="font-semibold">⚠️ DRAFT — NOT LEGAL ADVICE.</p>
      <p className="mt-1">
        Requires review &amp; sign-off by a licensed Philippine attorney before
        publication (NPC RA 10173 compliance). Bracketed [placeholders] are
        unresolved and must be completed before this page goes live.
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

export default function TermsOfServicePage() {
  return (
    <PageBackground variant="profile">
      <main className="mx-auto min-h-dvh max-w-[720px] bg-background/80 px-5 py-10 sm:px-6">
        <DraftBanner />

        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-on-surface-variant">
            AKBai — Katuwang ng Negosyo Mo
          </p>
          <h1 className="mt-1 text-3xl font-bold text-on-surface">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="mt-4 text-base leading-relaxed text-on-surface-variant">
            These Terms of Service (&quot;Terms&quot;) govern your use of AKBai.
            By using the app, you agree to these Terms. Please read them
            carefully — basahin mo muna bago mag-sign up.
          </p>
        </header>

        <Section id="acceptance" title="1. Acceptance of these Terms">
          <p>
            By creating an account or using AKBai, you agree to be bound by these
            Terms and by our{' '}
            <Link
              href="/privacy"
              className="font-medium text-primary underline underline-offset-2"
            >
              Privacy Policy
            </Link>
            . If you do not agree, please do not use the app.
          </p>
        </Section>

        <Section id="eligibility" title="2. Eligibility">
          <p>
            You must be at least 18 years old and capable of entering into a
            binding contract under Philippine law. AKBai is intended for owners
            and operators of micro, small, and medium enterprises (MSMEs). By
            using AKBai you confirm that the information you provide is accurate.
          </p>
        </Section>

        <Section id="service" title="3. What AKBai is — and what it is NOT">
          <p>
            AKBai (&quot;Kai&quot;) is an AI business partner that helps Filipino
            MSME owners record sales and expenses, scan receipts, see cash-flow
            summaries, track BIR deadlines, and draft customer messages.
          </p>
          <div className="rounded-2xl border-2 border-primary/40 bg-primary-container/30 px-5 py-4">
            <p className="font-semibold text-on-surface">
              No tax, legal, or financial advice.
            </p>
            <p className="mt-2">
              AKBai surfaces <strong>data summaries, reminders, and
              estimates</strong> based on the information you enter. It does{' '}
              <strong>NOT</strong> provide tax advice, legal advice, accounting
              advice, or financial advice, and it is not a substitute for a
              licensed professional. BIR deadline reminders and tax-related
              calculations are guides only and may be incomplete or inaccurate.
            </p>
            <p className="mt-2 italic">
              &quot;Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para
              sa opisyal na payo.&quot;
            </p>
            <p className="mt-2">
              You are solely responsible for your own tax filings, deadlines,
              record-keeping, and business decisions. Always consult a Certified
              Public Accountant (CPA) or qualified professional for official
              advice.
            </p>
          </div>
        </Section>

        <Section id="subscriptions" title="4. Subscriptions, in-app purchases & billing">
          <p>
            AKBai offers a free trial and paid tiers, purchased through the Apple
            App Store or Google Play (in-app purchases):
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Free Trial</strong> — 7 days of full access (with usage
              caps). After the trial, a paywall applies.
            </li>
            <li>
              <strong>Starter — ₱299, one-time</strong> — a non-consumable
              purchase (isang beses lang ang bayad). Includes receipt OCR, BIR
              deadline calendar, basic reports, and CSV export. No Kai chat.
            </li>
            <li>
              <strong>Pro Monthly — ₱499 / month</strong> — an auto-renewing
              subscription. Includes everything in Starter plus unlimited Kai
              chat, morning briefings, weekly story, reply drafter, invoicing,
              and multi-device sync.
            </li>
            <li>
              <strong>Pro Annual — ₱4,999 / year</strong> — an auto-renewing
              subscription billed annually (matitipid mo ang ~₱990 vs monthly).
            </li>
          </ul>
          <p>
            <strong>Auto-renewal:</strong> Pro Monthly and Pro Annual renew
            automatically at the end of each billing period unless you cancel at
            least 24 hours before the period ends. Your account will be charged
            for renewal within 24 hours before the current period ends.
          </p>
          <p>
            <strong>Managing & cancelling:</strong> Subscriptions are managed
            through your Apple App Store or Google Play account settings — not
            within AKBai. Cancellation takes effect at the end of the current
            billing period; you keep access until then.
          </p>
          <p>
            <strong>Refunds:</strong> All purchases are processed by Apple or
            Google. Refunds are governed by the App Store / Google Play refund
            policies, not by AKBai. Please direct refund requests to the
            applicable store. Prices are in Philippine Pesos (₱) and may be
            subject to store fees and applicable taxes.
          </p>
        </Section>

        <Section id="acceptable-use" title="5. Acceptable use">
          <p>You agree not to:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>Use AKBai for any unlawful purpose or to violate any law (including BIR or tax law).</li>
            <li>Upload content you do not have the right to upload, or anyone else&apos;s data without authority.</li>
            <li>Attempt to reverse-engineer, scrape, overload, or disrupt the service or its AI systems (including prompt-injection attempts).</li>
            <li>Resell, sublicense, or commercially exploit AKBai without our written permission.</li>
            <li>Share your account credentials or circumvent usage limits, paywalls, or security controls.</li>
          </ul>
          <p>
            We may suspend or terminate accounts that violate these rules.
          </p>
        </Section>

        <Section id="ip" title="6. Intellectual property & your data">
          <p>
            <strong>Our IP:</strong> AKBai, the Kai persona, the app, its
            design, and its content are owned by {ENTITY_NAME} and protected by
            Philippine and international law. We grant you a limited,
            non-exclusive, non-transferable licence to use the app for your
            business.
          </p>
          <p>
            <strong>Your data:</strong> You own the business and financial data
            you enter. You grant us a licence to process it solely to provide and
            improve the service, as described in our Privacy Policy. AI-generated
            outputs are provided for your use, subject to the disclaimers in these
            Terms.
          </p>
        </Section>

        <Section id="disclaimers" title="7. Disclaimers & limitation of liability">
          <p>
            AKBai is provided <strong>&quot;as is&quot;</strong> and{' '}
            <strong>&quot;as available&quot;</strong>, without warranties of any
            kind, whether express or implied, including fitness for a particular
            purpose, accuracy, or uninterrupted availability. We do not warrant
            that AI outputs, summaries, calculations, or BIR reminders are
            complete, accurate, or error-free.
          </p>
          <p>
            To the maximum extent permitted by Philippine law, AKBai and its
            founder shall not be liable for any indirect, incidental, special, or
            consequential damages, or for any loss arising from missed deadlines,
            penalties, incorrect calculations, reliance on AI outputs, or your
            business decisions. [Counsel to confirm any liability cap, e.g.,
            limited to the amount you paid in the preceding 12 months.]
          </p>
          <p>
            Nothing in these Terms excludes liability that cannot be excluded
            under Philippine law.
          </p>
        </Section>

        <Section id="termination" title="8. Termination">
          <p>
            You may stop using AKBai and delete your account at any time (see the
            Privacy Policy for our deletion process). We may suspend or terminate
            your access if you breach these Terms or where required by law.
            Sections that by their nature should survive termination (e.g., IP,
            disclaimers, limitation of liability, governing law) will survive.
          </p>
        </Section>

        <Section id="governing-law" title="9. Governing law & disputes">
          <p>
            These Terms are governed by the laws of the Republic of the
            Philippines. Any dispute shall be subject to the exclusive
            jurisdiction of the courts of [venue — e.g., Metro Manila; counsel to
            confirm], without prejudice to your rights under the Data Privacy Act
            to file a complaint with the National Privacy Commission.
          </p>
        </Section>

        <Section id="changes" title="10. Changes to these Terms">
          <p>
            We may update these Terms. For material changes, we will notify you
            by email and/or in-app before they take effect. Continued use after
            changes take effect means you accept the updated Terms.
          </p>
        </Section>

        <Section id="contact" title="11. Contact">
          <p>
            Questions about these Terms? Contact us at{' '}
            <span className="font-medium text-on-surface">{CONTACT_EMAIL}</span>.
          </p>
        </Section>

        <footer className="mt-10 border-t border-outline/30 pt-6 text-sm text-on-surface-variant">
          <p>
            See also our{' '}
            <Link
              href="/privacy"
              className="font-medium text-primary underline underline-offset-2"
            >
              Privacy Policy
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
