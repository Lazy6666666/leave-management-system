/**
 * Rate Limiter Module
 * Implements sliding window rate limiting for Supabase Edge Functions
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests allowed in window
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;     // Unix timestamp
}

interface RequestRecord {
  timestamps: number[];  // Array of request timestamps
  lastCleanup: number;   // Last cleanup timestamp
}

// ============================================================================
// Rate Limit Configurations
// ============================================================================

export const RATE_LIMITS = {
  leaveCreation: {
    windowMs: 10 * 1000,        // 10 seconds
    maxRequests: 10,
  },
  leaveApproval: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 30,
  },
  readOperations: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 100,
  },
  documentUpload: {
    windowMs: 60 * 60 * 1000,   // 1 hour
    maxRequests: 50,
  },
  adminOperations: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 200,
  },
} as const;

// ============================================================================
// RateLimiter Class
// ============================================================================

class RateLimiter {
  private store: Map<string, RequestRecord>;
  private cleanupInterval: number;
  private cleanupTimer: number | null;

  constructor() {
    this.store = new Map();
    this.cleanupInterval = 60 * 1000; // Cleanup every 60 seconds
    this.cleanupTimer = null;
    this.startCleanup();
  }

  /**
   * Check if a request should be allowed based on rate limits
   * Uses sliding window algorithm for accurate counting
   */
  check(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or create record for this identifier
    let record = this.store.get(identifier);
    if (!record) {
      record = {
        timestamps: [],
        lastCleanup: now,
      };
      this.store.set(identifier, record);
    }

    // Clean up old timestamps (sliding window)
    this.cleanupExpired(identifier, config.windowMs);

    // Get current request count within window
    const currentCount = record.timestamps.length;

    // Calculate reset time (oldest timestamp + window)
    const resetTime = record.timestamps.length > 0
      ? record.timestamps[0] + config.windowMs
      : now + config.windowMs;

    // Check if request is allowed
    if (currentCount < config.maxRequests) {
      // Allow request and add timestamp
      record.timestamps.push(now);
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - currentCount - 1,
        resetTime,
      };
    } else {
      // Deny request
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime,
      };
    }
  }

  /**
   * Remove timestamps outside the current window for a specific identifier
   */
  private cleanupExpired(identifier: string, windowMs: number): void {
    const record = this.store.get(identifier);
    if (!record) return;

    const now = Date.now();
    const windowStart = now - windowMs;

    // Filter out expired timestamps
    record.timestamps = record.timestamps.filter(ts => ts > windowStart);
    record.lastCleanup = now;

    // Remove record entirely if no timestamps remain
    if (record.timestamps.length === 0) {
      this.store.delete(identifier);
    }
  }

  /**
   * Start periodic cleanup to prevent memory leaks
   */
  private startCleanup(): void {
    // Use setInterval for periodic cleanup
    this.cleanupTimer = setInterval(() => {
      this.performGlobalCleanup();
    }, this.cleanupInterval) as unknown as number;
  }

  /**
   * Perform cleanup across all stored identifiers
   */
  private performGlobalCleanup(): void {
    const now = Date.now();
    const identifiersToDelete: string[] = [];

    // Find the maximum window size to use for cleanup
    const maxWindow = Math.max(
      ...Object.values(RATE_LIMITS).map(limit => limit.windowMs)
    );

    for (const [identifier, record] of this.store.entries()) {
      // Remove timestamps older than the maximum window
      const windowStart = now - maxWindow;
      record.timestamps = record.timestamps.filter(ts => ts > windowStart);

      // Mark for deletion if no timestamps remain
      if (record.timestamps.length === 0) {
        identifiersToDelete.push(identifier);
      }
    }

    // Delete empty records
    for (const identifier of identifiersToDelete) {
      this.store.delete(identifier);
    }
  }

  /**
   * Stop cleanup timer (useful for testing)
   */
  stopCleanup(): void {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get current store size (useful for monitoring)
   */
  getStoreSize(): number {
    return this.store.size;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

const rateLimiter = new RateLimiter();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract identifier from request
 * Uses user ID for authenticated requests, IP address for unauthenticated
 */
export function getIdentifier(req: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP address for unauthenticated requests
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';
  return `ip:${ip}`;
}

/**
 * Generate rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
  };

  // Add Retry-After header when rate limit is exceeded
  if (!result.allowed) {
    const retryAfterSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
    headers['Retry-After'] = Math.max(0, retryAfterSeconds).toString();
  }

  return headers;
}

/**
 * Main rate limit check function
 * Orchestrates identifier extraction and rate limit checking
 */
export async function checkRateLimit(
  req: Request,
  userId: string | undefined,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    // Extract identifier
    const identifier = getIdentifier(req, userId);

    // Check rate limit
    const result = rateLimiter.check(identifier, config);

    // Log rate limit violations
    if (!result.allowed) {
      console.warn('Rate limit exceeded', {
        identifier: userId ? `user:${userId.substring(0, 8)}...` : identifier,
        limit: config.maxRequests,
        window: config.windowMs,
        resetTime: new Date(result.resetTime).toISOString(),
      });
    }

    return result;
  } catch (error) {
    // Fail open: allow request if rate limiter fails
    console.error('Rate limiter error:', error);
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
    };
  }
}

// Export singleton instance for testing
export { rateLimiter };
