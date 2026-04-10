/**
 * Meta Webhook — Dummy endpoint for Meta App Review submission
 * Feature: Meta API Integration (Sprint 12, Gap E2)
 * Role: Handles Meta webhook verification (GET) and payload receipt (POST)
 *
 * Flow: GET → verify hub.verify_token → return hub.challenge
 *       POST → receive payload → log → return 200 OK
 *
 * Why: Meta App Review takes 1-3+ months. Submitting this endpoint now
 *       starts the clock so DM Connect (Phase 2) isn't blocked by bureaucracy.
 *
 * Dependencies: META_WEBHOOK_VERIFY_TOKEN env var
 * Tested by: QA — verification success/failure, POST handling, missing token
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================================
// Zod Schemas — Validate incoming webhook params
// ============================================================

const MetaVerifySchema = z.object({
  'hub.mode': z.literal('subscribe'),
  'hub.verify_token': z.string().min(1),
  'hub.challenge': z.string().min(1),
});

const MetaWebhookPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(z.record(z.unknown())).optional(),
}).passthrough();

// ============================================================
// GET — Meta Webhook Verification
// Responds with hub.challenge if the verify token matches.
// ============================================================

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const params = {
    'hub.mode': searchParams.get('hub.mode') ?? '',
    'hub.verify_token': searchParams.get('hub.verify_token') ?? '',
    'hub.challenge': searchParams.get('hub.challenge') ?? '',
  };

  // --- Validate query params ---
  const parsed = MetaVerifySchema.safeParse(params);
  if (!parsed.success) {
    console.warn('[Meta Webhook] Invalid verification params:', parsed.error.flatten());
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_PARAMS', message: 'Missing or invalid verification parameters' } },
      { status: 400 }
    );
  }

  // --- Check verify token matches env var ---
  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!expectedToken) {
    console.error('[Meta Webhook] META_WEBHOOK_VERIFY_TOKEN not configured');
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_CONFIG', message: 'Webhook verify token not configured' } },
      { status: 500 }
    );
  }

  if (parsed.data['hub.verify_token'] !== expectedToken) {
    console.warn('[Meta Webhook] Verify token mismatch');
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Verify token mismatch' } },
      { status: 403 }
    );
  }

  // --- Return challenge to complete verification ---
  return new NextResponse(parsed.data['hub.challenge'], {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

// ============================================================
// POST — Receive Webhook Payload
// Logs the payload and returns 200 OK. Actual processing is Phase 2.
// ============================================================

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' } },
      { status: 400 }
    );
  }

  // --- Validate payload structure ---
  const parsed = MetaWebhookPayloadSchema.safeParse(body);
  if (!parsed.success) {
    console.warn('[Meta Webhook] Invalid payload:', parsed.error.flatten());
    // Still return 200 — Meta retries on non-2xx and we don't want retry storms
    return NextResponse.json({ success: true, data: { received: true } }, { status: 200 });
  }

  // --- Log for observability (Phase 2 will process these) ---
  console.log('[Meta Webhook] Received payload:', JSON.stringify(parsed.data).slice(0, 500));

  return NextResponse.json({ success: true, data: { received: true } }, { status: 200 });
}
