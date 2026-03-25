'use client';

/**
 * Check-In Section — CTA button or summary card for daily check-in
 * Feature: Daily Check-In (Build 2 — Sprint 5)
 * Role: Client-side interactive wrapper that shows either:
 *   - CTA button ("Kumusta ang araw mo?") when no check-in today
 *   - Summary card with mood + ₱ amounts when check-in exists
 *
 * This is a client component because it manages the modal open/close state.
 * Receives todayCheckIn data as a prop from the server component.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Check } from 'lucide-react';
import { centavosToPeso } from '@/lib/utils/money';
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

// ============================================================
// Mood label map for display
// ============================================================

const MOOD_DISPLAY: Record<string, string> = {
  bongga: '🔥 Bongga',
  okay: '😊 Okay',
  steady: '😐 Steady',
  hirap: '😰 Hirap',
  grabe: '💀 Grabe',
};

// ============================================================
// CheckInSection Component
// ============================================================

export default function CheckInSection({ todayCheckIn }: CheckInSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = useCallback(() => {
    setIsModalOpen(false);
    router.refresh(); // Refresh server data to show updated check-in
  }, [router]);

  // --- Already checked in: show summary card ---
  if (todayCheckIn) {
    const moodLabel = todayCheckIn.mood
      ? MOOD_DISPLAY[todayCheckIn.mood] ?? todayCheckIn.mood
      : null;

    return (
      <section className="px-4 pb-3" data-testid="check-in-summary">
        <div className="bg-surface-container rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-tertiary/10 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-tertiary" />
            </div>
            <p className="text-on-surface text-sm font-semibold">
              Na-check-in ka na!
            </p>
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
    );
  }

  // --- No check-in yet: show CTA ---
  return (
    <>
      <section className="px-4 pb-3" data-testid="check-in-cta">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-primary/10 rounded-xl p-4 flex items-center gap-3 transition-colors hover:bg-primary/15 active:bg-primary/20"
          type="button"
          data-testid="check-in-cta-button"
        >
          <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary-container" />
          </div>
          <div className="text-left">
            <p className="text-on-surface text-sm font-semibold">
              Kumusta ang araw mo?
            </p>
            <p className="text-on-surface-variant text-xs">
              I-check in ang mood at numbers mo ngayong araw
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
