'use client';

import { useState, useEffect } from 'react';
import { Receipt, Bell, MessageCircle, Camera } from 'lucide-react';

const TOUR_STORAGE_KEY = 'akbai_tour_seen';

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    icon: <Receipt size={24} className="text-primary" />,
    title: 'Track expenses',
    description: 'I-log ang mga gastos mo at alamin kung saan napupunta ang pera.',
  },
  {
    icon: <Bell size={24} className="text-primary" />,
    title: 'Get BIR reminders',
    description: 'Hindi mo na makakalimutan ang mga tax deadline mo.',
  },
  {
    icon: <MessageCircle size={24} className="text-primary" />,
    title: 'Chat with Kai',
    description: 'May tanong ka sa negosyo? Si Kai ang kaakbay mo.',
  },
  {
    icon: <Camera size={24} className="text-primary" />,
    title: 'Scan receipts',
    description: 'I-scan lang ang resibo — automatic na ang pag-log.',
  },
];

/**
 * Post-onboarding welcome tour modal.
 * Shows on first visit to dashboard after completing onboarding.
 * Dismissed state is saved to localStorage.
 */
export default function WelcomeTour() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if tour hasn't been seen yet
    try {
      const seen = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!seen) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable — skip tour
    }
  }, []);

  function handleDismiss() {
    setVisible(false);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch {
      // Silently fail — best-effort
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[20px] bg-black/20"
      data-testid="welcome-tour-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome tour"
    >
      <div className="bg-surface rounded-2xl p-6 mx-4 max-w-md w-full shadow-ambient-lg flex flex-col gap-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-on-surface">
            Handa ka na!
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Eto ang mga magagawa mo sa AKBai:
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 gap-3" data-testid="welcome-tour-features">
          {FEATURE_CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center">
                {card.icon}
              </div>
              <p className="text-on-surface font-semibold text-sm">{card.title}</p>
              <p className="text-on-surface-variant text-xs leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-full bg-primary-container hover:bg-primary text-on-primary font-semibold py-3 px-4 rounded-xl transition-all min-h-[44px]"
          data-testid="welcome-tour-dismiss-btn"
        >
          Tara, simulan na natin!
        </button>
      </div>
    </div>
  );
}
