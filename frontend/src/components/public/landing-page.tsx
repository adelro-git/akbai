'use client'

import { useEffect, useRef, useCallback } from 'react'
import { trackLandingPageViewed, trackLandingPageCtaClicked } from '@/lib/posthog/events'
import WaitlistForm from './waitlist-form'

// ─── SVG Icon Components ────────────────────────────────────────────
function IconBIR() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="6" y="4" width="20" height="24" rx="3" fill="hsl(37 90% 51% / 0.15)" />
      <path d="M11 11h10M11 15h10M11 19h6" stroke="hsl(37 90% 51%)" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 22l3 3" stroke="hsl(37 90% 51%)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconCashFlow() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="12" fill="hsl(37 90% 51% / 0.15)" />
      <path d="M16 8v16M12 12l4-4 4 4M20 20l-4 4-4-4" stroke="hsl(37 90% 51%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconReceipt() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M8 4h16a2 2 0 012 2v20l-3-2-3 2-3-2-3 2-3-2-3 2V6a2 2 0 012-2z" fill="hsl(37 90% 51% / 0.15)" />
      <path d="M12 10h8M12 14h8M12 18h4" stroke="hsl(37 90% 51%)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconFinance() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="3" y="14" width="4" height="10" rx="1" fill="hsl(161 76% 45%)" />
      <rect x="9" y="10" width="4" height="14" rx="1" fill="hsl(37 90% 51%)" />
      <rect x="15" y="6" width="4" height="18" rx="1" fill="hsl(161 76% 45%)" />
      <rect x="21" y="2" width="4" height="22" rx="1" fill="hsl(37 90% 51%)" />
    </svg>
  )
}

function IconTax() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="20" height="22" rx="3" fill="hsl(37 90% 51% / 0.15)" />
      <path d="M9 9h10M9 13h10M9 17h6" stroke="hsl(37 90% 51%)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="21" cy="21" r="5" fill="hsl(161 76% 45%)" />
      <path d="M19 21l1.5 1.5L23 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconComms() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="18" height="14" rx="3" fill="hsl(37 90% 51% / 0.15)" />
      <rect x="8" y="10" width="18" height="14" rx="3" fill="hsl(161 76% 45% / 0.2)" />
      <path d="M12 14h10M12 18h6" stroke="hsl(161 76% 45%)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconOps() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="11" fill="hsl(37 90% 51% / 0.15)" />
      <path d="M14 7v7l5 3" stroke="hsl(37 90% 51%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconTasks() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="20" height="20" rx="4" fill="hsl(161 76% 45% / 0.15)" />
      <path d="M9 10l2 2 4-4M9 17l2 2 4-4" stroke="hsl(161 76% 45%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCheckmark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill="hsl(161 76% 45% / 0.15)" />
      <path d="M5.5 9l2.5 2.5L12.5 7" stroke="hsl(161 76% 45%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Pain Point Cards ───────────────────────────────────────────────
const painPoints = [
  {
    icon: IconBIR,
    title: 'Nakakatakot ang BIR?',
    description:
      'Hindi ka nagiisa. Maraming MSME owners ang stressed sa deadlines, penalties, at forms. Si Kai, alam ang BIR calendar mo — para hindi ka ma-late.',
  },
  {
    icon: IconCashFlow,
    title: 'Hindi mo alam kung kumikita ka?',
    description:
      'Busy ka sa negosyo pero di mo alam kung tumutubo ba talaga. Kai tracks your cash flow daily — para laging clear ang picture.',
  },
  {
    icon: IconReceipt,
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
    title: 'Kai Speaks First',
    description: 'Every morning, morning briefing ka ni Kai — deadlines, reminders, at insights na relevant sa negosyo mo.',
  },
  {
    step: '3',
    title: 'Track Everything',
    description: 'Receipts, expenses, BIR deadlines — lahat nasa iisang lugar. Snap, type, or voice — bahala ka kung paano.',
  },
] as const

