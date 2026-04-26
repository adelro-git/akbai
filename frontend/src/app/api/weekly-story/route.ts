/**
 * Weekly Story API — GET /api/weekly-story
 * Feature: Phase 7 home Kuwento card + Phase 10 /kuwento route (ADR-015).
 * Role: Returns the typed WeeklyStoryResponse for the calling user.
 *
 * Phase 7: pure-DB aggregation, no LLM, no cache table. Phase 10 will add
 * `weekly_stories` table + Sunday 6 AM Vercel cron (Q10 resolution); the
 * route shape is stable across phases.
 *
 * Auth + RLS: mirrors /api/morning-briefing exactly (ADR-014 SKIP_AUTH
 * client-consistency rule). Production reads honor RLS via the auth-bound
 * client; dev mode bypasses RLS via the service client to read DEV_USER's
 * actual rows (so home page + this route agree on the same payload).
 *
 * Tier gating: NONE. The Kuwento card is a core home moment available to
 * all tiers (per ADR-015 §6).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { aggregateWeeklyStory } from '@/lib/weekly-story/aggregate';
import type { WeeklyStoryResponse } from '@/lib/weekly-story/types';

// ============================================================
// GET — compute and return the weekly story for the current Manila week
// ============================================================

export async function GET() {
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
          { status: 401 }
        );
      }

      userId = authUser.id;
    }

    // ADR-014: dev bypass uses the service client so this route reads the
    // same data the dashboard page reads (which also uses the service client
    // under SKIP_AUTH). Production keeps the auth-bound client.
    const db = SKIP_AUTH ? createServiceClient() : supabase;

    // Pull user display name — flows through into the takeaway template.
    const { data: userData } = await db
      .from('users')
      .select('display_name')
      .eq('id', userId)
      .single();

    const userName: string | undefined = userData?.display_name ?? undefined;

    // --- Aggregate ---
    let story = null;
    try {
      story = await aggregateWeeklyStory(db, userId, userName);
    } catch (aggError) {
      // Log only the message string — the raw error object can carry Supabase
      // query fragments we don't want in server logs.
      console.error(
        '[WeeklyStory] Aggregation error:',
        aggError instanceof Error ? aggError.message : String(aggError)
      );
      const response: WeeklyStoryResponse = {
        available: false,
        reason: 'error',
        cached: false,
        message_tl: 'Pasensya, may problema sa Kuwento ngayon. Try mo ulit mamaya.',
      };
      return NextResponse.json({ success: true, data: response });
    }

    if (!story) {
      const response: WeeklyStoryResponse = {
        available: false,
        reason: 'no_data',
        cached: false,
        message_tl:
          'Wala pang ginagalaw ngayong linggo. Mag-scan ka ng resibo o mag-check-in para makita ang Kuwento mo.',
      };
      return NextResponse.json({ success: true, data: response });
    }

    const response: WeeklyStoryResponse = {
      available: true,
      story,
      cached: false,
    };
    return NextResponse.json({ success: true, data: response });
  } catch (error: unknown) {
    console.error('[WeeklyStory] Error:', error instanceof Error ? error.message : error);

    const response: WeeklyStoryResponse = {
      available: false,
      reason: 'error',
      cached: false,
      message_tl: 'Pasensya, may problema sa Kuwento ngayon. Try mo ulit mamaya.',
    };
    return NextResponse.json({ success: true, data: response });
  }
}
