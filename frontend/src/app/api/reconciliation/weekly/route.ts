/**
 * Weekly Reconciliation API — GET /api/reconciliation/weekly
 * Feature: Sprint 18 data-completeness reconciliation (Build 5 rebuild).
 * Role: Returns which of the trailing 7 Manila days the user has NOT logged a
 *       daily check-in for, plus running sales/expenses/net totals, so the
 *       user can back-fill incomplete financial data.
 *
 * Auth + RLS: mirrors /api/dashboard + /api/weekly-story (ADR-014 SKIP_AUTH
 * client-consistency rule). Production reads honor RLS via the auth-bound
 * client; dev mode (SKIP_AUTH) bypasses RLS via the service client to read
 * DEV_USER's actual rows so the home page and this route agree.
 *
 * Tier gating: NONE — data-completeness nudging is a core home moment for all
 * tiers, consistent with the Kuwento card.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { getManilaToday } from '@/lib/timezone';
import { computeWeeklyReconciliation } from '@/lib/reconciliation';
import type { ReconciliationCheckIn } from '@/lib/reconciliation';

// ============================================================
// Zod — query input. Optional `today` override (YYYY-MM-DD) is accepted for
// deterministic testing/preview; it defaults to the Manila clock. Any
// malformed value is rejected before it touches the date math.
// ============================================================

const QuerySchema = z.object({
  today: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'today must be YYYY-MM-DD')
    .optional(),
});

const WEEKLY_WINDOW_DAYS = 7;

/** Subtract n days from a YYYY-MM-DD string (UTC-anchored, no tz drift). */
function shiftDate(dateStr: string, deltaDays: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// ============================================================
// GET — trailing 7-day reconciliation for the current Manila week window.
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // --- Auth resolution (ADR-014) ---
    let userId: string;
    if (SKIP_AUTH) {
      userId = DEV_USER.id;
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
          { status: 401 },
        );
      }
      userId = authUser.id;
    }

    // --- Validate query input ---
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      today: url.searchParams.get('today') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid query parameters',
            message_tl: 'Mali ang petsa sa request.',
          },
        },
        { status: 400 },
      );
    }

    const today = parsed.data.today ?? getManilaToday();
    const rangeStart = shiftDate(today, -(WEEKLY_WINDOW_DAYS - 1));

    // ADR-014: dev bypass uses the service client; production keeps the
    // auth-bound client so RLS (auth.uid() = user_id) is enforced.
    const db = SKIP_AUTH ? createServiceClient() : supabase;

    const { data, error } = await db
      .from('daily_check_in')
      .select('check_in_date, sales_amount, expenses_amount')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('check_in_date', rangeStart)
      .lte('check_in_date', today);

    if (error) {
      console.error('[ReconciliationWeekly] DB error:', error.message);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DB_ERROR',
            message: 'Failed to load reconciliation data',
            message_tl: 'May problema sa pagkuha ng data. Subukan ulit mamaya.',
          },
        },
        { status: 500 },
      );
    }

    const checkIns = (data ?? []) as ReconciliationCheckIn[];
    const reconciliation = computeWeeklyReconciliation(checkIns, today);

    return NextResponse.json({ success: true, data: reconciliation });
  } catch (err: unknown) {
    console.error(
      '[ReconciliationWeekly] Error:',
      err instanceof Error ? err.message : String(err),
    );
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unexpected error',
          message_tl: 'May problema sa server. Subukan ulit mamaya.',
        },
      },
      { status: 500 },
    );
  }
}
