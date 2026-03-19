import { Metadata } from 'next'
import LoginForm from '@/components/auth/login-form'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Login — AKBai',
}

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-ink flex flex-col items-center justify-center px-6 py-12">
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="relative w-44 h-14">
          <Image
            src="https://raw.githubusercontent.com/adelro-git/akbai/main/brand/Logo%20Files/AKBai_Logo_Primary_OnDark.png"
            alt="AKBai"
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>
        <p className="text-slate-400 text-sm">Katuwang ng Negosyo Mo</p>
      </div>

      <div className="w-full max-w-sm bg-kai-card rounded-2xl p-6 shadow-2xl">
        <LoginForm />
      </div>

      <p className="mt-8 text-xs text-slate-500 text-center max-w-xs">
        AKBai provides informational guidance only — hindi ito professional financial o tax advice.
      </p>
    </div>
  )
}
