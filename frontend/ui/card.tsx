import * as React from "react"
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-xl bg-card text-card-foreground max-w-full overflow-hidden break-words transition-all",
  {
    variants: {
      variant: {
        default: "border shadow",
        elevated: "shadow-md",
        outlined: "border-2",
        ghost: "hover:bg-accent/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const cardChildVariants = cva(
  "",
  {
    variants: {
      padding: {
        compact: "p-4",
        default: "p-6",
        spacious: "p-8",
      },
    },
    defaultVariants: {
      padding: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export interface CardChildProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardChildVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, CardChildProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 max-w-full overflow-hidden", cardChildVariants({ padding }), className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-relaxed tracking-tight break-words whitespace-normal text-base md:text-lg max-w-full", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs md:text-sm text-muted-foreground leading-relaxed break-words whitespace-normal max-w-full", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, CardChildProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("pt-0 max-w-full overflow-hidden break-words", cardChildVariants({ padding }), className)}
      {...props}
    />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, CardChildProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center pt-0 max-w-full overflow-hidden flex-wrap gap-2", cardChildVariants({ padding }), className)}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
