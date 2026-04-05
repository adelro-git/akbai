'use client';

import { Sparkles } from 'lucide-react';
import { IllustrationWrapper } from '@/components/illustrations/IllustrationWrapper';

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
      <div className="flex justify-center mb-3">
        <IllustrationWrapper
          src="empty-states/first-scan.webp"
          alt="I-scan ang unang resibo mo"
          category="empty-state"
          width={180}
          height={135}
        />
      </div>
      <p className="text-on-surface-variant text-sm">{message}</p>
      {hint && (
        <p className="text-outline text-xs mt-2 italic">{hint}</p>
      )}
    </div>
  );
}
