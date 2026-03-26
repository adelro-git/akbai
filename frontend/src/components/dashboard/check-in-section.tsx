'use client';

/**
 * Check-In Section — manages daily check-in lifecycle:
 * 1. Auto-opens modal on first visit if no check-in today
 * 2. Shows summary card if already checked in (with "I-update?" option)
 * 3. After 5pm, shows stronger nudge CTA if not yet checked in
 * 4. Confirms overwrite before replacing existing check-in
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Check, RefreshCw } from 'lucide-react';
import { centavosToPeso } from '@/lib/utils/money';
import { toManila } from '@/lib/timezone';
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

export default function CheckInSection({ todayCheckIn }: CheckInSectionProps) {
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

  // ── Check if it's after 5pm Manila time ──
  const manilaHour = toManila().getUTCHours();
  const isAfter5pm = manilaHour >= 17;

  // ── Already checked in: show summary + optional update ──
  if (todayCheckIn) {
    const moodLabel = todayCheckIn.mood
      ? MOOD_DISPLAY[todayCheckIn.mood] ?? todayCheckIn.mood
      : null;

    return (
      <>
        <section className="px-4 pb-3" data-testid="check-in-summary">
          <div className="bg-surface-container rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-tertiary/10 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-tertiary" />
                </div>
                <p className="text-on-surface text-sm font-semibold">
                  Na-check-in ka na!
                </p>
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
                <span data-testid="check-in-summary-mood">Mood: {moodLabel}</span>
              )}
              {todayCheckIn.sales_amount != null && (
                <span data-testid="check-in-summary-sales">
                  Sales: {centavosToPeso(todayCheckIn.sales_amount)}
                </span>
              )}
              {todayCheckIn.expenses_amount != null && (
                <span data-testid="check-in-summary-expenses">
                  Gastos: {centavosToPeso(todayCheckIn.expenses_amount)}
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
                  Cancel
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

  // ── No check-in yet: show CTA (stronger after 5pm) ──
  return (
    <>
      <section className="px-4 pb-3" data-testid="check-in-cta">
        <button
          onClick={() => setIsModalOpen(true)}
          className={`w-full rounded-xl p-4 flex items-center gap-3 transition-colors ${
            isAfter5pm
              ? 'bg-primary-container/20 ring-1 ring-primary-container/40'
              : 'bg-primary/10 hover:bg-primary/15 active:bg-primary/20'
          }`}
          type="button"
          data-testid="check-in-cta-button"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isAfter5pm ? 'bg-primary-container/30' : 'bg-primary-container/20'
          }`}>
            <Sparkles className="w-5 h-5 text-primary-container" />
          </div>
          <div className="text-left">
            <p className="text-on-surface text-sm font-semibold">
              {isAfter5pm ? 'Tara na, check-in tayo!' : 'Kumusta ang araw mo?'}
            </p>
            <p className="text-on-surface-variant text-xs">
              {isAfter5pm
                ? 'Hapon na — i-record ang sales at gastos mo bago matapos ang araw'
                : 'I-check in ang mood at numbers mo ngayong araw'}
            </p>
          </div>
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
