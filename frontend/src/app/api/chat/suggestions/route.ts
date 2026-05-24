/**
 * Chat Suggestions API — GET /api/chat/suggestions
 * Feature: Phase 8c — Suggested-question chips above the composer (ADR-016)
 * Role: Returns exactly 4 conversational-Filipino chip strings for the chat
 *       page. Rule-based DB queries (R1..R4) per ADR-016 §3, in-process Map
 *       cache 30-min TTL per ADR-016 §4. No LLM calls — flat ~$0 cost.
 *
 * Auth: identical SKIP_AUTH idiom to `/api/chat` per ADR-014.
 *   - Production: regular client + RLS scopes reads to the user.
 *   - Dev SKIP_AUTH: service client; rules manually filter by `user.id`.
 *
 * Failure mode: any error → 200 OK with the cold-start fallback chip set
 * and `cached: false`. The chip row must NEVER break the chat page; a
 * fallback row is a perfectly usable cold-start UX.
 *
 * Tier: all tiers (Free + Pro + Business). Chips are universal.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { SKIP_AUTH, DEV_USER } from '@/lib/supabase/dev-auth';
import { buildSuggestions, getColdStartFallback } from '@/lib/chat/suggestions';
import { getSuggestions, setSuggestions } from '@/lib/chat/suggestions/cache';
import type { ChatSuggestionsResponse } from '@/lib/chat/suggestions/types';

export async function GET() {
  try {
    // --- Auth Check (mirrors /api/chat) ---
    const supabase = await createClient();

    let userId: string;
    if (SKIP_AUTH) {
      userId = DEV_USER.id;
    } else {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        return NextResponse.json<ChatSuggestionsResponse>(
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

    // --- Cache check (30-min TTL, per-user) ---
    const cached = getSuggestions(userId);
    if (cached) {
      return NextResponse.json<ChatSuggestionsResponse>({
        success: true,
        data: { suggestions: cached, cached: true },
      });
    }

    // --- Run rules (R1..R4 + cold-start back-fill) ---
    // Service client in dev to mirror /api/chat's pattern; rules
    // self-scope to userId so RLS bypass is safe.
    const db = SKIP_AUTH ? createServiceClient() : supabase;
    const suggestions = await buildSuggestions(db, userId);

    // Route-level invariant (ADR-016 §1): always exactly 4 chips. If the
    // orchestrator regressed and returned fewer, defensively top up from
    // cold-start so the chip row never ships malformed.
    if (suggestions.length < 4) {
      const fallback = getColdStartFallback();
      const seen = new Set(suggestions.map((s) => s.id));
      for (const c of fallback) {
        if (suggestions.length >= 4) break;
        if (seen.has(c.id)) continue;
        suggestions.push(c);
        seen.add(c.id);
      }
    }

    // --- Persist to cache and respond ---
    setSuggestions(userId, suggestions);

    return NextResponse.json<ChatSuggestionsResponse>({
      success: true,
      data: { suggestions, cached: false },
    });
  } catch (error) {
    // Hard failure mode (DB outage, service-client construction error,
    // etc.) — return cold-start fallback so the chat page renders chips.
    // Never 500 on this endpoint per ADR-016 §6.
    console.error(
      '[ChatSuggestions] Falling back to cold-start chips:',
      error instanceof Error ? error.message : error
    );

    return NextResponse.json<ChatSuggestionsResponse>({
      success: true,
      data: { suggestions: getColdStartFallback(), cached: false },
    });
  }
}
