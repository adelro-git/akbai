// ============================================================
// API Route: OCR Receipt Scan (Sprint 4 — Gap E1 Spike, updated Sprint 12)
// Endpoint: POST /api/ocr
// Version: 0.2.0
// Last changed: 2026-04-10
//
// Purpose: Accept a receipt image upload and return structured extraction.
//          Now includes duplicate detection (Gap C1): after OCR parsing,
//          checks for existing transactions with same hash within ±30 min.
// Input: FormData with 'image' file, optional 'force_save' flag
// Output: ReceiptParseResult with optional dedup info
// Guardrails: Auth check, file size (10MB), MIME type, circuit breaker, dedup
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rate-limit/middleware';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import {
  checkCircuitBreaker,
  recordSpend,
  KA_ERROR_MESSAGES,
} from '@/lib/claude';
import type { UserTier } from '@/lib/claude';
import { parseReceipt, estimateOcrCost, calculateOcrCost } from '@/lib/ocr';
import { generateReceiptHash, checkDuplicate } from '@/lib/ocr/dedup';
import { SUPPORTED_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from '@/lib/ocr/types';

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, { key: 'ocr', windowMs: 60_000, maxRequests: 10 });
  if (limited) return limited;

  try {
    // --- Auth Check ---
    const supabase = await createClient();

    let user;
    if (SKIP_AUTH) {
      user = DEV_USER;
    } else {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
              message_tl: 'Kailangan mag-login muna.',
            },
          },
          { status: 401 }
        );
      }
      user = authUser;
    }

    // --- Parse FormData ---
    const formData = await req.formData();
    const imageFile = formData.get('image');

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'No image file provided',
            message_tl: 'Walang image na na-upload — subukan ulit.',
          },
        },
        { status: 400 }
      );
    }

    // --- Validate File Size ---
    if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `Image must be under 10MB (received ${(imageFile.size / (1024 * 1024)).toFixed(1)}MB)`,
            message_tl: 'Masyadong malaki ang image — under 10MB lang po.',
          },
        },
        { status: 400 }
      );
    }

    // --- Validate MIME Type ---
    if (!SUPPORTED_MIME_TYPES.includes(imageFile.type as typeof SUPPORTED_MIME_TYPES[number])) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: `Unsupported image type: ${imageFile.type}. Use JPEG, PNG, or WebP.`,
            message_tl: 'Hindi supported ang format ng image — JPEG, PNG, o WebP lang po.',
          },
        },
        { status: 400 }
      );
    }

    // --- API Key Check ---
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFIG_ERROR',
            message: KA_ERROR_MESSAGES.api_key_missing,
            message_tl: KA_ERROR_MESSAGES.api_key_missing,
          },
        },
        { status: 503 }
      );
    }

    // --- Circuit Breaker (skipped in dev bypass) ---
    let tier: UserTier = 'free';
    if (!SKIP_AUTH) {
      // Load user tier
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      tier = (subscription?.tier as UserTier) ?? 'free';

      // Circuit Breaker: Fail-Closed
      let serviceSupabase;
      try {
        serviceSupabase = createServiceClient();
      } catch {
        console.error('[OCR] Service role client unavailable — blocking (fail-closed)');
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: KA_ERROR_MESSAGES.circuit_breaker_unavailable,
              message_tl: KA_ERROR_MESSAGES.circuit_breaker_unavailable,
            },
          },
          { status: 503 }
        );
      }

      const estCost = estimateOcrCost('haiku');

      let cbResult;
      try {
        cbResult = await checkCircuitBreaker(
          serviceSupabase,
          user.id,
          estCost,
          tier
        );
      } catch (cbError) {
        console.error('[OCR] Circuit breaker check failed — blocking (fail-closed)', cbError);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: KA_ERROR_MESSAGES.circuit_breaker_unavailable,
              message_tl: KA_ERROR_MESSAGES.circuit_breaker_unavailable,
            },
          },
          { status: 503 }
        );
      }

      if (!cbResult.allowed) {
        const errorMessage =
          cbResult.reason === 'global_cap'
            ? KA_ERROR_MESSAGES.global_cap
            : KA_ERROR_MESSAGES.user_cap;
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMITED',
              message: errorMessage,
              message_tl: errorMessage,
            },
          },
          { status: 429 }
        );
      }
    }

    // --- Read Image Buffer ---
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // --- Parse Receipt ---
    const result = await parseReceipt(imageBuffer, imageFile.type);

    // --- Record Spend (skip in dev bypass) ---
    // C3: parseReceipt may make TWO Claude calls (Haiku then a Sonnet
    // fallback). Bill EVERY call in the breakdown at its own model's rate so
    // the circuit breaker isn't under-counted. Fall back to the cumulative
    // tokenUsage on the returned model if no breakdown is present (legacy
    // shape / single call).
    if (!SKIP_AUTH && result.tokenUsage.input > 0) {
      try {
        const serviceSupabase = createServiceClient();
        const calls =
          result.tokenUsageBreakdown && result.tokenUsageBreakdown.length > 0
            ? result.tokenUsageBreakdown
            : [{ model: result.model, ...result.tokenUsage }];
        const totalCost = calls.reduce(
          (sum, call) =>
            sum + calculateOcrCost(call.model, { input: call.input, output: call.output }),
          0
        );
        await recordSpend(
          serviceSupabase,
          user.id,
          totalCost,
          'resibo_scanner'
        );
      } catch (spendError) {
        console.error(
          '[OCR] Failed to record spend — scan succeeded but cost not tracked',
          spendError
        );
      }
    }

    // --- Dedup Check (Gap C1): Flag duplicates before saving ---
    // Check if force_save was set (user confirmed save despite duplicate)
    const forceSave = formData.get('force_save') === 'true';
    let dedupInfo: {
      is_duplicate: boolean;
      existing_transaction: Record<string, unknown> | null;
      receipt_hash: string | null;
    } = { is_duplicate: false, existing_transaction: null, receipt_hash: null };

    if (result.success && !forceSave) {
      const totalCentavos =
        typeof result.fields.total.value === 'number'
          ? result.fields.total.value
          : 0;
      const dateStr =
        typeof result.fields.date.value === 'string'
          ? result.fields.date.value
          : '';
      const merchantStr =
        typeof result.fields.merchant.value === 'string'
          ? result.fields.merchant.value
          : '';

      if (totalCentavos > 0 && dateStr) {
        const receiptHash = generateReceiptHash(
          totalCentavos,
          dateStr,
          merchantStr
        );
        dedupInfo.receipt_hash = receiptHash;

        try {
          // Use service client for dedup check (works in both auth and dev bypass)
          const dedupClient = SKIP_AUTH
            ? createServiceClient()
            : supabase;

          const existingTx = await checkDuplicate(
            dedupClient,
            user.id,
            receiptHash,
            new Date()
          );

          if (existingTx) {
            dedupInfo.is_duplicate = true;
            dedupInfo.existing_transaction =
              existingTx as unknown as Record<string, unknown>;
          }
        } catch (dedupError) {
          // Fail open — don't block scan if dedup check fails
          console.error('[OCR] Dedup check failed (proceeding):', dedupError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { ...result, dedup: dedupInfo },
    });
  } catch (error: unknown) {
    console.error('[OCR] API error:', error instanceof Error ? error.message : error);
    console.error('[OCR] Stack:', error instanceof Error ? error.stack : 'no stack');
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: KA_ERROR_MESSAGES.api_error,
          message_tl: KA_ERROR_MESSAGES.api_error,
        },
      },
      { status: 500 }
    );
  }
}
