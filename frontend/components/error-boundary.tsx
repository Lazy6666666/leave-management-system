/**
 * Enhanced Error Boundary Component - React 19 Compatible
 * 
 * Catches React errors and displays a fallback UI.
 * Provides error recovery, logging functionality, and production-ready error handling.
 * Follows React 19 best practices for error boundaries.
 */

import * as React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, ExternalLink } from 'lucide-react'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Alert, AlertDescription } from '@/ui/alert'
import { Badge } from '@/ui/badge'
import { logErrorBoundary } from '@/lib/client-error-handler'

// ============================================================================
// Error Boundary Props & State
// ============================================================================

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onReset?: () => void
  isolate?: boolean // For granular error boundaries
  level?: 'page' | 'feature' | 'component' // Error boundary level
  resetKeys?: Array<string | number> // Keys that trigger reset when changed
  resetOnPropsChange?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorId: string | null
  errorInfo: React.ErrorInfo | null
}

export interface ErrorFallbackProps {
  error: Error
  errorInfo: React.ErrorInfo | null
  errorId: string
  resetError: () => void
  level?: 'page' | 'feature' | 'component'
}

// ============================================================================
// Error Boundary Component
// ============================================================================

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Store error info in state for better debugging
    this.setState({ errorInfo })

    // Log error to console and external service
    logErrorBoundary(error, errorInfo)

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Auto-retry for transient errors (optional)
    if (this.isTransientError(error)) {
      this.scheduleAutoRetry()
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    // Reset error boundary when resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys !== resetKeys) {
      if (resetKeys.some((key, idx) => prevProps.resetKeys?.[idx] !== key)) {
        this.resetError()
      }
    }

    // Reset on any prop change if enabled
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError()
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  private isTransientError(error: Error): boolean {
    // Check if error might be transient (network, temporary state, etc.)
    const transientPatterns = [
      /network/i,
      /fetch/i,
      /timeout/i,
      /connection/i,
      /temporary/i,
    ]
    
    return transientPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    )
  }

  private scheduleAutoRetry(): void {
    // Auto-retry after 3 seconds for transient errors
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetError()
    }, 3000)
  }

  resetError = (): void => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = null
    }

    this.setState({
      hasError: false,
      error: null,
      errorId: null,
      errorInfo: null,
    })

    // Call custom reset handler if provided
    this.props.onReset?.()
  }

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error && this.state.errorId) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            errorId={this.state.errorId}
            resetError={this.resetError}
            level={this.props.level}
          />
        )
      }

      // Default fallback UI based on level
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          resetError={this.resetError}
          level={this.props.level}
        />
      )
    }

    return this.props.children
  }
}

// ============================================================================
// Default Error Fallback
// ============================================================================

function DefaultErrorFallback({ 
  error, 
  errorInfo, 
  errorId, 
  resetError, 
  level = 'page' 
}: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isPageLevel = level === 'page'

  // Different layouts based on error boundary level
  if (level === 'component') {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <span className="font-medium">Component Error</span>
            {isDevelopment && (
              <span className="block text-xs mt-1 font-mono">{error.message}</span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={resetError} className="ml-2">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (level === 'feature') {
    return (
      <Card className="my-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg">Feature Unavailable</CardTitle>
              <CardDescription>
                This feature is temporarily unavailable due to an error.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isDevelopment && (
            <Alert variant="destructive">
              <Bug className="h-4 w-4" />
              <AlertDescription className="font-mono text-xs">
                {error.message}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Button onClick={resetError} size="sm">
              <RefreshCw className="mr-2 h-3 w-3" />
              Retry
            </Button>
            <Badge variant="outline" className="text-xs">
              Error ID: {errorId.slice(-8)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Page-level error (full screen)
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred. Please try again or contact support if the problem persists.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error ID Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline">Error ID: {errorId}</Badge>
            <Badge variant="secondary">{level} level</Badge>
          </div>

          {/* Error Message */}
          {isDevelopment && (
            <Alert variant="destructive">
              <Bug className="h-4 w-4" />
              <AlertDescription className="font-mono text-xs">
                {error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Stack (Development Only) */}
          {isDevelopment && error.stack && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium mb-2 flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                Stack Trace
              </summary>
              <pre className="p-3 bg-muted rounded-md overflow-auto max-h-64 text-xs">
                {error.stack}
              </pre>
            </details>
          )}

          {/* Component Stack (Development Only) */}
          {isDevelopment && errorInfo?.componentStack && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium mb-2 flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                Component Stack
              </summary>
              <pre className="p-3 bg-muted rounded-md overflow-auto max-h-64 text-xs">
                {errorInfo.componentStack}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/dashboard')}
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>

          {/* Help Text */}
          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              If this problem persists, please contact support and include the Error ID above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Compact Error Fallback (for smaller components)
// ============================================================================

export function CompactErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span className="flex-1">An error occurred: {error.message}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetError}
          className="ml-2"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  )
}

// ============================================================================
// Hook for Error Boundary
// ============================================================================

/**
 * Hook to trigger error boundary from within a component
 */
export function useErrorBoundary() {
  const [, setError] = React.useState()

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error
    })
  }, [])
}

// ============================================================================
// Specialized Error Boundary Components
// ============================================================================

/**
 * Page-level error boundary for full page errors
 */
export function PageErrorBoundary({ children, onError }: {
  children: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}) {
  return (
    <ErrorBoundary
      level="page"
      onError={onError}
      resetOnPropsChange={true}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Feature-level error boundary for isolated feature errors
 */
export function FeatureErrorBoundary({ 
  children, 
  onError,
  resetKeys 
}: {
  children: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: Array<string | number>
}) {
  return (
    <ErrorBoundary
      level="feature"
      onError={onError}
      resetKeys={resetKeys}
      isolate={true}
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Component-level error boundary for small component errors
 */
export function ComponentErrorBoundary({ 
  children, 
  onError 
}: {
  children: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}) {
  return (
    <ErrorBoundary
      level="component"
      onError={onError}
      fallback={CompactErrorFallback}
    >
      {children}
    </ErrorBoundary>
  )
}

// ============================================================================
// Error Boundary HOC
// ============================================================================

/**
 * Higher-order component to wrap components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// ============================================================================
// Error Recovery Hook
// ============================================================================

/**
 * Enhanced hook for error boundary with recovery strategies
 */
export function useErrorRecovery() {
  const [error, setError] = React.useState<Error | null>(null)
  const [retryCount, setRetryCount] = React.useState(0)
  const maxRetries = 3

  const throwError = React.useCallback((error: Error) => {
    setError(() => {
      throw error
    })
  }, [])

  const retry = React.useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      setError(null)
    }
  }, [retryCount, maxRetries])

  const reset = React.useCallback(() => {
    setError(null)
    setRetryCount(0)
  }, [])

  return {
    throwError,
    retry,
    reset,
    retryCount,
    canRetry: retryCount < maxRetries,
    error
  }
}

// ============================================================================
// Production Error Reporting
// ============================================================================

/**
 * Enhanced error reporting for production
 */
export function reportError(
  error: Error, 
  errorInfo?: React.ErrorInfo,
  context?: Record<string, any>
) {
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry integration
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: errorInfo,
    //     custom: context
    //   }
    // })
    
    // For now, log to console with structured data
    console.error('Production Error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }
}