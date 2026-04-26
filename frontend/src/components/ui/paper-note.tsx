import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { TapeStrip } from '@/components/illustrations/svg/decorative/TapeStrip'

/**
 * PaperNote — taped index-card primitive (B7 verdict).
 * Asymmetric corners + slight tilt mimic an actual taped note.
 * Used by: home check-in invite, Kuwento takeaway, Kai pre-deadline callout.
 *
 * Tilt direction alternates between "left" and "right" to keep stacks readable.
 */
const paperNoteVariants = cva(
  'relative bg-surface-container-lowest text-on-surface text-sm leading-relaxed shadow-ambient',
  {
    variants: {
      tilt: {
        left: 'paper-note',
        right: 'paper-note paper-note--right',
        none: 'rounded-xl',
      },
      tone: {
        default: '',
        honey: 'bg-honey-pale text-honey-deep',
        sage: 'bg-sage-pale text-sage-deep',
      },
      padding: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-5',
      },
    },
    defaultVariants: {
      tilt: 'left',
      tone: 'default',
      padding: 'md',
    },
  }
)

type DivProps = React.HTMLAttributes<HTMLDivElement>

export type PaperNoteProps = DivProps &
  VariantProps<typeof paperNoteVariants> & {
    tape?: boolean | 'left' | 'right'
  }

// ----------------------------------------------------------------
// PositionedTape — paper-note-private wrapper that gives the canonical
// motif TapeStrip an absolute "taped to the top" position. The visual
// (gradient, border, shadow) lives in the canonical TapeStrip per ADR-013.
// ----------------------------------------------------------------
function PositionedTape({ position }: { position: 'left' | 'right' }) {
  // -3deg / +2deg matches source repo demo placement; left tape rotates negative,
  // right tape rotates positive (visual symmetry).
  const rotation = position === 'left' ? -3 : 2
  return (
    <span
      aria-hidden
      className={cn(
        'absolute -top-2 inline-block mix-blend-multiply',
        position === 'left' ? 'left-4' : 'right-4'
      )}
    >
      <TapeStrip rotation={rotation} />
    </span>
  )
}

export const PaperNote = React.forwardRef<HTMLDivElement, PaperNoteProps>(
  ({ className, tilt, tone, padding, tape = false, children, ...props }, ref) => {
    const tapePosition: 'left' | 'right' | null =
      tape === true ? 'left' : tape === false ? null : tape
    return (
      <div
        ref={ref}
        className={cn(paperNoteVariants({ tilt, tone, padding }), className)}
        {...props}
      >
        {tapePosition && <PositionedTape position={tapePosition} />}
        {children}
      </div>
    )
  }
)
PaperNote.displayName = 'PaperNote'

export { paperNoteVariants, TapeStrip }
