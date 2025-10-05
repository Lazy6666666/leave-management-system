/**
 * Error Logger
 * 
 * Provides structured error logging for development and production environments.
 * Integrates with external error tracking services in production.
 */

import { AppError, ErrorCode, type ErrorLogContext } from './errors'

// ============================================================================
// Logger Configuration
// ============================================================================

interface LoggerConfig {
  environment: 'development' | 'production' | 'test'
  enableConsole: boolean
  enableExternalService: boolean
  serviceName?: string
  serviceUrl?: string
}

const config: LoggerConfig = {
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  enableConsole: true,
  enableExternalService: process.env.NODE_ENV === 'production',
  serviceName: process.env.NEXT_PUBLIC_ERROR_SERVICE_NAME,
  serviceUrl: process.env.NEXT_PUBLIC_ERROR_SERVICE_URL,
}

// ============================================================================
// Log Levels
// ============================================================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// ============================================================================
// Structured Log Entry
// ============================================================================

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  error?: {
    name: string
    message: string
    stack?: string
    code?: ErrorCode
    statusCode?: number
    details?: Record<string, any>
    isOperational?: boolean
  }
  context?: ErrorLogContext
  environment: string
  userAgent?: string
  url?: string
}

// ============================================================================
// Logger Class
// ============================================================================

class ErrorLogger {
  private queue: LogEntry[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private readonly FLUSH_INTERVAL_MS = 5000
  private readonly MAX_QUEUE_SIZE = 50

  constructor() {
    if (typeof window !== 'undefined') {
      // Start flush interval in browser
      this.startFlushInterval()
      
      // Flush on page unload
      window.addEventListener('beforeunload', () => {
        this.flush()
      })
    }
  }

  /**
   * Log an error
   */
  error(error: unknown, context?: ErrorLogContext): void {
    this.log(LogLevel.ERROR, error, context)
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: ErrorLogContext): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * Log info
   */
  info(message: string, context?: ErrorLogContext): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * Log debug information
   */
  debug(message: string, context?: ErrorLogContext): void {
    if (config.environment === 'development') {
      this.log(LogLevel.DEBUG, message, context)
    }
  }

  /**
   * Log a fatal error
   */
  fatal(error: unknown, context?: ErrorLogContext): void {
    this.log(LogLevel.FATAL, error, context)
    this.flush() // Immediately flush fatal errors
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    errorOrMessage: unknown,
    context?: ErrorLogContext
  ): void {
    const entry = this.createLogEntry(level, errorOrMessage, context)

    // Console logging
    if (config.enableConsole) {
      this.logToConsole(entry)
    }

    // Queue for external service
    if (config.enableExternalService) {
      this.queue.push(entry)
      
      if (this.queue.length >= this.MAX_QUEUE_SIZE) {
        this.flush()
      }
    }
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    errorOrMessage: unknown,
    context?: ErrorLogContext
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: this.extractMessage(errorOrMessage),
      context,
      environment: config.environment,
    }

    // Add browser context if available
    if (typeof window !== 'undefined') {
      entry.userAgent = window.navigator.userAgent
      entry.url = window.location.href
    }

    // Add error details
    if (errorOrMessage instanceof Error) {
      entry.error = {
        name: errorOrMessage.name,
        message: errorOrMessage.message,
        stack: errorOrMessage.stack,
      }

      if (errorOrMessage instanceof AppError) {
        entry.error.code = errorOrMessage.code
        entry.error.statusCode = errorOrMessage.statusCode
        entry.error.details = errorOrMessage.details
        entry.error.isOperational = errorOrMessage.isOperational
      }
    }

    return entry
  }

  /**
   * Extract message from error or string
   */
  private extractMessage(errorOrMessage: unknown): string {
    if (typeof errorOrMessage === 'string') {
      return errorOrMessage
    }

    if (errorOrMessage instanceof Error) {
      return errorOrMessage.message
    }

    return 'Unknown error occurred'
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(entry: LogEntry): void {
    const { level, message, error, context } = entry

    const logData = {
      message,
      ...(error && { error }),
      ...(context && { context }),
    }

    switch (level) {
      case LogLevel.DEBUG:
        console.debug('[DEBUG]', logData)
        break
      case LogLevel.INFO:
        console.info('[INFO]', logData)
        break
      case LogLevel.WARN:
        console.warn('[WARN]', logData)
        break
      case LogLevel.ERROR:
        console.error('[ERROR]', logData)
        break
      case LogLevel.FATAL:
        console.error('[FATAL]', logData)
        break
    }
  }

  /**
   * Flush queued logs to external service
   */
  private async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return
    }

