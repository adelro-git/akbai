'use client'

// ============================================================
// / (root) — Client Component (Sprint 15 Capacitor conversion)
//
// Per ADR-019 + sprint-15-conversion-pattern.md §3 row 1: behaviour
// differs from the canonical §2 template — anonymous visitors see the
// public LandingPage (no fetch, no redirect), authenticated users are
// routed to /dashboard or /onboarding based on their `onboarding_completed`
// flag. We do NOT unconditionally redirect to /dashboard like the spike
// did (the spike was a bundle smoke; this is execution).
//
// Conversions made vs server version:
//   - 'use client' directive
//   - Removed server `createClient` + `redirect`
//   - Auth check moved into useEffect using browser supabase client
//   - Redirect via `router.replace(...)` (no back-button trap)
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import LandingPage from '@/components/public/landing-page'

type GateState = 'pending' | 'anonymous' | 'redirecting'

export default function HomePage() {
  const router = useRouter()
  const [state, setState] = useState<GateState>('pending')

  useEffect(() => {
    const supabase = createClient()

    async function gate() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user) {
        setState('anonymous')
        return
      }

      // Authenticated → check onboarding flag and route accordingly.
      const { data: userData } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      setState('redirecting')
      if (userData?.onboarding_completed) {
        router.replace('/dashboard')
      } else {
        router.replace('/onboarding')
      }
    }

    gate().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('home gate failed', err)
      // On any failure, degrade to anonymous landing — it's the safest
      // surface to show (no PII, no auth assumptions).
      setState('anonymous')
    })
  }, [router])

  // While the gate is resolving we paint nothing — the LandingPage flash
  // for a millisecond before redirect would look broken; better a blank
  // first frame than a wrong surface.
  if (state === 'pending' || state === 'redirecting') {
    return null
  }

  return <LandingPage />
}
