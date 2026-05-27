'use client'

// ============================================================
// /chat — Client Component (Sprint 15 Capacitor conversion)
//
// Per sprint-15-conversion-pattern.md §3 row 3 + §9 (Suspense audit):
// ChatInterface already wires /api/chat internally, so the page only
// handles bootstrap (auth gate, onboarding gate, last-50-messages fetch
// straight from the browser supabase client — RLS-readable). Reads
// ?topic= and ?context= via useSearchParams() and MUST be Suspense-wrapped
// so the Next 16 static-export build doesn't bail.
//
// Conversions made vs server version:
//   - 'use client' directive
//   - Removed Metadata, redirect, server supabase
//   - Bootstrap moved into useEffect using browser supabase client
//   - searchParams read via useSearchParams() (client)
//   - redirect('/login') → router.replace('/login')
//   - Suspense wrapper around the inner component (required for useSearchParams)
// ============================================================

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth'
import ChatInterface from '@/components/chat/chat-interface'
import { PageBackground } from '@/components/ui/page-background'
import { parseDeadlineContext } from '@/lib/bir/forms'
import type { ChatMessage } from '@/lib/chat/types'

// Re-export so any existing import-from-page consumers keep working.
export type { ChatMessage }

interface ChatBootstrap {
  initialMessages: ChatMessage[]
  userEmail: string
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <PageBackground variant="chat">
          <div className="min-h-dvh flex items-center justify-center text-on-surface-variant">
            Loading...
          </div>
        </PageBackground>
      }
    >
      <ChatPageInner />
    </Suspense>
  )
}

function ChatPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bootstrap, setBootstrap] = useState<ChatBootstrap | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      let user
      if (SKIP_AUTH) {
        user = DEV_USER
      } else {
        const { data } = await supabase.auth.getUser()
        user = data.user
        if (!user) {
          router.replace('/login')
          return
        }
      }

      // Onboarding gate — only enforced when not in dev bypass.
      if (!SKIP_AUTH) {
        const { data: onboardingCheck } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()
        if (!onboardingCheck?.onboarding_completed) {
          router.replace('/onboarding')
          return
        }
      }

      // RLS allows the authenticated user to read their own ka_conversations,
      // so the browser supabase client is sufficient. No API call needed for
      // bootstrap — /api/chat is only hit on send.
      const { data: messages } = await supabase
        .from('ka_conversations')
        .select('id, role, content, created_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(50)

      setBootstrap({
        initialMessages: (messages ?? []) as ChatMessage[],
        userEmail: user.email ?? '',
      })
      setLoading(false)
    }

    load().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('chat page bootstrap failed', err)
      setError('Hindi makapag-load ang chat. Subukan muli.')
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <PageBackground variant="chat">
        <div className="min-h-dvh flex items-center justify-center text-on-surface-variant">
          Loading...
        </div>
      </PageBackground>
    )
  }

  if (error || !bootstrap) {
    return (
      <PageBackground variant="chat">
        <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
          <p className="text-destructive text-sm mb-2">{error ?? 'Walang data.'}</p>
          <button
            onClick={() => window.location.reload()}
            type="button"
            className="text-primary text-sm font-semibold"
          >
            Subukan muli
          </button>
        </div>
      </PageBackground>
    )
  }

  // searchParams is the client-side ReadonlyURLSearchParams from next/navigation.
  // parseDeadlineContext accepts the same `topic`/`context` shape it always did.
  const topic = searchParams.get('topic') ?? undefined
  const context = searchParams.get('context') ?? undefined
  const deadlineContext = parseDeadlineContext(topic, context)

  return (
    <PageBackground variant="chat">
      <ChatInterface
        initialMessages={bootstrap.initialMessages}
        userEmail={bootstrap.userEmail}
        deadlineContext={deadlineContext}
      />
    </PageBackground>
  )
}
