/**
 * Subscription API Route — GET current user's subscription status
 * Feature: Xendit Payment Infrastructure (Build 8)
 * Role: Return subscription tier, status, grace period info, and scan usage
 *
 * Flow: Auth check → query subscription → check grace period → return info
 *
 * Dependencies: Supabase server client (for auth), service client (for grace check)
 * Tested by: QA — auth required, subscription lookup, grace period info
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { checkGracePeriod } from '@/lib/subscriptions/grace-period';
import type { SubscriptionInfo } from '@/lib/subscriptions/types';
import type { SubscriptionTier, SubscriptionStatus } from '@/lib/subscriptions/types';

// ============================================================
// GET — Return current user's subscription info
// ============================================================

export async function GET() {
  // --- Auth Check: Verify session and get user ID ---
  let userId: string;

  if (SKIP_AUTH) {
    userId = DEV_USER.id;
  } else {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            message_tl: 'Kailangan muna mag-login.',
          },
        },
        { status: 401 }
      );
    }

    userId = user.id;
  }

  // --- Fetch subscription using service client (reads bypass RLS for consistency) ---
  const serviceClient = createServiceClient();
  const { data: sub, error: subError } = await serviceClient
    .from('subscriptions')
    .select('tier, status, current_period_end, grace_period_end, grace_notifications_sent, scans_used_this_period, scan_limit')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single();

  // --- No subscription found: return free tier defaults ---
  if (subError || !sub) {
    const defaultInfo: SubscriptionInfo = {
      tier: 'free',
      status: 'active',
      currentPeriodEnd: null,
      gracePeriod: null,
      scansUsed: 0,
      scanLimit: 0,
    };

    return NextResponse.json({ success: true, data: defaultInfo }, { status: 200 });
  }

  // --- Check grace period status ---
  const gracePeriod = sub.status === 'past_due'
    ? await checkGracePeriod(serviceClient, userId)
    : null;

  const info: SubscriptionInfo = {
    tier: sub.tier as SubscriptionTier,
    status: sub.status as SubscriptionStatus,
    currentPeriodEnd: sub.current_period_end,
    gracePeriod,
    scansUsed: sub.scans_used_this_period ?? 0,
    scanLimit: sub.scan_limit ?? 0,
  };

  return NextResponse.json({ success: true, data: info }, { status: 200 });
}
