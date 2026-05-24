// ============================================================
// /chat — Server Component
// Reads optional ?topic={form_code}&context=deadline-{N}d (ADR-017 §2)
// and passes a typed DeadlineContext into the chat client. The client
// handles the sentinel "Kai opens" POST in a useEffect on first render.
// ============================================================

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth'
import ChatInterface from '@/components/chat/chat-interface'
import { PageBackground } from '@/components/ui/page-background'
import { parseDeadlineContext } from '@/lib/bir/forms'
import type { ChatMessage } from '@/lib/chat/types'

export const metadata: Metadata = {
  title: 'Kai — AKBai',
}

// Re-export so any existing import-from-page consumers keep working.
export type { ChatMessage }

interface ChatPageProps {
  searchParams: Promise<{ topic?: string; context?: string }>
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
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

  const params = await searchParams
  const deadlineContext = parseDeadlineContext(params.topic, params.context)

  return (
    <PageBackground variant="chat">
      <ChatInterface
        initialMessages={(messages || []) as ChatMessage[]}
        userEmail={user.email || ''}
        deadlineContext={deadlineContext}
      />
    </PageBackground>
  )
}
