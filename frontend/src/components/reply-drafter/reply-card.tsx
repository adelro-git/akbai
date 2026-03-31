'use client';

/**
 * Reply Card — Individual reply option with copy button (Build 7)
 *
 * Displays a generated reply with a copy-to-clipboard button.
 * Mobile-first with minimum 44px touch targets.
 */

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

// ============================================================
// Props
// ============================================================

interface ReplyCardProps {
  text: string;
  label: string;
  index: number;
}

// ============================================================
// Component
// ============================================================

export default function ReplyCard({ text, label, index }: ReplyCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="bg-surface-container rounded-2xl p-4 space-y-3"
      data-testid={`reply-card-${index}`}
    >
      {/* Label */}
      <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
        {label}
      </p>

      {/* Reply Text */}
      <p className="text-on-surface text-sm leading-relaxed whitespace-pre-wrap">
        {text}
      </p>

      {/* Copy Button */}
      <button
        type="button"
        onClick={handleCopy}
        className={`flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 transition-colors min-h-[44px] ${
          copied
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-surface-container-high text-primary-container hover:bg-primary-container/10'
        }`}
        data-testid={`copy-button-${index}`}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            Na-copy na!
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            I-copy ang reply
          </>
        )}
      </button>
    </div>
  );
}
