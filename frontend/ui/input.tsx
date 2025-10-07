import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const inputVariants = cva(
  'flex w-full rounded-md border border-primary/20 bg-background text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-primary hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-background dark:border-input',
  {
    variants: {
      variant: {
        default: 'border-primary/20 hover:border-primary/50',
        error: 'border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
      },
      inputSize: {
        sm: 'h-8 px-2.5 py-1.5 text-xs',
        default: 'h-10 px-3 py-2',
        lg: 'h-12 px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ 
            variant: error ? 'error' : variant, 
            inputSize 
          }), 
          className
        )}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input, inputVariants }
