'use client'

import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog as usePHHook } from 'posthog-js/react'
import { createClient } from '@/lib/supabase/client'

/**
 * Re-export the PostHog hook for convenience.
 * Usage: import { usePostHog } from '@/components/providers/posthog-provider'
 */
export const usePostHog = usePHHook

interface PostHogProviderProps {
  children: React.ReactNode
}

/**
 * PostHog analytics provider — wraps the app with posthog-js initialization.
 *
 * - Reads NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST from env
 * - Enables debug mode in development (no events sent to PostHog)
 * - Auto-identifies users when Supabase auth session is available
 */
export default function PostHogProvider({ children }: PostHogProviderProps) {
  const initialized = useRef(false)

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key || initialized.current) return

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') {
          ph.debug()
        }
      },
    })

    initialized.current = true
  }, [])

  // Identify user from Supabase auth session
  useEffect(() => {
    if (!initialized.current) return

    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        posthog.identify(data.user.id, {
          email: data.user.email,
        })
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        posthog.identify(session.user.id, {
          email: session.user.email,
        })
      } else {
        posthog.reset()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
