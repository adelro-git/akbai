/**
 * Admin MRR API — Calculate Monthly Recurring Revenue
 * Feature: Admin Dashboard (Gap D10)
 * Role: Counts users per subscription tier and calculates MRR
 *       based on tier pricing. Uses service client to bypass RLS.
 *
 * Auth: Requires admin email match
 * Dependencies: createServiceClient(), tier pricing constants
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin/auth';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { enforceRateLimit } from '@/lib/rate-limit/middleware';

// ============================================================
// Tier Pricing — Monthly price in centavos per tier
// Free = 0, Pro = ₱299/mo, Business = ₱799/mo
// ============================================================

export const TIER_PRICING_CENTAVOS: Record<string, number> = {
  free: 0,
  pro: 29900,
  business: 79900,
};

// ============================================================
// Types
// ============================================================

interface TierBreakdown {
  tier: string;
  count: number;
  mrr_centavos: number;
}

interface MrrResponse {
  total_mrr_centavos: number;
  total_users: number;
  paying_users: number;
  breakdown: TierBreakdown[];
}

// ============================================================
// GET — Calculate MRR from active subscriptions
// ============================================================

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, { key: 'admin', windowMs: 60_000, maxRequests: 60 });
  if (limited) return limited;

  // --- Auth Check ---
  if (!SKIP_AUTH) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const admin = await isAdmin(user.id);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required.' } },
        { status: 403 }
      );
    }
  }

  // --- Fetch: Get all non-deleted users with their tiers ---
  const service = createServiceClient();

  const { data: users, error: queryError } = await service
    .from('users')
    .select('subscription_tier')
    .is('deleted_at', null);

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_ERROR', message: 'Failed to fetch subscription data.' } },
      { status: 500 }
    );
  }

  // --- Calculate: Count per tier and compute MRR ---
  const tierCounts = new Map<string, number>();

  for (const u of users ?? []) {
    const tier = (u.subscription_tier as string) ?? 'free';
    tierCounts.set(tier, (tierCounts.get(tier) ?? 0) + 1);
  }

  let totalMrr = 0;
  let payingUsers = 0;
  const breakdown: TierBreakdown[] = [];

  for (const [tier, count] of tierCounts.entries()) {
    const pricePerUser = TIER_PRICING_CENTAVOS[tier] ?? 0;
    const tierMrr = pricePerUser * count;
    totalMrr += tierMrr;

    if (pricePerUser > 0) {
      payingUsers += count;
    }

    breakdown.push({
      tier,
      count,
      mrr_centavos: tierMrr,
    });
  }

  // Sort: paying tiers first, then by MRR desc
  breakdown.sort((a, b) => b.mrr_centavos - a.mrr_centavos);

  const response: MrrResponse = {
    total_mrr_centavos: totalMrr,
    total_users: (users ?? []).length,
    paying_users: payingUsers,
    breakdown,
  };

  return NextResponse.json({ success: true, data: response });
}
