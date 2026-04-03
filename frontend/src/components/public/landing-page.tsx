'use client'

import { useEffect } from 'react'
import { trackLandingPageViewed, trackLandingPageCtaClicked } from '@/lib/posthog/events'
import WaitlistForm from './waitlist-form'

// ─── Pain Point Cards ───────────────────────────────────────────────
const painPoints = [
  {
    emoji: '\uD83D\uDCC4', // clipboard
    title: 'Nakakatakot ang BIR?',
    description:
      'Hindi ka nagiisa. Maraming MSME owners ang stressed sa deadlines, penalties, at forms. Si KA, alam ang BIR calendar mo — para hindi ka ma-late.',
  },
  {
    emoji: '\uD83D\uDCB8', // money with wings
    title: 'Hindi mo alam kung kumikita ka?',
    description:
      'Busy ka sa negosyo pero di mo alam kung tumutubo ba talaga. KA tracks your cash flow daily — para laging clear ang picture.',
  },
  {
    emoji: '\uD83D\uDDD2', // spiral notepad
    title: 'Pagod na sa manual tracking?',
    description:
      'Excel, notebook, GCash screenshots — nakakalat lahat. Snap mo lang ang receipt, tracked na. All in one place.',
  },
] as const

// ─── How It Works Steps ─────────────────────────────────────────────
const steps = [
  {
    step: '1',
    title: 'Kilala Kita',
    description: 'Sabihin mo lang ang tungkol sa negosyo mo — type, income range, at biggest pain point. 2 minutes lang.',
  },
  {
    step: '2',
    title: 'KA Speaks First',
    description: 'Every morning, morning briefing ka ni KA — deadlines, reminders, at insights na relevant sa negosyo mo.',
  },
  {
    step: '3',
    title: 'Track Everything',
    description: 'Receipts, expenses, BIR deadlines — lahat nasa iisang lugar. Snap, type, or voice — bahala ka kung paano.',
  },
] as const

// ─── Pricing Tiers ──────────────────────────────────────────────────
const tiers = [
  {
    name: 'Free',
    price: 0,
    period: '/month',
    features: ['Basic expense tracking', '10 KA queries/day', 'BIR deadline reminders', 'Morning briefing'],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 39900,
    period: '/month',
    features: ['Lahat ng Free features', '50 receipt scans/month', 'Unlimited KA queries', 'Cash flow insights', 'Tax estimate reports'],
    highlighted: true,
  },
  {
    name: 'Business',
    price: 89900,
    period: '/month',
    features: ['Lahat ng Pro features', 'Multi-seat (up to 3 users)', 'Priority support', 'Custom KA training', 'Advanced analytics'],
    highlighted: false,
  },
] as const

function formatPrice(centavos: number): string {
  if (centavos === 0) return '\u20B10'
  return `\u20B1${(centavos / 100).toLocaleString()}`
}

