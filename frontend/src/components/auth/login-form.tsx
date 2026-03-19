'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 'email' | 'otp'

export default function LoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const otpRef = useRef<HTMLInputElement>(null)
  const emailValueRef = useRef('')

  const supabase = createClient()

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    const emailVal = emailRef.current?.value?.trim() || ''
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

      const { error } = await supabase.auth.signInWithOtp({
        email: emailVal,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: siteUrl,
        },
      })

      if (error) {
        setError('May problema sa pagpapadala ng code. Subukan muli.')
      } else {
        setStep('otp')
      }
    } catch {
      setError('May nangyaring mali. Subukan muli.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    const otpVal = otpRef.current?.value?.replace(/\D/g, '') || ''
    if (otpVal.length < 6) {
      setError('Kailangan ng 6-digit code.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailValueRef.current,
        token: otpVal,
        type: 'email',
      })

      if (error) {
        setError('Mali ang code o nag-expire na. Subukan muli.')
        if (otpRef.current) otpRef.current.value = ''
      } else {
        router.push('/chat')
        router.refresh()
      }
    } catch {
      setError('May nangyaring mali. Subukan muli.')
      if (otpRef.current) otpRef.current.value = ''
    } finally {
      setLoading(false)
    }
  }

  if (step === 'otp') {
    return (
      <form onSubmit={handleOtpSubmit} className="space-y-5" data-testid="otp-form">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">I-enter ang code</h2>
          <p className="text-slate-400 text-sm">
            Nagpadala kami ng 6-digit code sa{' '}
            <span className="text-white font-medium">{emailValueRef.current}</span>.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            OTP Code
          </label>
          <input
            ref={otpRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="123456"
            required
            autoFocus
            className="w-full bg-kai-card-alt border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-lg tracking-widest text-center focus:border-honey focus:ring-1 focus:ring-honey transition-colors"
            data-testid="otp-input"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm" data-testid="login-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-honey hover:bg-honey-deep text-ink font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-40 disabled:bg-honey/50 disabled:cursor-not-allowed disabled:hover:bg-honey/50"
          data-testid="verify-otp-btn"
        >
          {loading ? 'Sine-verify...' : 'I-verify ang Code'}
        </button>

        <button
          type="button"
          onClick={() => {
            setStep('email')
            setError(null)
          }}
          className="w-full text-slate-400 text-sm py-2 hover:text-white transition-colors"
          data-testid="back-to-email-btn"
        >
          Mag-back at magpadala ulit
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleEmailSubmit} className="space-y-5" data-testid="email-form">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Mag-login po</h2>
        <p className="text-slate-400 text-sm">
          Magpapadala kami ng login code sa iyong email.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Email
        </label>
        <input
          ref={emailRef}
          type="email"
          placeholder="you@example.com"
          required
          autoFocus
          className="w-full bg-kai-card-alt border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-honey focus:ring-1 focus:ring-honey transition-colors"
          data-testid="email-input"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm" data-testid="login-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-honey hover:bg-honey-deep text-ink font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-40 disabled:bg-honey/50 disabled:cursor-not-allowed disabled:hover:bg-honey/50"
        data-testid="send-otp-btn"
      >
        {loading ? 'Nagpapadala...' : 'Magpadala ng Code'}
      </button>
    </form>
  )
}
