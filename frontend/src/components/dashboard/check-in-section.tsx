'use client';

/**
 * Check-In Section — manages daily check-in lifecycle:
 * 1. Auto-opens modal on first visit if no check-in today
 * 2. Shows summary card if already checked in (with "I-update?" option)
 * 3. After 5pm, shows stronger nudge CTA if not yet checked in
 * 4. Confirms overwrite before replacing existing check-in
 *
 * Phase 7: the "no check-in yet" CTA is rendered as a PaperNote
 * (paper-note-asymmetric-corners pattern) with streak-aware copy
 * (Pang-{n} araw na natin / firstTime / resetCopy). The streak count
 * is computed server-side and passed in via props (per the brief)
 * so the paper-note SSRs with the correct text.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check, RefreshCw } from 'lucide-react';
import Money from '@/components/ui/money';
import { toManila } from '@/lib/timezone';
import { PaperNote } from '@/components/ui/paper-note';
import type { StreakStatus } from '@/lib/streak/compute-streak';
import CheckInModal from './check-in-modal';

// ============================================================
// Types
// ============================================================

interface CheckInData {
  id: string;
  mood: string | null;
  kai_greeting: string;
  check_in_date: string;
  sales_amount: number | null;
  expenses_amount: number | null;
}

interface CheckInSectionProps {
  todayCheckIn: CheckInData | null;
  /** Streak count computed server-side via lib/streak/compute-streak.ts */
  streak: number;
  /** Streak status — drives invite copy variant (firstTime / resetCopy / streak). */
  streakStatus: StreakStatus;
  /** Display name — interpolated into resetCopy. Defaults to "Boss". */
  userName?: string;
}

const MOOD_DISPLAY: Record<string, string> = {
  bongga: '🔥 Bongga',
  okay: '😊 Okay',
  steady: '😐 Steady',
  hirap: '😰 Hirap',
  grabe: '💀 Grabe',
};

// Key to track if we've already auto-prompted this session
const AUTO_PROMPT_KEY = 'akbai_checkin_autoprompt';

// ============================================================
// Component
// ============================================================