// ─── Landing Page Component ─────────────────────────────────────────
export default function LandingPage() {
  useEffect(() => {
    trackLandingPageViewed()
  }, [])

  function scrollToWaitlist() {
    trackLandingPageCtaClicked('nav')
    const el = document.getElementById('waitlist-bottom')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-dvh bg-background font-sans">
      {/* ─── Floating Nav ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav shadow-ambient">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <span className="text-xl font-extrabold tracking-tight text-on-surface">
            AKB<span className="text-primary-container">ai</span>
          </span>
          <button
            type="button"
            onClick={scrollToWaitlist}
            className="min-h-[44px] min-w-[44px] rounded-lg bg-gradient-to-r from-primary-container to-secondary-container px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-ambient active:scale-[0.98]"
          >
            Join Waitlist
          </button>
        </div>
      </nav>

      {/* ─── Hero Section ─────────────────────────────────────── */}
      <section className="relative overflow-hidden px-5 pb-16 pt-28 sm:pb-24 sm:pt-36">
        <div className="mx-auto max-w-3xl text-center">
          {/* Decorative gradient orb */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[500px] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, hsl(37 90% 51% / 0.4), transparent 70%)',
            }}
            aria-hidden="true"
          />

          <h1
            className="relative text-4xl font-extrabold leading-tight tracking-tight text-on-surface sm:text-5xl md:text-6xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Katuwang ng{' '}
            <span className="bg-gradient-to-r from-primary-container to-secondary-container bg-clip-text text-transparent">
              Negosyo Mo
            </span>
          </h1>

          <p className="relative mx-auto mt-5 max-w-xl text-base leading-relaxed text-on-surface-variant sm:text-lg">
            AI-powered na kaakbay mo sa tax, expenses, at daily operations
            &mdash; para sa Filipino MSMEs.
          </p>

          <div className="relative mt-8 flex flex-col items-center gap-4">
            <WaitlistForm section="hero" />
            <p className="text-xs text-on-surface-variant/70">
              100% free to join &bull; No credit card needed
            </p>
          </div>
        </div>
      </section>

      {/* ─── Pain Points Section ──────────────────────────────── */}
      <section className="bg-surface-container-low px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-center text-2xl font-bold tracking-tight text-on-surface sm:text-3xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Alam namin ang struggle
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-on-surface-variant sm:text-base">
            99.5% ng businesses sa Pilipinas, MSME. Deserve nila ng AI partner.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3 sm:gap-6">
            {painPoints.map((point) => (
              <div
                key={point.title}
                className="landing-fade-in rounded-2xl bg-surface-container-lowest p-6 shadow-ambient transition-shadow hover:shadow-ambient-lg"
              >
                <span className="text-3xl" role="img" aria-hidden="true">
                  {point.emoji}
                </span>
                <h3 className="mt-3 text-lg font-bold text-on-surface">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works Section ─────────────────────────────── */}
      <section className="px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-center text-2xl font-bold tracking-tight text-on-surface sm:text-3xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Paano gumagana si KA?
          </h2>

          <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {steps.map((s) => (
              <div key={s.step} className="landing-fade-in text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-container to-secondary-container text-lg font-extrabold text-white">
                  {s.step}
                </div>
                <h3 className="mt-4 text-lg font-bold text-on-surface">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Preview Section ──────────────────────────── */}
      <section className="bg-surface-container-low px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-center text-2xl font-bold tracking-tight text-on-surface sm:text-3xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-on-surface-variant sm:text-base">
            97% cheaper than hiring a bookkeeper (avg{' '}
            <span className="font-extrabold text-on-surface">{'\u20B1'}11,800/mo</span>)
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3 sm:gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`landing-fade-in relative rounded-2xl p-6 transition-shadow ${
                  tier.highlighted
                    ? 'bg-surface-container-lowest shadow-ambient-lg ring-2 ring-primary-container/30'
                    : 'bg-surface-container-lowest shadow-ambient'
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary-container to-secondary-container px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-on-surface">{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span
                    className="text-3xl font-extrabold text-on-surface"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {formatPrice(tier.price)}
                  </span>
                  <span className="text-sm text-on-surface-variant">{tier.period}</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-on-surface-variant"
                    >
                      <span className="mt-0.5 text-tertiary" aria-hidden="true">
                        &#10003;
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-on-surface-variant/70">
            Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo.
          </p>
        </div>
      </section>

      {/* ─── Final CTA Section ────────────────────────────────── */}
      <section id="waitlist-bottom" className="px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Hindi ka nag-iisa sa negosyo mo.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-on-surface-variant sm:text-base">
            Join the waitlist at maging isa sa unang mag-try ng AKBai &mdash;
            your AI-powered na katuwang sa hustle.
          </p>
          <div className="mt-8 flex justify-center">
            <WaitlistForm section="bottom_cta" />
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="bg-surface-container-low px-5 py-8">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-lg font-extrabold tracking-tight text-on-surface">
            AKB<span className="text-primary-container">ai</span>
          </span>
          <p className="mt-2 text-xs text-on-surface-variant/70">
            Katuwang ng Negosyo Mo &bull; Made with{' '}
            <span aria-label="love">&hearts;</span> in the Philippines
          </p>
          <p className="mt-1 text-xs text-on-surface-variant/50">
            &copy; {new Date().getFullYear()} AKBai. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  )
}
