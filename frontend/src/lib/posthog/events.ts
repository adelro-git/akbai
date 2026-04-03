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
  PROFILE_UPDATED: 'profile_updated',
  SIGNED_OUT: 'signed_out',
  EXPENSE_ADDED: 'expense_added',
  EXPENSE_DELETED: 'expense_deleted',
  // Marketing & landing page events
  WAITLIST_SIGNUP: 'waitlist_signup',
  LANDING_PAGE_VIEWED: 'landing_page_viewed',
  LANDING_PAGE_CTA_CLICKED: 'landing_page_cta_clicked',
  TOOL_USED: 'tool_used',
  TOOL_RESULT_SHARED: 'tool_result_shared',
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

/** Track when user updates their business profile */
export function trackProfileUpdated(): void {
  capture(EVENTS.PROFILE_UPDATED)
}

/** Track when user signs out */
export function trackSignedOut(): void {
  capture(EVENTS.SIGNED_OUT)
}

/** Track when user adds a manual expense/income transaction */
export function trackExpenseAdded(type: string, category: string): void {
  capture(EVENTS.EXPENSE_ADDED, { type, category })
}

/** Track when user deletes a transaction */
export function trackExpenseDeleted(): void {
  capture(EVENTS.EXPENSE_DELETED)
}

// ─── Marketing & Landing Page events ────────────────────────────────

/** Track when someone submits the waitlist form */
export function trackWaitlistSignup(source: string, emailDomain: string): void {
  capture(EVENTS.WAITLIST_SIGNUP, { source, email_domain: emailDomain })
}

/** Track when someone views the landing page */
export function trackLandingPageViewed(): void {
  capture(EVENTS.LANDING_PAGE_VIEWED)
}

/** Track when someone clicks a CTA button on the landing page */
export function trackLandingPageCtaClicked(section: string): void {
  capture(EVENTS.LANDING_PAGE_CTA_CLICKED, { section })
}

/** Track when someone uses a free tool */
export function trackToolUsed(toolName: string, resultType: string): void {
  capture(EVENTS.TOOL_USED, { tool_name: toolName, result_type: resultType })
}

/** Track when someone shares a tool result */
export function trackToolResultShared(toolName: string, shareChannel: string): void {
  capture(EVENTS.TOOL_RESULT_SHARED, { tool_name: toolName, share_channel: shareChannel })
}
