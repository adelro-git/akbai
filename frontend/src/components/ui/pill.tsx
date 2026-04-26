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
      },
      size: {
        sm: 'h-6 px-2.5 text-[11px] tracking-wide',
        md: 'h-7 px-3 text-xs',
        lg: 'h-8 px-3.5 text-sm',
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
