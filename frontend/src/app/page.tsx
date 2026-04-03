import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/public/landing-page'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Unauthenticated visitors see the public landing page
  if (!user) {
    return <LandingPage />
  }

  // Authenticated users: check onboarding status
  const { data: userData } = await supabase
    .from('users')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (userData?.onboarding_completed) {
    redirect('/chat')
  } else {
    redirect('/onboarding')
  }
}
