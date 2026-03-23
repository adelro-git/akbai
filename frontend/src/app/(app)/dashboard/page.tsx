import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard — AKBai',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  let user
  if (SKIP_AUTH) {
    user = DEV_USER
  } else {
    const { data } = await supabase.auth.getUser()
    user = data.user
    if (!user) redirect('/login')
  }

  return (
    <div
      className="min-h-dvh bg-ink flex flex-col items-center justify-center px-6"
      data-testid="dashboard-page"
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-3">Dashboard</h1>
        <p className="text-slate-400 text-sm mb-6">
          Darating na ito sa Build 2. For now, mag-chat ka na kay Kai!
        </p>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 bg-honey text-ink px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-honey-deep transition-colors"
          data-testid="go-to-chat-link"
        >
          Pumunta sa Chat
        </Link>
      </div>
    </div>
  )
}
