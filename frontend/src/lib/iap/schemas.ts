/**
 * RevenueCat Zod schemas — webhook envelope shape.
 *
 * Feature: In-App Purchase via RevenueCat (Sprint 17, Gap G2 resolution)
 * Role:    Validates the JSON body posted by RevenueCat to
 *          /api/webhooks/revenuecat (batch 2 webhook handler).
 *          Lives in lib/iap/ so the type definitions sit alongside
 *          the client SDK wrappers — single source-of-truth folder
 *          for "everything RevenueCat-shaped" (per architect §8
 *          batch 1 boundary).
 *
 * Consumers:
 *   - frontend/src/app/api/webhooks/revenuecat/route.ts  (batch 2)
 *   - frontend/src/lib/iap/server-entitlements.ts        (batch 2)
 *   - frontend/src/lib/iap/__tests__/*                   (batch 1 + 2)
 *
 * .passthrough() is intentional — RevenueCat adds new fields over time
 * (per their changelog) and we MUST NOT fail-closed on a forward-
 * compatible payload addition. Strict mode here would create silent
 * outages every time RC ships a new field.
 *
 * Architect reference: sprint-17-revenuecat-pattern.md §3 (lines 569-595).
 */

import { z } from 'zod';

// ============================================================
// Event-type enum. Mirrors RevenueCat docs §"Webhook event types".
// Keeping these as a Zod enum (vs z.string()) lets the dispatch
// switch in the webhook handler get exhaustiveness checks.
// ============================================================

export const RevenueCatEventTypeEnum = z.enum([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'CANCELLATION',
  'EXPIRATION',
  'BILLING_ISSUE',
  'PRODUCT_CHANGE',
  'NON_RENEWING_PURCHASE',
  'SUBSCRIBER_ALIAS',
  'TRANSFER',
  'UNCANCELLATION',
  'TEST',
]);
export type RevenueCatEventType = z.infer<typeof RevenueCatEventTypeEnum>;

// ============================================================
// Inner `event` payload — every field RC documents on its
// outgoing webhook event. `.passthrough()` allows additional
// fields to flow through; the webhook handler dispatches on
// `event.type` so unknown extras are inert.
// ============================================================

export const RevenueCatEventBodySchema = z
  .object({
    id: z.string().uuid(),
    type: RevenueCatEventTypeEnum,
    event_timestamp_ms: z.number().int().positive(),
    app_user_id: z.string().min(1),
    aliases: z.array(z.string()).optional(),
    product_id: z.string().optional(),
    period_type: z.enum(['NORMAL', 'TRIAL', 'INTRO']).optional(),
    environment: z.enum(['SANDBOX', 'PRODUCTION']),
    expiration_at_ms: z.number().int().nullable().optional(),
    purchased_at_ms: z.number().int().optional(),
    store: z.enum(['APP_STORE', 'PLAY_STORE', 'STRIPE', 'PROMOTIONAL']).optional(),
    transaction_id: z.string().optional(),
    original_transaction_id: z.string().optional(),
    entitlement_ids: z.array(z.string()).nullable().optional(),
  })
  .passthrough();

// ============================================================
// Outer envelope — `{ api_version, event: {...} }`. RevenueCat
// always wraps the event in this two-key shape; the webhook
// handler reads `parsed.data.event` after safeParse succeeds.
// ============================================================

export const RevenueCatEventSchema = z.object({
  api_version: z.string(),
  event: RevenueCatEventBodySchema,
});

export type RevenueCatEvent = z.infer<typeof RevenueCatEventBodySchema>;
export type RevenueCatWebhookPayload = z.infer<typeof RevenueCatEventSchema>;
