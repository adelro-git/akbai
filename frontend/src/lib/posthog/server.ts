/**
 * Server-side PostHog client (posthog-node).
 *
 * Uses POSTHOG_PERSONAL_API_KEY — this must NEVER be exposed to the client.
 * Import this module only in server components, API routes, and server actions.
 */
import { PostHog } from 'posthog-node'

let posthogServerInstance: PostHog | null = null

/**
 * Returns a singleton PostHog Node client for server-side event tracking.
 * Returns null if POSTHOG_PERSONAL_API_KEY is not configured.
 */
export function getPostHogServer(): PostHog | null {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  if (!apiKey) {
    return null
  }

  if (!posthogServerInstance) {
    posthogServerInstance = new PostHog(apiKey, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    })
  }

  return posthogServerInstance
}

/**
 * Gracefully shuts down the PostHog server client, flushing any pending events.
 * Call this during application shutdown / cleanup.
 */
export async function shutdownPostHogServer(): Promise<void> {
  if (posthogServerInstance) {
    await posthogServerInstance.shutdown()
    posthogServerInstance = null
  }
}
