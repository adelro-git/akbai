import { IconSampaguita } from '@/components/illustrations/icons';
import { cn } from '@/lib/utils';

// ============================================================
// Phase 6 — Sampaguita progress indicator (5-dot kumustahan stepper).
// Replaces the generic linear bar in the onboarding wizard. Completed
// dots render the IconSampaguita brand motif; the active dot is a
// honey-deep filled circle; future dots are empty rings. The whole row
// reads at a glance — Phase 1 visceral-warmth rule.
// ============================================================

interface SampaguitaProgressProps {
  /** 1-based current step index. Steps beyond `total` clamp to `total`. */
  current: number;
  /** Total number of steps. Default: 5 (Pangalan / Negosyo / Kita / Pinakahirap / BIR). */
  total?: number;
  className?: string;
  ariaLabel?: string;
}

export default function SampaguitaProgress({
  current,
  total = 5,
  className,
  ariaLabel,
}: SampaguitaProgressProps) {
  const clamped = Math.min(Math.max(current, 1), total);

  return (
    <ol
      className={cn('flex items-center justify-center gap-3', className)}
      role="list"
      aria-label={ariaLabel ?? `Hakbang ${clamped} ng ${total}`}
      data-testid="sampaguita-progress"
    >
      {Array.from({ length: total }, (_, idx) => {
        const stepNum = idx + 1;
        const state: 'done' | 'current' | 'future' =
          stepNum < clamped ? 'done' : stepNum === clamped ? 'current' : 'future';
        return (
          <li
            key={stepNum}
            className="flex h-7 w-7 items-center justify-center"
            aria-current={state === 'current' ? 'step' : undefined}
            data-state={state}
          >
            {state === 'done' ? (
              <IconSampaguita size={20} aria-label={`Tapos na ang hakbang ${stepNum}`} />
            ) : state === 'current' ? (
              <span
                className="block h-3 w-3 rounded-full bg-honey-deep shadow-ambient"
                aria-label={`Kasalukuyang hakbang ${stepNum}`}
              />
            ) : (
              <span
                className="block h-3 w-3 rounded-full border-2 border-outline-soft/60"
                aria-label={`Hakbang ${stepNum}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
