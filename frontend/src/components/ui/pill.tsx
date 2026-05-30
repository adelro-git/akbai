import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const pillVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium leading-none whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        honey:
          'bg-honey-pale text-honey-deep border border-honey/30',
        sage: 'bg-sage-pale text-sage-deep border border-sage/30',
        urgent:
          'bg-error-container text-on-error-container border border-destructive/30',
        neutral:
          'bg-surface-container text-on-surface-variant border border-outline-soft',
        // ── Warm Precision status tags (spec §5) ──
        // Solid pale fills (no hairline), darker on-* ink for AA on the pale
        // bg. These map the prototype's 4 .tag-* kinds onto the new tokens.
        positive: 'bg-tertiary-container text-tertiary',
        pending: 'bg-secondary-container text-primary',
        overdue: 'bg-error-pale text-destructive',
        info: 'bg-surface-container-high text-on-surface-variant',
        // Brand BIR form-code identifier chip (honey). Distinct from the status
        // tags above — replaces the bespoke inline span on deadline rows.
        'form-code': 'bg-honey-pale text-honey-deep',
      },
      size: {
        sm: 'h-6 px-2.5 text-[11px] tracking-wide',
        md: 'h-7 px-3 text-xs',
        lg: 'h-8 px-3.5 text-sm',
        // ── Warm Precision tag geometry (spec §5: 11px/700/0.04em, pad 2px 8px) ──
        tag: 'px-2 py-0.5 text-[11px] font-bold tracking-[0.04em]',
      },
    },
    defaultVariants: {
      variant: 'honey',
      size: 'md',
    },
  }
)

export type PillProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof pillVariants>

export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(pillVariants({ variant, size }), className)}
      {...props}
    />
  )
)
Pill.displayName = 'Pill'

export { pillVariants }