    const logsToSend = [...this.queue]
    this.queue = []

    try {
      await this.sendToExternalService(logsToSend)
    } catch (error) {
      // Failed to send logs, put them back in queue
      this.queue.unshift(...logsToSend)
      console.error('Failed to send logs to external service:', error)
    }
  }

  /**
   * Send logs to external error tracking service
   */
  private async sendToExternalService(logs: LogEntry[]): Promise<void> {
    if (!config.serviceUrl) {
      return
    }

    try {
      await fetch(config.serviceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: config.serviceName || 'leave-management-system',
          logs,
        }),
      })
    } catch (error) {
      // Silently fail - don't want logging to break the app
      console.error('Error sending logs:', error)
    }
  }

  /**
   * Start periodic flush interval
   */
  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush()
    }, this.FLUSH_INTERVAL_MS)
  }

  /**
   * Stop flush interval
   */
  stopFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

const logger = new ErrorLogger()

// ============================================================================
// Exported Functions
// ============================================================================

/**
 * Log an error
 */
export function logError(error: unknown, context?: ErrorLogContext): void {
  logger.error(error, context)
}

/**
 * Log a warning
 */
export function logWarning(message: string, context?: ErrorLogContext): void {
  logger.warn(message, context)
}

/**
 * Log info
 */
export function logInfo(message: string, context?: ErrorLogContext): void {
  logger.info(message, context)
}

/**
 * Log debug information
 */
export function logDebug(message: string, context?: ErrorLogContext): void {
  logger.debug(message, context)
}

/**
 * Log a fatal error
 */
export function logFatal(error: unknown, context?: ErrorLogContext): void {
  logger.fatal(error, context)
}

/**
 * Manually flush logs
 */
export function flushLogs(): Promise<void> {
  return (logger as unknown as { flush(): Promise<void> }).flush()
}

// ============================================================================
// Error Tracking Integration Helpers
// ============================================================================

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string, role?: string): void {
  // This would integrate with services like Sentry
  if (config.environment === 'production') {
    logInfo('User context set', {
      userId,
      email,
      role,
      context: 'user_context',
    })
  }
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  if (config.environment === 'production') {
    logInfo('User context cleared', {
      context: 'user_context',
    })
  }
}

/**
 * Add breadcrumb for error tracking
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
): void {
  if (config.environment === 'production') {
    logDebug(message, {
      category,
      ...data,
      context: 'breadcrumb',
    })
  }
}

/**
 * Capture exception with additional context
 */
export function captureException(
  error: Error,
  context?: ErrorLogContext
): void {
  logError(error, {
    ...context,
    context: 'captured_exception',
  })
}

/**
 * Capture message with level
 */
export function captureMessage(
  message: string,
  level: LogLevel = LogLevel.INFO,
  context?: ErrorLogContext
): void {
  switch (level) {
    case LogLevel.DEBUG:
      logDebug(message, context)
      break
    case LogLevel.INFO:
      logInfo(message, context)
      break
    case LogLevel.WARN:
      logWarning(message, context)
      break
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      logError(new Error(message), context)
      break
  }
}

// ============================================================================
// Performance Monitoring
// ============================================================================

interface PerformanceMetric {
  name: string
  duration: number
  startTime: number
  endTime: number
  metadata?: Record<string, any>
}

const performanceMetrics: PerformanceMetric[] = []

/**
 * Start performance measurement
 */
export function startPerformanceMeasure(name: string): (metadata?: Record<string, any>) => void {
  const startTime = performance.now()

  return (metadata?: Record<string, any>) => {
    const endTime = performance.now()
    const duration = endTime - startTime

    const metric: PerformanceMetric = {
      name,
      duration,
      startTime,
      endTime,
      metadata,
    }

    performanceMetrics.push(metric)

    // Log slow operations
    if (duration > 1000) {
      logWarning(`Slow operation detected: ${name}`, {
        duration,
        ...metadata,
        context: 'performance',
      })
    }

    // Keep only last 100 metrics
    if (performanceMetrics.length > 100) {
      performanceMetrics.shift()
    }
  }
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetric[] {
  return [...performanceMetrics]
}

/**
 * Clear performance metrics
 */
export function clearPerformanceMetrics(): void {
  performanceMetrics.length = 0
}

export default logger
