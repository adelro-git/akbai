'use client';

/**
 * Morning Briefing Card — Dashboard prominently-placed briefing display
 * Feature: Ang Umaga Mo (Build 5)
 * Role: Fetches and displays the AI-generated morning briefing on the dashboard.
 *       Handles loading, available, unavailable (upgrade CTA), and error states.
 *
 * Design: Mobile-first, uses MD3 design tokens (no hardcoded hex).
 *         Plus Jakarta Sans font, tonal layering, no borders.
 *
 * Dependencies: GET /api/morning-briefing
 */

import { useEffect, useRef, useState } from 'react';
import { Sun, Sparkles, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { IllustrationWrapper } from '@/components/illustrations/IllustrationWrapper';
import type { MorningBriefingResponse } from '@/lib/morning-briefing/types';

// ============================================================
// State Types
// ============================================================

type CardState = 'loading' | 'available' | 'unavailable' | 'error';

// ============================================================
// Component
// ============================================================

export default function MorningBriefingCard() {
  const [state, setState] = useState<CardState>('loading');
  const [briefing, setBriefing] = useState<string | null>(null);
  const [reason, setReason] = useState<MorningBriefingResponse['reason']>(undefined);
  const [messageTl, setMessageTl] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // --- Shared fetch logic (used by mount + retry) ---
  async function doFetch() {
    try {
      const res = await fetch('/api/morning-briefing');
      const json = await res.json();

      if (!json.success || !json.data) {
        setState('error');
        setMessageTl('Pasensya, may problema sa briefing ngayon. Try mo ulit mamaya.');
        return;
      }

      const data = json.data as MorningBriefingResponse;

      if (data.available && data.briefing) {
        setState('available');
        setBriefing(data.briefing);
      } else {
        setState('unavailable');
        setReason(data.reason);
        setMessageTl(data.message_tl ?? null);
      }
    } catch {
      setState('error');
      setMessageTl('Pasensya, may problema sa briefing ngayon. Try mo ulit mamaya.');
    }
  }

  // --- Fetch briefing on mount (once) ---
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    doFetch();
  }, []);

  // --- Retry handler (uses ref pattern, not onClick on form) ---
  const retryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const btn = retryRef.current;
    if (!btn) return;

    function handleRetry() {
      setState('loading');
      doFetch();
    }

    btn.addEventListener('click', handleRetry);
    return () => btn.removeEventListener('click', handleRetry);
  }, [state]);

  // --- Loading State ---
  if (state === 'loading') {
    return (
      <div
        className="mx-4 mb-4 rounded-xl bg-surface-container p-4 animate-pulse"
        data-testid="morning-briefing-loading"
        style={{ minHeight: '120px' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high" />
          <div className="h-4 w-36 rounded bg-surface-container-high" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-surface-container-high" />
          <div className="h-3 w-4/5 rounded bg-surface-container-high" />
          <div className="h-3 w-3/5 rounded bg-surface-container-high" />
        </div>
      </div>
    );
  }

  // --- Available State: Show briefing ---
  if (state === 'available' && briefing) {
    return (
      <div
        className="mx-4 mb-4 rounded-xl bg-surface-container p-4"
        data-testid="morning-briefing-card"
        style={{ minHeight: '120px' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center">
            <Sun className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-on-surface text-sm font-bold">
            Ang Umaga Mo
          </h2>
          <div className="ml-auto flex items-center gap-1">
            <IllustrationWrapper
              src="features/feature-morning-briefing-v1.webp"
              alt="Ang Umaga Mo morning briefing"
              category="empty-state"
              width={48}
              height={36}
            />
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
        </div>

        {/* Briefing Content */}
        <div className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
          {briefing}
        </div>
      </div>
    );
  }

  // --- Unavailable: Tier Required (upgrade CTA) ---
  if (state === 'unavailable' && reason === 'tier_required') {
    return (
      <div
        className="mx-4 mb-4 rounded-xl bg-surface-container p-4"
        data-testid="morning-briefing-upgrade"
        style={{ minHeight: '88px' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-on-surface-variant" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-on-surface text-sm font-bold">
              Ang Umaga Mo
            </h3>
            <p className="text-on-surface-variant text-xs mt-0.5">
              {messageTl ?? 'Mag-upgrade sa Pro para makita ang Morning Briefing mo!'}
            </p>
          </div>
        </div>
        <Link
          href="/upgrade"
          className="mt-3 block w-full text-center py-2.5 rounded-lg bg-primary-container text-on-primary text-sm font-semibold transition-colors active:opacity-90"
          style={{ minHeight: '44px', lineHeight: '28px' }}
        >
          Mag-upgrade na
        </Link>
      </div>
    );
  }

  // --- Unavailable: Outside window or feature disabled ---
  if (state === 'unavailable') {
    return (
      <div
        className="mx-4 mb-4 rounded-xl bg-surface-container p-4"
        data-testid="morning-briefing-unavailable"
        style={{ minHeight: '88px' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center">
            <Sun className="w-4 h-4 text-on-surface-variant" />
          </div>
          <h3 className="text-on-surface text-sm font-bold">
            Ang Umaga Mo
          </h3>
        </div>
        <p className="text-on-surface-variant text-xs">
          {messageTl ?? 'Bukas ulit! Ang Morning Briefing mo ay mula 5AM hanggang 12PM lang — balik ka ng umaga!'}
        </p>
      </div>
    );
  }

  // --- Error State ---
  return (
    <div
      className="mx-4 mb-4 rounded-xl bg-surface-container p-4"
      data-testid="morning-briefing-error"
      style={{ minHeight: '88px' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-error-container/30 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-on-error-container" />
        </div>
        <h3 className="text-on-surface text-sm font-bold">
          Ang Umaga Mo
        </h3>
      </div>
      <p className="text-on-surface-variant text-xs mb-3">
        {messageTl ?? 'Pasensya, may problema sa briefing ngayon. Try mo ulit mamaya.'}
      </p>
      <button
        ref={retryRef}
        type="button"
        className="py-2 px-4 rounded-lg bg-surface-container-high text-on-surface text-xs font-semibold transition-colors active:bg-surface-container-highest"
        style={{ minHeight: '44px' }}
      >
        Try Ulit
      </button>
    </div>
  );
}
