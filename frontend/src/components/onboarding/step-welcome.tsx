'use client';

import { useRef } from 'react';

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
      {/* KA bubble */}
      <div className="bg-kai-card rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
        <p className="text-white text-base leading-relaxed">
          Kumusta! Ako si <span className="text-honey font-semibold">Kai</span>, ang AI business
          partner mo. Ano ang pangalan mo?
        </p>
      </div>

      {/* Name input */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
          className="w-full bg-kai-card-alt border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-honey focus:ring-1 focus:ring-honey transition-colors"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-honey hover:bg-honey-deep text-ink font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Sine-save...' : 'Tara, simulan natin!'}
      </button>
    </div>
  );
}
