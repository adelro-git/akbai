'use client';

import { useRef } from 'react';
import { IllustrationWrapper } from '@/components/illustrations/IllustrationWrapper';

interface StepWelcomeProps {
  onComplete: (displayName: string) => void;
  loading: boolean;
  initialName?: string | null;
}

export default function StepWelcome({ onComplete, loading, initialName }: StepWelcomeProps) {
  const nameRef = useRef<HTMLInputElement>(null);

  // Pre-fill if resuming
  if (nameRef.current && initialName && !nameRef.current.value) {
    nameRef.current.value = initialName;
  }

  const handleSubmit = () => {
    const name = nameRef.current?.value?.trim() ?? '';
    if (!name) return;
    onComplete(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header illustration — full width of content area */}
      <div className="flex justify-center w-full">
        <IllustrationWrapper
          src="onboarding/welcome.webp"
          alt="Welcome to AKBai"
          category="onboarding"
          className="w-full max-w-full"
        />
      </div>

      {/* Kai bubble */}
      <div className="bg-surface-container rounded-2xl rounded-tl-sm p-4">
        <p className="text-on-surface text-base leading-relaxed">
          Kumusta! Ako si <span className="text-primary-container font-semibold">Kai</span>, ang AI business
          partner mo. Ano ang pangalan mo?
        </p>
      </div>

      {/* Name input */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          Pangalan
        </label>
        <input
          ref={nameRef}
          type="text"
          placeholder="e.g. Maria"
          defaultValue={initialName ?? ''}
          autoFocus
          maxLength={100}
          onKeyDown={handleKeyDown}
          className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface placeholder-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-primary-container hover:bg-primary text-on-primary font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Sine-save...' : 'Tara, simulan natin!'}
      </button>
    </div>
  );
}
