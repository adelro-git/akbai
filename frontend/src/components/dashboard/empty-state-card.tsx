'use client';

import { Sparkles } from 'lucide-react';

interface EmptyStateCardProps {
  message: string;
  hint?: string;
}

export default function EmptyStateCard({ message, hint }: EmptyStateCardProps) {
  return (
    <div
      className="bg-surface-container rounded-xl p-6 text-center"
      data-testid="empty-state-card"
    >
      <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center mx-auto mb-3">
        <Sparkles className="w-6 h-6 text-primary-container/60" />
      </div>
      <p className="text-on-surface-variant text-sm">{message}</p>
      {hint && (
        <p className="text-outline text-xs mt-2 italic">{hint}</p>
      )}
    </div>
  );
}