// ─── 5 Pillars ──────────────────────────────────────────────────────
const pillars = [
  {
    icon: IconFinance,
    title: 'Financial Tracking',
    tagline: 'Saan Napunta ang Pera?',
    description: 'Cash flow visibility, expense categorization, at receipt scanning — ₱0.16 per scan lang.',
    accent: 'from-primary-container/10 to-transparent',
  },
  {
    icon: IconTax,
    title: 'BIR Compliance',
    tagline: 'Hindi Na Nakakatakot ang BIR',
    description: 'Deadline calendar, filing guides, quarterly tax estimates, at 7/3/1-day reminders.',
    accent: 'from-tertiary/10 to-transparent',
  },
  {
    icon: IconComms,
    title: 'Customer Comms',
    tagline: 'Reply sa DM, Draft ni Kai',
    description: 'AI-drafted replies sa customer messages. Ikaw na lang mag-review at send.',
    accent: 'from-primary-container/10 to-transparent',
  },
  {
    icon: IconOps,
    title: 'Daily Operations',
    tagline: 'Ang Umaga Mo, Organized',
    description: 'Morning briefing, daily check-in, weekly reconciliation — automated by Kai.',
    accent: 'from-tertiary/10 to-transparent',
  },
  {
    icon: IconTasks,
    title: 'Task Management',
    tagline: 'Alam ni Kai ang Priorities Mo',
    description: 'Proactive task surfacing at deadline-aware scheduling. Hindi ka makakalimot.',
    accent: 'from-primary-container/10 to-transparent',
  },
] as const

// ─── Pricing Tiers ──────────────────────────────────────────────────
const tiers = [
  {
    name: 'Free',
    price: 0,
    period: '/month',
    features: ['Basic expense tracking', '10 Kai queries/day', 'BIR deadline reminders', 'Morning briefing'],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 39900,
    period: '/month',
    features: ['Lahat ng Free features', '50 receipt scans/month', 'Unlimited Kai queries', 'Cash flow insights', 'Tax estimate reports'],
    highlighted: true,
  },
  {
    name: 'Business',
    price: 89900,
    period: '/month',
    features: ['Lahat ng Pro features', 'Multi-seat (up to 3 users)', 'Priority support', 'Custom Kai training', 'Advanced analytics'],
    highlighted: false,
  },
] as const

// ─── Community Quotes (from market sentiment research) ──────────────
const communityQuotes = [
  {
    quote: 'There is a lot of concerns here and my anxiety disorder doesn\'t help.',
    attribution: 'Freelancer, r/taxPH',
    context: 'On BIR filing stress',
  },
  {
    quote: 'Commission fee almost 24-25% now.',
    attribution: 'Online Seller, r/BusinessPH',
    context: 'On rising platform costs',
  },
  {
    quote: 'I\'ve seen her struggle with all the paperworks.',
    attribution: 'Family Member of MSME Owner',
    context: 'On the admin burden',
  },
] as const

// ─── Bold Stats ─────────────────────────────────────────────────────
const boldStats = [
  { number: '74%', label: 'don\'t know if profitable' },
  { number: '₱399', label: 'vs ₱11,800/mo sa bookkeeper' },
  { number: '99.5%', label: 'ng businesses, MSME' },
] as const

// ─── Social Proof Badges ────────────────────────────────────────────
const badges = [
  { text: '5 Pillars', subtext: 'Finance, Tax, Comms, Ops, Tasks' },
  { text: '97% Mas Mura', subtext: 'vs hiring a bookkeeper' },
  { text: '100% Taglish', subtext: 'speaks your language' },
] as const

function formatPrice(centavos: number): string {
  if (centavos === 0) return '\u20B10'
  return `\u20B1${(centavos / 100).toLocaleString()}`
}

// ─── Intersection Observer Hook ─────────────────────────────────────
function useScrollReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  const setupObserver = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    if (!node) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    const elements = node.querySelectorAll('.landing-reveal')
    elements.forEach((el) => observerRef.current?.observe(el))
  }, [])

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return setupObserver
}

