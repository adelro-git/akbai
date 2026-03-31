'use client';

/**
 * Reply Results — Container for generated reply options (Build 7)
 *
 * Shows the 2 reply options from Claude, plus a disclaimer.
 * Handles the loading and empty states.
 */

import ReplyCard from './reply-card';
import type { ReplyOption } from '@/lib/reply-drafter/types';

// ============================================================
// Props
// ============================================================

interface ReplyResultsProps {
  replies: ReplyOption[];
  disclaimer: string;
  loading: boolean;
}

// ============================================================
// Reply Labels
// ============================================================

const REPLY_LABELS = ['Maikling reply', 'Mas detalyadong reply'];

// ============================================================
// Component
// ============================================================

export default function ReplyResults({ replies, disclaimer, loading }: ReplyResultsProps) {
  // Loading state
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse" data-testid="reply-loading">
        <div className="bg-surface-container rounded-2xl p-4 h-28" />
        <div className="bg-surface-container rounded-2xl p-4 h-28" />
      </div>
    );
  }

  // No replies yet
  if (replies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid="reply-results">
      {/* Section Header */}
      <h2 className="text-on-surface text-sm font-extrabold">
        Mga draft reply ni Kai
      </h2>

      {/* Reply Cards */}
      {replies.map((reply, index) => (
        <ReplyCard
          key={index}
          text={reply.text}
          label={REPLY_LABELS[index] ?? `Reply ${index + 1}`}
          index={index}
        />
      ))}

      {/* Disclaimer */}
      <p className="text-outline text-xs text-center py-2" data-testid="reply-disclaimer">
        {disclaimer}
      </p>
    </div>
  );
}
