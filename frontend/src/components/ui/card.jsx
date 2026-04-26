import * as React from "react"

import { cn } from "@/lib/utils"

const cardVariantClasses = {
  default: "rounded-xl border bg-card text-card-foreground shadow",
  paper: "paper-note bg-surface-container-lowest text-on-surface",
  honey:
    "rounded-2xl bg-honey-cream text-honey-deep shadow-ambient border border-honey/20",
}

const Card = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const base = cardVariantClasses[variant] ?? cardVariantClasses.default
  return <div ref={ref} className={cn(base, className)} {...props} />
})
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props} />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
