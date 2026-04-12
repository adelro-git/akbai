/**
 * Subscriptions Module — Barrel export for subscription lifecycle management
 * Feature: Xendit Payment Infrastructure (Build 8)
 */

// --- Types ---
export type {
  SubscriptionTier,
  SubscriptionStatus,
  Subscription,
  GracePeriodResult,
  SubscriptionInfo,
  XenditEventType,
  XenditWebhookPayload,
} from './types';

export {
  SubscriptionTierEnum,
  SubscriptionStatusEnum,
  GracePeriodResultSchema,
  SubscriptionInfoSchema,
  XenditEventTypeEnum,
  XenditWebhookPayloadSchema,
  SCAN_LIMITS,
} from './types';

// --- Lifecycle ---
export {
  activateSubscription,
  pauseSubscription,
  cancelSubscription,
  renewSubscription,
} from './lifecycle';

// --- Grace Period ---
export {
  startGracePeriod,
  checkGracePeriod,
  expireGracePeriod,
} from './grace-period';

// --- Auto-Cancel ---
export { processExpiredGracePeriods } from './auto-cancel';
export type { AutoCancelResult } from './auto-cancel';
