'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { checkEmailProvider } from '@/lib/email/verify'

type Step = 'email' | 'otp'

export default function LoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailWarning, setEmailWarning] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const otpRef = useRef<HTMLInputElement>(null)
  const emailValueRef = useRef('')

  const supabase = createClient()

  const handleEmailBlur = useCallback(() => {
    const emailVal = emailRef.current?.value?.trim() || ''
    if (!emailVal) {
      setEmailWarning(null)
      return
    }
    const { warning } = checkEmailProvider(emailVal)
    setEmailWarning(warning ?? null)
  }, [])

  const handleSendOtp = useCallback(async () => {
    const emailVal = emailRef.current?.value?.trim() || emailValueRef.current || ''
    if (!emailVal) {
      setError('Maglagay ng email address.')
      return
    }
    emailValueRef.current = emailVal
    setLoading(true)
    setError(null)

    try {
      const siteUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : '/auth/callback'

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: emailVal,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: siteUrl,
        },
      })

      if (otpError) {
        if (otpError.message?.toLowerCase().includes('rate') || otpError.status === 429) {
          setError('Sandali lang — isang code lang every 60 seconds. Subukan muli mamaya.')
        } else {
          setError('May problema sa pagpapadala ng code. Subukan muli.')
        }
      } else {
        setStep('otp')
      }
    } catch {
      setError('May nangyaring mali. Subukan muli.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const handleVerifyOtp = useCallback(async () => {
    const otpVal = otpRef.current?.value?.replace(/\D/g, '') || ''
    if (otpVal.length < 6) {
      setError('Kailangan ng 6-digit code.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: emailValueRef.current,
        token: otpVal,
        type: 'email',
      })

      if (verifyError) {
        setError('Mali ang code o nag-expire na. Subukan muli.')
        if (otpRef.current) otpRef.current.value = ''
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('May nangyaring mali. Subukan muli.')
      if (otpRef.current) otpRef.current.value = ''
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  const handleEmailKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSendOtp()
      }
    },
    [handleSendOtp]
  )

  const handleOtpKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleVerifyOtp()
      }
    },
    [handleVerifyOtp]
  )

  if (step === 'otp') {
    return (
      <section className="space-y-6" data-testid="otp-form">
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#dae3f7]">I-enter ang code</h2>
          <p className="text-[#d8c3ad] text-sm">
            Nagpadala kami ng 6-digit code sa{' '}
            <span className="text-white font-medium">{emailValueRef.current}</span>.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold tracking-wide text-[#d8c3ad] px-1">
            OTP Code
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#534434] group-focus-within:text-[#ffc174] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <input
              ref={otpRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="123456"
              autoFocus
              autoComplete="one-time-code"
              onKeyDown={handleOtpKeyDown}
              className="w-full pl-12 pr-4 py-4 bg-[#060e1c] border-none rounded-xl text-[#dae3f7] placeholder:text-[#a08e7a]/50 text-lg tracking-widest text-center focus:ring-1 focus:ring-[#ffc174]/40 focus:bg-[#131c2a] transition-all duration-300 outline-none"
              data-testid="otp-input"
            />
          </div>
        </div>

        {error && (
          <p className="text-[#ffb4ab] text-sm" data-testid="login-error">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleVerifyOtp}
          disabled={loading}
          className="w-full py-4 px-6 bg-gradient-to-r from-honey to-honey-deep text-[#613b00] font-bold rounded-xl shadow-lg shadow-honey/10 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
          data-testid="verify-otp-btn"
        >
          <span>{loading ? 'Sine-verify...' : 'I-verify ang Code'}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => {
            setStep('email')
            setError(null)
          }}
          className="w-full text-[#d8c3ad] text-sm min-h-[44px] py-2 hover:text-[#ffc174] transition-colors font-bold"
          data-testid="back-to-email-btn"
        >
          Mag-back at magpadala ulit
        </button>
      </section>
    )
  }

  return (
    <section className="space-y-6" data-testid="email-form">
      <div className="space-y-2">
        <label className="block text-sm font-semibold tracking-wide text-[#d8c3ad] px-1">
          Email Address
        </label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#534434] group-focus-within:text-[#ffc174] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <input
            ref={emailRef}
            type="email"
            defaultValue={emailValueRef.current}
            placeholder="pangalan@halimbawa.com"
            autoFocus
            autoComplete="email"
            onKeyDown={handleEmailKeyDown}
            onBlur={handleEmailBlur}
            className="w-full pl-12 pr-4 py-4 bg-[#060e1c] border-none rounded-xl text-[#dae3f7] placeholder:text-[#a08e7a]/50 focus:ring-1 focus:ring-[#ffc174]/40 focus:bg-[#131c2a] transition-all duration-300 outline-none"
            data-testid="email-input"
          />
        </div>
      </div>

      {emailWarning && (
        <p className="text-yellow-400/80 text-xs leading-relaxed" data-testid="email-warning">
          {emailWarning}
        </p>
      )}

      {error && (
        <p className="text-[#ffb4ab] text-sm" data-testid="login-error">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSendOtp}
        disabled={loading}
        className="w-full py-4 px-6 bg-gradient-to-r from-honey to-honey-deep text-[#613b00] font-bold rounded-xl shadow-lg shadow-honey/10 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
        data-testid="send-otp-btn"
      >
        <span>{loading ? 'Nagpapadala...' : 'Send Magic Link'}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </button>
    </section>
  )
}
