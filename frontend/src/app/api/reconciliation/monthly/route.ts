/**
 * Monthly Reconciliation API — GET /api/reconciliation/monthly
 * Feature: Sprint 18 data-completeness reconciliation (Build 5 rebuild).
 * Role: Returns the current month-to-date summary (sales/expenses/net,
 *       days logged vs elapsed) plus which elapsed Manila days have NO
 *       daily check-in, so the user can back-fill incomplete data.
 *
 * Auth + RLS: mirrors /api/dashboard + /api/weekly-story (ADR-014 SKIP_AUTH
 * client-consistency rule). Production reads honor RLS via the auth-bound
 * client; dev mode (SKIP_AUTH) bypasses RLS via the service client.
 *
 * Tier gating: NONE — core home moment for all tiers.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { getManilaToday } from '@/lib/timezone';
import { computeMonthlyReconciliation } from '@/lib/reconciliation';
import type { ReconciliationCheckIn } from '@/lib/reconciliation';

// ============================================================
// Zod — query input. Optional `today` override (YYYY-MM-DD) for deterministic
// testing/preview; defaults to the Manila clock.
// ============================================================

const QuerySchema = z.object({
  today: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'today must be YYYY-MM-DD')
    .optional(),
});

/** First day of the month containing dateStr (YYYY-MM-01). */
function firstOfMonth(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  return `${year}-${month}-01`;
}

// ============================================================
// GET — current month-to-date reconciliation.
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
    const monthStart = firstOfMonth(today);

    // ADR-014: dev bypass uses the service client; production keeps the
    // auth-bound client so RLS (auth.uid() = user_id) is enforced.
    const db = SKIP_AUTH ? createServiceClient() : supabase;

    const { data, error } = await db
      .from('daily_check_in')
      .select('check_in_date, sales_amount, expenses_amount')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('check_in_date', monthStart)
      .lte('check_in_date', today);

    if (error) {
      console.error('[ReconciliationMonthly] DB error:', error.message);
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
    const reconciliation = computeMonthlyReconciliation(checkIns, today);

    return NextResponse.json({ success: true, data: reconciliation });
  } catch (err: unknown) {
    console.error(
      '[ReconciliationMonthly] Error:',
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
