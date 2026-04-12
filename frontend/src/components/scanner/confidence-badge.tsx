/**
 * Confidence Badge — Per-field OCR confidence indicator
 * Feature: Resibo Scanner (Build 3)
 * Role: Small pill badge that shows high/medium/low confidence
 *       for each extracted receipt field. Helps users know which
 *       fields to double-check before saving.
 *
 * Design: tertiary (high), primary-container (medium), destructive (low)
 *         All tokens from design system — no hardcoded hex.
 */

// ============================================================
// Types
// ============================================================

type ConfidenceLevel = 'high' | 'medium' | 'low';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  className?: string;
}

// ============================================================
// Confidence Config — colors + labels per level
// ============================================================

const CONFIDENCE_CONFIG: Record<
  ConfidenceLevel,
  { bg: string; text: string; label: string }
> = {
  high: {
    bg: 'bg-tertiary/15',
    text: 'text-tertiary',
    label: 'Sigurado',
  },
  medium: {
    bg: 'bg-primary-container/20',
    text: 'text-primary',
    label: 'Hindi masyadong klaro',
  },
  low: {
    bg: 'bg-destructive/15',
    text: 'text-destructive',
    label: 'Hindi ko sure',
  },
};

// ============================================================
// Component
// ============================================================

export function ConfidenceBadge({ level, className = '' }: ConfidenceBadgeProps) {
  const config = CONFIDENCE_CONFIG[level];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.bg} ${config.text} ${className}`}
      data-testid={`confidence-badge-${level}`}
      aria-label={`Confidence: ${config.label}`}
    >
      {config.label}
    </span>
  );
}

export default ConfidenceBadge;
