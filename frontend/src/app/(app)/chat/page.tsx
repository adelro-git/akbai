import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth'
import ChatInterface from '@/components/chat/chat-interface'
import { PageBackground } from '@/components/ui/page-background'

export const metadata: Metadata = {
  title: 'Kai — AKBai',
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default async function ChatPage() {
  const supabase = await createClient()

  let user
  if (SKIP_AUTH) {
    user = DEV_USER
  } else {
    const { data } = await supabase.auth.getUser()
    user = data.user
    if (!user) redirect('/login')
  }

  // Check onboarding status — redirect to onboarding if not completed
  const { data: onboardingCheck } = await supabase
    .from('users')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (!SKIP_AUTH && !onboardingCheck?.onboarding_completed) {
    redirect('/onboarding')
  }

  const { data: messages } = await supabase
    .from('ka_conversations')
    .select('id, role, content, created_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(50)

  return (
    <PageBackground variant="chat">
      <ChatInterface
        initialMessages={(messages || []) as ChatMessage[]}
        userEmail={user.email || ''}
      />
    </PageBackground>
  )
}
