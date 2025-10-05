import * as React from 'react'
import { cn } from '@/lib/utils'

interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * Skip Link component for keyboard navigation accessibility
 * Allows keyboard users to skip repetitive navigation and jump to main content
 */
export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Position off-screen by default
        'sr-only',
        // Make visible when focused
        'focus:not-sr-only',
        'focus:absolute',
        'focus:top-4',
        'focus:left-4',
        'focus:z-[100]',
        // Styling
        'inline-flex',
        'items-center',
        'gap-2',
        'rounded-md',
        'bg-primary',
        'px-4',
        'py-2',
        'text-sm',
        'font-medium',
        'text-primary-foreground',
        'shadow-lg',
        // Focus styles
        'focus:outline-none',
        'focus:ring-4',
        'focus:ring-ring',
        'focus:ring-offset-2',
        'focus:ring-offset-background',
        // Transitions
        'transition-all',
        'duration-200',
        className
      )}
    >
      {children}
    </a>
  )
}
