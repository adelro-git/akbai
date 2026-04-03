'use client'

import { useRef, useState } from 'react'
import { trackWaitlistSignup, trackLandingPageCtaClicked } from '@/lib/posthog/events'

interface WaitlistFormProps {
  section: string
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

export default function WaitlistForm({ section }: WaitlistFormProps) {
  const emailRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit() {
    const email = emailRef.current?.value?.trim() ?? ''

    if (!email) {
      setErrorMessage('Kailangan ng email address.')
      setStatus('error')
      return
    }

    // Basic email validation before hitting the server
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMessage('Kailangan ng valid na email address.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      trackLandingPageCtaClicked(section)

      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'landing_page' }),
      })

      const data = await res.json() as {
        success: boolean
        error?: { message_tl?: string }
      }

      if (!res.ok || !data.success) {
        setErrorMessage(data.error?.message_tl ?? 'May problema. Subukan muli.')
        setStatus('error')
        return
      }

      // Track successful signup
      const domain = email.split('@')[1] ?? 'unknown'
      trackWaitlistSignup('landing_page', domain)

      setStatus('success')
      if (emailRef.current) {
        emailRef.current.value = ''
      }
    } catch {
      setErrorMessage('May problema sa connection. Subukan muli.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-surface-container-low px-5 py-4">
        <span className="text-lg" role="img" aria-label="check">
          &#10003;
        </span>
        <p className="text-sm font-medium text-on-surface">
          Salamat! Nasa waitlist ka na. Abangan ang updates!
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          ref={emailRef}
          type="email"
          placeholder="Email mo dito..."
          aria-label="Email address"
          className="flex-1 rounded-xl bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary-container transition-shadow"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === 'loading'}
          className="min-h-[44px] min-w-[44px] whitespace-nowrap rounded-xl bg-gradient-to-r from-primary-container to-secondary-container px-6 py-3.5 text-sm font-semibold text-white shadow-ambient transition-all hover:shadow-ambient-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Sending...' : 'Mag-Sign Up sa Waitlist'}
        </button>
      </div>
      {status === 'error' && errorMessage && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
