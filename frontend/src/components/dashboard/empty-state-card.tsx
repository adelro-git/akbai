'use client';

import { Sparkles } from 'lucide-react';

interface EmptyStateCardProps {
  message: string;
  hint?: string;
}

export default function EmptyStateCard({ message, hint }: EmptyStateCardProps) {
  return (
    <div
      className="bg-kai-card rounded-xl p-6 text-center"
      data-testid="empty-state-card"
    >
      <div className="w-12 h-12 rounded-full bg-honey/10 flex items-center justify-center mx-auto mb-3">
        <Sparkles className="w-6 h-6 text-honey/60" />
      </div>
      <p className="text-slate-400 text-sm">{message}</p>
      {hint && (
        <p className="text-slate-500 text-xs mt-2 italic">{hint}</p>
      )}
    </div>
  );
}