// ─── Landing Page Component ─────────────────────────────────────────
export default function LandingPage() {
  const scrollContainerRef = useScrollReveal()

  useEffect(() => {
    trackLandingPageViewed()
  }, [])

  function scrollToWaitlist() {
    trackLandingPageCtaClicked('nav')
    const el = document.getElementById('waitlist-bottom')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  function scrollToContent() {
    trackLandingPageCtaClicked('hero_learn_more')
    const el = document.getElementById('bakit-akbai')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div ref={scrollContainerRef} className="min-h-dvh bg-background font-sans">
      {/* ─── Floating Nav ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav shadow-ambient">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <span className="text-xl font-extrabold tracking-tight text-on-surface">
            AKB<span className="text-gradient-honey">ai</span>
          </span>
          <button
            type="button"
            onClick={scrollToWaitlist}
            className="min-h-[44px] min-w-[44px] rounded-full bg-gradient-to-r from-primary-container to-secondary-container px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-ambient-lg active:scale-[0.98]"
          >
            Join Waitlist
          </button>
        </div>
      </nav>

      {/* ─── Section 1: Hero ──────────────────────────────────── */}
      <section className="relative overflow-hidden px-5 pb-24 pt-32 sm:pb-32 sm:pt-44 md:pb-40 md:pt-52">
        {/* Decorative gradient orbs */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[600px] rounded-full opacity-25 landing-float-slow"
          style={{
            background: 'radial-gradient(circle, hsl(37 90% 51% / 0.35), transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 top-32 h-[300px] w-[300px] rounded-full opacity-15 landing-float-delayed"
          style={{
            background: 'radial-gradient(circle, hsl(161 76% 45% / 0.3), transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-16 top-64 h-[200px] w-[200px] rounded-full opacity-10 landing-float"
          style={{
            background: 'radial-gradient(circle, hsl(37 90% 51% / 0.4), transparent 70%)',
          }}
          aria-hidden="true"
        />

        {/* Decorative dots */}
        <div className="pointer-events-none absolute right-8 top-28 h-3 w-3 rounded-full bg-primary-container/30 landing-pulse" aria-hidden="true" />
        <div className="pointer-events-none absolute left-12 top-48 h-2 w-2 rounded-full bg-tertiary/20 landing-pulse" aria-hidden="true" />
        <div className="pointer-events-none absolute right-24 bottom-32 h-2.5 w-2.5 rounded-full bg-primary-container/20 landing-pulse" aria-hidden="true" />

        <div className="relative mx-auto max-w-3xl text-center">
          {/* Section label */}
          <p className="landing-section-label mb-6">
            Your AI Business Partner
          </p>

          <h1
            className="text-4xl font-extrabold leading-[1.1] text-on-surface sm:text-5xl md:text-6xl lg:text-7xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Katuwang ng{' '}
            <span className="text-gradient-honey">
              Negosyo Mo
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-on-surface-variant sm:mt-8 sm:text-lg md:text-xl">
            AI-powered na kaakbay mo sa tax, expenses, at daily operations
            &mdash; para sa Filipino MSMEs.
          </p>

          {/* Dual CTAs */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:mt-12">
            <WaitlistForm section="hero" />
            <button
              type="button"
              onClick={scrollToContent}
              className="group flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-on-surface-variant transition-all hover:text-on-surface hover:bg-surface-container-low active:scale-[0.98]"
            >
              Alamin Kung Paano
              <span className="inline-block transition-transform group-hover:translate-y-0.5" aria-hidden="true">
                ↓
              </span>
            </button>
          </div>
        </div>

        {/* Floating Social Proof Badges */}
        <div className="relative mx-auto mt-16 max-w-4xl sm:mt-20">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {badges.map((badge) => (
              <div
                key={badge.text}
                className="landing-badge landing-fade-in flex items-center gap-3 rounded-2xl px-4 py-3 shadow-ambient sm:px-5 sm:py-3.5"
              >
                <span
                  className="text-base font-extrabold text-on-surface sm:text-lg"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {badge.text}
                </span>
                <span className="text-xs text-on-surface-variant sm:text-sm">
                  {badge.subtext}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 2: Pain Points — "BAKIT AKBAI?" ──────────── */}
      <section id="bakit-akbai" className="bg-surface-container-low px-5 py-20 sm:py-28 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="landing-reveal text-center">
            <p className="landing-section-label mb-4">BAKIT AKBAI?</p>
            <h2
              className="text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl md:text-4xl"
              style={{ letterSpacing: '-0.02em' }}
            >
              Alam namin ang struggle
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-on-surface-variant sm:text-base md:text-lg">
              99.5% ng businesses sa Pilipinas, MSME. Deserve nila ng AI partner.
            </p>
          </div>

          <div className="landing-reveal-stagger mt-12 grid gap-5 sm:mt-16 sm:grid-cols-3 sm:gap-6 md:gap-8">
            {painPoints.map((point) => (
              <div
                key={point.title}
                className="landing-reveal group rounded-2xl bg-surface-container-lowest p-7 shadow-ambient transition-all duration-300 hover:shadow-ambient-lg hover:-translate-y-1 sm:p-8"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-low transition-colors group-hover:bg-primary-container/10">
                  <point.icon />
                </div>
                <h3 className="mt-5 text-lg font-bold text-on-surface sm:text-xl">
                  {point.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant sm:text-base">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 3: Bold Stat Callout ─────────────────────── */}
      <section className="relative overflow-hidden px-5 py-20 sm:py-28 md:py-32">
        {/* Warm gradient background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            background: 'linear-gradient(135deg, hsl(37 90% 51%), hsl(27 99% 59%), hsl(37 90% 51%))',
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="landing-reveal">
            <p
              className="text-6xl font-extrabold text-gradient-honey sm:text-7xl md:text-8xl lg:text-9xl"
              style={{ letterSpacing: '-0.03em', lineHeight: '1' }}
            >
              1.1M
            </p>
            <p className="mt-4 text-lg font-medium text-on-surface sm:mt-6 sm:text-xl md:text-2xl">
              Filipino MSMEs na deserving ng AI business partner
            </p>
          </div>

          <div className="landing-reveal-stagger mx-auto mt-12 grid max-w-3xl gap-6 sm:mt-16 sm:grid-cols-3 sm:gap-8">
            {boldStats.map((stat) => (
              <div key={stat.number} className="landing-reveal">
                <p
                  className="text-3xl font-extrabold text-on-surface sm:text-4xl"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {stat.number}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant sm:text-base">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 4: How It Works ──────────────────────────── */}
      <section className="bg-surface-container-low px-5 py-20 sm:py-28 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="landing-reveal text-center">
            <p className="landing-section-label mb-4">PAANO GUMAGANA</p>
            <h2
              className="text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl md:text-4xl"
              style={{ letterSpacing: '-0.02em' }}
            >
              Paano gumagana si Kai?
            </h2>
          </div>

          <div className="relative mt-12 sm:mt-16">
            {/* Dotted connector line — visible on sm+ */}
            <div className="absolute left-0 right-0 top-7 hidden sm:block" aria-hidden="true">
              <div className="mx-auto max-w-lg landing-dotted-line" />
            </div>

            <div className="landing-reveal-stagger grid gap-10 sm:grid-cols-3 sm:gap-6 md:gap-8">
              {steps.map((s) => (
                <div key={s.step} className="landing-reveal text-center">
                  <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-container to-secondary-container shadow-ambient">
                    <span
                      className="text-lg font-extrabold text-white"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {s.step}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-on-surface sm:text-xl">
                    {s.title}
                  </h3>
                  <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-on-surface-variant sm:text-base">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 5: 5 Pillars ─────────────────────────────── */}
      <section className="px-5 py-20 sm:py-28 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="landing-reveal text-center">
            <p className="landing-section-label mb-4">5 PILLARS</p>
            <h2
              className="text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl md:text-4xl"
              style={{ letterSpacing: '-0.02em' }}
            >
              Isang partner, limang pillar
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-on-surface-variant sm:text-base md:text-lg">
              Hindi lang isang tool — integrated AI partner na covers lahat ng kailangan ng negosyo mo.
            </p>
          </div>

          {/* Mobile: horizontal scroll. Desktop: grid */}
          <div className="mt-12 sm:mt-16">
            {/* Mobile scroll container */}
            <div className="landing-scroll-snap -mx-5 flex gap-4 overflow-x-auto px-5 pb-4 sm:hidden">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="landing-scroll-snap-item w-[280px] rounded-2xl bg-surface-container-lowest p-6 shadow-ambient"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-low">
                    <pillar.icon />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-on-surface">
                    {pillar.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gradient-honey">
                    {pillar.tagline}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop grid */}
            <div className="landing-reveal-stagger hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="landing-reveal group rounded-2xl bg-surface-container-lowest p-7 shadow-ambient transition-all duration-300 hover:shadow-ambient-lg hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-low transition-colors group-hover:bg-primary-container/10">
                    <pillar.icon />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-on-surface sm:text-lg">
                    {pillar.title}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-gradient-honey">
                    {pillar.tagline}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 6: Pricing ───────────────────────────────── */}
      <section className="bg-surface-container-low px-5 py-20 sm:py-28 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="landing-reveal text-center">
            <p className="landing-section-label mb-4">PRICING</p>
            <h2
              className="text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl md:text-4xl"
              style={{ letterSpacing: '-0.02em' }}
            >
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-on-surface-variant sm:text-base md:text-lg">
              97% cheaper than hiring a bookkeeper
            </p>
          </div>

          {/* Comparison callout */}
          <div className="landing-reveal mx-auto mt-8 max-w-md rounded-2xl bg-surface-container-lowest p-4 text-center shadow-ambient sm:mt-10">
            <p className="text-sm text-on-surface-variant">
              Average bookkeeper cost:{' '}
              <span
                className="font-extrabold text-on-surface"
                style={{ letterSpacing: '-0.02em' }}
              >
                ₱11,800/mo
              </span>
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              AKBai Pro:{' '}
              <span className="font-extrabold text-gradient-honey">
                ₱399/mo
              </span>
            </p>
          </div>

          <div className="landing-reveal-stagger mt-10 grid gap-5 sm:mt-12 sm:grid-cols-3 sm:gap-6 md:gap-8">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`landing-reveal relative rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 sm:p-8 ${
                  tier.highlighted
                    ? 'bg-surface-container-lowest shadow-ambient-lg ring-2 ring-primary-container/30'
                    : 'bg-surface-container-lowest shadow-ambient hover:shadow-ambient-lg'
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary-container to-secondary-container px-4 py-1.5 text-xs font-semibold text-white shadow-ambient">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-on-surface">{tier.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span
                    className="text-3xl font-extrabold text-on-surface sm:text-4xl"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {formatPrice(tier.price)}
                  </span>
                  <span className="text-sm text-on-surface-variant">{tier.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-on-surface-variant"
                    >
                      <span className="mt-0.5 flex-shrink-0">
                        <IconCheckmark />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="landing-reveal mt-8 text-center text-xs text-on-surface-variant/70">
            Ito ay gabay lamang, hindi tax advice. Kumonsulta sa CPA para sa opisyal na payo.
          </p>
        </div>
      </section>

      {/* ─── Section 7: Community Voices (Testimonials) ───────── */}
      <section className="px-5 py-20 sm:py-28 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="landing-reveal text-center">
            <p className="landing-section-label mb-4">COMMUNITY VOICES</p>
            <h2
              className="text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl md:text-4xl"
              style={{ letterSpacing: '-0.02em' }}
            >
              Galing sa mga nag-hustle din
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-on-surface-variant sm:text-base md:text-lg">
              Real quotes from Filipino business owners sa Reddit at Facebook.
            </p>
          </div>

          <div className="landing-reveal-stagger mt-12 grid gap-5 sm:mt-16 sm:grid-cols-3 sm:gap-6 md:gap-8">
            {communityQuotes.map((item) => (
              <div
                key={item.attribution}
                className="landing-reveal relative rounded-2xl bg-surface-container-lowest p-7 shadow-ambient sm:p-8"
              >
                {/* Decorative quote mark */}
                <span
                  className="absolute -top-3 left-6 text-5xl font-extrabold text-primary-container/20 select-none"
                  aria-hidden="true"
                >
                  &ldquo;
                </span>
                <p className="relative text-sm italic leading-relaxed text-on-surface sm:text-base">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div className="mt-5">
                  <p className="text-xs font-semibold text-on-surface">
                    &mdash; {item.attribution}
                  </p>
                  <p className="mt-0.5 text-xs text-on-surface-variant/70">
                    {item.context}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 8: Final CTA ─────────────────────────────── */}
      <section id="waitlist-bottom" className="relative overflow-hidden px-5 py-24 sm:py-32 md:py-40">
        {/* Subtle gradient */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(37 90% 51%), transparent 70%)',
          }}
          aria-hidden="true"
        />

        {/* Decorative dots */}
        <div className="pointer-events-none absolute left-8 top-16 h-2 w-2 rounded-full bg-primary-container/20 landing-pulse" aria-hidden="true" />
        <div className="pointer-events-none absolute right-12 bottom-20 h-3 w-3 rounded-full bg-tertiary/15 landing-pulse" aria-hidden="true" />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="landing-reveal">
            <h2
              className="text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl md:text-5xl"
              style={{ letterSpacing: '-0.02em' }}
            >
              Hindi ka nag-iisa
              <br />
              sa negosyo mo.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base text-on-surface-variant sm:mt-6 sm:text-lg">
              Join the waitlist at maging isa sa unang mag-try ng AKBai &mdash;
              your AI-powered na katuwang sa hustle.
            </p>
          </div>

          <div className="landing-reveal mt-10 flex justify-center sm:mt-12">
            <WaitlistForm section="bottom_cta" />
          </div>

          {/* Trust signals */}
          <div className="landing-reveal mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-1.5 text-xs text-on-surface-variant/70">
              <IconCheckmark />
              100% free to join
            </span>
            <span className="flex items-center gap-1.5 text-xs text-on-surface-variant/70">
              <IconCheckmark />
              No credit card needed
            </span>
            <span className="flex items-center gap-1.5 text-xs text-on-surface-variant/70">
              <IconCheckmark />
              Early access perks
            </span>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="bg-surface-container-low px-5 py-10 sm:py-12">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-xl font-extrabold tracking-tight text-on-surface">
            AKB<span className="text-gradient-honey">ai</span>
          </span>
          <p className="mt-2 text-sm text-on-surface-variant/80">
            Katuwang ng Negosyo Mo
          </p>
          <p className="mt-3 text-xs text-on-surface-variant/60">
            Made with <span aria-label="love" className="text-primary-container">&hearts;</span> in the Philippines
          </p>
          <p className="mt-1 text-xs text-on-surface-variant/50">
            &copy; {new Date().getFullYear()} AKBai. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
