import { Metadata } from 'next'
import LoginForm from '@/components/auth/login-form'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Login — AKBai',
}

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Atmospheric Glow (Top Left) */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-container/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-md flex flex-col space-y-12 relative z-10">
        {/* Header & Branding */}
        <header className="flex flex-col items-center text-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-container/10 blur-2xl rounded-full" />
            <div className="relative z-10 w-40 h-40">
              <Image
                src="/icons/logo-primary.png"
                alt="AKBai"
                fill
                className="object-contain dark:hidden"
                priority
              />
              <Image
                src="/icons/logo-primary-dark.png"
                alt="AKBai"
                fill
                className="object-contain hidden dark:block"
                priority
              />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
              Welcome, Katuwang!
            </h1>
            <p className="text-on-surface-variant leading-relaxed max-w-[280px] mx-auto">
              I-enter ang iyong email para mag-log in.
            </p>
          </div>
        </header>

        {/* Login Form */}
        <LoginForm />

        {/* Secure Access Divider */}
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-outline-variant/20" />
          <span className="flex-shrink mx-4 text-xs font-medium uppercase tracking-widest text-outline/40">
            Secure Access
          </span>
          <div className="flex-grow border-t border-outline-variant/20" />
        </div>

        {/* Footer */}
        <footer className="text-center">
          <p className="text-on-surface-variant text-sm">
            Walang account?{' '}
            <span className="text-primary-container font-bold">
              Auto ka na ma-sign up.
            </span>
          </p>
        </footer>
      </main>

      {/* Background Decoration (Bottom Right) */}
      <div className="fixed bottom-0 right-0 p-8 opacity-5 pointer-events-none select-none">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" className="text-primary-container">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
        </svg>
      </div>

      {/* Disclaimer */}
      <p className="mt-8 text-xs text-outline/40 text-center max-w-xs relative z-10">
        AKBai provides informational guidance only — hindi ito professional financial o tax advice.
      </p>
    </div>
  )
}
