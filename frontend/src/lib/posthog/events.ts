/**
 * PostHog event tracking functions — typed wrappers around posthog.capture().
 *
 * Usage: import { trackOnboardingStarted } from '@/lib/posthog/events'
 * These functions are safe to call on the client only (they use posthog-js).
 */
import posthog from 'posthog-js'

// ─── Event name constants ────────────────────────────────────────────
const EVENTS = {
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  DASHBOARD_VIEWED: 'dashboard_viewed',
  RECEIPT_SCANNED: 'receipt_scanned',
  DAILY_CHECK_IN_COMPLETED: 'daily_check_in_completed',
} as const

type EventName = (typeof EVENTS)[keyof typeof EVENTS]

// ─── Internal helper ─────────────────────────────────────────────────
function capture(event: EventName, properties?: Record<string, string | number | boolean>) {
  posthog.capture(event, properties)
}

// ─── Public tracking functions ───────────────────────────────────────

/** Track when user begins the Kilala Kita onboarding flow */
export function trackOnboardingStarted(): void {
  capture(EVENTS.ONBOARDING_STARTED)
}

/** Track when user finishes onboarding, including their business type */
export function trackOnboardingCompleted(businessType: string): void {
  capture(EVENTS.ONBOARDING_COMPLETED, { business_type: businessType })
}

/** Track when user sends a chat message to Kai */
export function trackChatMessageSent(): void {
  capture(EVENTS.CHAT_MESSAGE_SENT)
}

/** Track when user views the dashboard page */
export function trackDashboardViewed(): void {
  capture(EVENTS.DASHBOARD_VIEWED)
}

/** Track when a receipt is scanned (for future OCR feature) */
export function trackReceiptScanned(success: boolean): void {
  capture(EVENTS.RECEIPT_SCANNED, { success })
}

/** Track when user completes daily check-in with mood + optional financials */
export function trackDailyCheckInCompleted(hasSales: boolean, hasExpenses: boolean): void {
  capture(EVENTS.DAILY_CHECK_IN_COMPLETED, { has_sales: hasSales, has_expenses: hasExpenses })
}