export default function CheckInSection({
  todayCheckIn,
  streak,
  streakStatus,
  userName = 'Boss',
}: CheckInSectionProps) {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [showUpdatedToast, setShowUpdatedToast] = useState(false);
  const isOverwrite = useRef(false);
  const autoPromptDone = useRef(false);
  const router = useRouter();

  // ── Auto-prompt on first login if no check-in today ──
  useEffect(() => {
    if (todayCheckIn) return;        // already checked in
    if (autoPromptDone.current) return; // already prompted this render cycle

    // Only auto-prompt once per browser session
    const prompted = sessionStorage.getItem(AUTO_PROMPT_KEY);
    if (prompted === 'true') return;

    autoPromptDone.current = true;
    sessionStorage.setItem(AUTO_PROMPT_KEY, 'true');

    // Small delay so the dashboard renders first
    const timer = setTimeout(() => setIsModalOpen(true), 800);
    return () => clearTimeout(timer);
  }, [todayCheckIn]);

  const handleSuccess = useCallback(() => {
    setIsModalOpen(false);
    setShowOverwriteConfirm(false);
    if (isOverwrite.current) {
      setShowUpdatedToast(true);
      isOverwrite.current = false;
      setTimeout(() => setShowUpdatedToast(false), 3000);
    }
    router.refresh();
  }, [router]);

  // ── Handle "update" click — show overwrite confirmation ──
  const handleUpdateClick = useCallback(() => {
    setShowOverwriteConfirm(true);
  }, []);

  const handleConfirmOverwrite = useCallback(() => {
    setShowOverwriteConfirm(false);
    isOverwrite.current = true;
    setIsModalOpen(true);
  }, []);

  // ── Already checked in: show summary + optional update ──
  if (todayCheckIn) {
    const moodLabel = todayCheckIn.mood
      ? MOOD_DISPLAY[todayCheckIn.mood] ?? todayCheckIn.mood
      : null;

    return (
      <>
        <section data-testid="check-in-summary">
          <div className="bg-surface-container rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-tertiary/10 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-tertiary" />
                </div>
                <p className="text-on-surface text-sm font-semibold">
                  Na-check-in ka na!
                </p>
                {streak > 0 && (
                  <span
                    className="ml-1 text-xs font-semibold text-honey-deep"
                    data-testid="check-in-summary-streak"
                  >
                    {t('checkin.streak', { count: streak })}
                  </span>
                )}
              </div>
              <button
                onClick={handleUpdateClick}
                className="flex items-center gap-1 text-primary text-xs font-semibold"
                type="button"
                data-testid="check-in-update-btn"
              >
                <RefreshCw className="w-3 h-3" />
                I-update
              </button>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
              {moodLabel && (
                <span data-testid="check-in-summary-mood">
                  {t('checkin.summary.mood')}: {moodLabel}
                </span>
              )}
              {todayCheckIn.sales_amount != null && (
                <span className="inline-flex items-baseline gap-1" data-testid="check-in-summary-sales">
                  {t('checkin.summary.kita')}: <Money centavos={todayCheckIn.sales_amount} size="sm" />
                </span>
              )}
              {todayCheckIn.expenses_amount != null && (
                <span className="inline-flex items-baseline gap-1" data-testid="check-in-summary-expenses">
                  {t('checkin.summary.gastos')}: <Money centavos={todayCheckIn.expenses_amount} size="sm" />
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Overwrite confirmation dialog */}
        {showOverwriteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setShowOverwriteConfirm(false)} />
            <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-2xl p-5 text-center">
              <p className="text-on-surface text-sm font-bold mb-2">
                I-update ang check-in mo?
              </p>
              <p className="text-on-surface-variant text-xs mb-4">
                Ma-o-overwrite ang existing check-in mo for today.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowOverwriteConfirm(false)}
                  className="flex-1 bg-surface-container text-on-surface-variant font-semibold rounded-xl py-2.5 text-sm"
                  type="button"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  onClick={handleConfirmOverwrite}
                  className="flex-1 bg-primary-container text-on-primary font-semibold rounded-xl py-2.5 text-sm"
                  type="button"
                >
                  Oo, i-update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Updated toast */}
        {showUpdatedToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-tertiary text-on-tertiary text-sm font-semibold px-4 py-2 rounded-xl shadow-lg">
            Na-update na ang check-in mo!
          </div>
        )}

        <CheckInModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          hasExistingCheckIn={!!todayCheckIn}
        />
      </>
    );
  }

  // ── No check-in yet: paper-note invite (Phase 7) ──
  // Resolve sub-line copy from streak status — three variants per the brief.
  let subLine: string;
  if (streakStatus === 'reset') {
    subLine = t('checkin.resetCopy', { name: userName });
  } else if (streakStatus === 'active' && streak > 0) {
    // Active streak — yesterday existed; today is the next checkpoint.
    // We render Pang-{streak+1} araw na natin so the count reads as
    // the day-about-to-happen. (Pure-display sugar; the underlying
    // streak count from compute-streak is unchanged.)
    subLine = t('checkin.streak', { count: streak + 1 });
  } else {
    // status === 'fresh' (and streak is 0) → first-ever check-in.
    subLine = t('checkin.firstTime');
  }

  // After-5pm gets a slightly stronger tilt + tape rhythm (still left-tilted
  // per the asymmetric-corners pattern; the urgency is in the sub-line copy
  // emitted by the modal upstream rather than another visual variant here).
  void toManila; // retained for future tilt variation if Anton wants it

  return (
    <>
      <section data-testid="check-in-cta">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-deep rounded-2xl"
          type="button"
          data-testid="check-in-cta-button"
        >
          <PaperNote tilt="left" tape="left" padding="md" tone="default">
            <p className="font-serif text-[20px] font-medium text-on-surface leading-snug">
              {t('checkin.openCta')}
            </p>
            <p
              className="mt-1.5 text-sm text-honey-deep font-semibold"
              data-testid="check-in-cta-streak"
            >
              {subLine}
            </p>
          </PaperNote>
        </button>
      </section>

      <CheckInModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
