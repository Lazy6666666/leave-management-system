# Rate Limiting Design Document

## Overview

This design implements a lightweight, in-memory rate limiting solution for Supabase Edge Functions using a sliding window algorithm. The solution is self-contained, requires no external dependencies beyond what's already in use, and can be easily integrated into existing edge functions with minimal code changes.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Client Request │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│   Edge Function Handler     │
│  1. Extract identifier      │
│  2. Check rate limit        │
│  3. Add response headers    │
└────────┬────────────────────┘
         │
         ├─── Rate Limit Exceeded ──► 429 Response
         │
         ▼
┌─────────────────────────────┐
│   Business Logic            │
│   (existing function code)  │
└─────────────────────────────┘
```

### Rate Limiter Module Structure

```
backend/supabase/functions/
├── _shared/
│   └── rate-limiter.ts          # Core rate limiting logic
│       ├── RateLimiter class
│       ├── RateLimitConfig type
│       ├── checkRateLimit()
│       └── getRateLimitHeaders()
├── create-leave-request/
│   └── index.ts                 # Uses rate limiter
├── approve-leave/
│   └── index.ts                 # Uses rate limiter
└── check-document-expiry/
    └── index.ts                 # Uses rate limiter
```

## Components and Interfaces

### 1. Rate Limiter Core (`_shared/rate-limiter.ts`)

#### RateLimitConfig Interface

```typescript
interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests allowed in window
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;     // Unix timestamp
}

interface RequestRecord {
  timestamps: number[];  // Array of request timestamps
  lastCleanup: number;   // Last cleanup timestamp
}
```

#### Rate Limit Configurations

```typescript
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
```

#### RateLimiter Class

```typescript
class RateLimiter {
  private store: Map<string, RequestRecord>;
  private cleanupInterval: number;
  
  constructor() {
    this.store = new Map();
    this.startCleanup();
  }
  
  check(identifier: string, config: RateLimitConfig): RateLimitResult {
    // Implementation details below
  }
  
  private startCleanup(): void {
    // Periodic cleanup of expired entries
  }
  
  private cleanupExpired(identifier: string, windowMs: number): void {
    // Remove timestamps outside the current window
  }
}
```

### 2. Helper Functions

#### Extract Identifier

```typescript
function getIdentifier(req: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fallback to IP address for unauthenticated requests
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0] || 'unknown';
  return `ip:${ip}`;
}
```

#### Generate Rate Limit Headers

```typescript
function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
    ...(result.allowed ? {} : {
      'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
    }),
  };
}
```

### 3. Integration Pattern

Each edge function will follow this pattern:

```typescript
import { checkRateLimit, RATE_LIMITS } from '../_shared/rate-limiter.ts';

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get user (if authenticated)
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    // Check rate limit
    const rateLimitResult = await checkRateLimit(
      req,
      user?.id,
      RATE_LIMITS.leaveCreation  // Choose appropriate limit
    );
    
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        }),
        { 
          headers: { 
            ...corsHeaders,
            ...getRateLimitHeaders(rateLimitResult)
          }, 
          status: 429 
        }
      );
    }
    
    // Existing business logic...
    const response = await handleBusinessLogic();
    
    // Add rate limit headers to successful response
    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          ...getRateLimitHeaders(rateLimitResult)
        }, 
        status: 200 
      }
    );
    
  } catch (error) {
    // Error handling...
  }
});
```

## Data Models

### In-Memory Storage Structure

```typescript
// Map structure
Map<string, RequestRecord>

// Example entries:
{
  "user:123e4567-e89b-12d3-a456-426614174000": {
    timestamps: [1704067200000, 1704067205000, 1704067210000],
    lastCleanup: 1704067210000
  },
  "ip:192.168.1.1": {
    timestamps: [1704067200000],
    lastCleanup: 1704067200000
  }
}
```

### Sliding Window Algorithm

The sliding window algorithm works as follows:

1. When a request arrives, get the current timestamp
2. Retrieve the request record for the identifier
3. Remove all timestamps older than (current time - window duration)
4. Count remaining timestamps
5. If count < max requests:
   - Add current timestamp
   - Allow request
6. If count >= max requests:
   - Deny request
   - Calculate reset time from oldest timestamp

## Error Handling

### Rate Limiter Errors

```typescript
try {
  const result = rateLimiter.check(identifier, config);
  // Use result
} catch (error) {
  console.error('Rate limiter error:', error);
  // Fail open: allow request if rate limiter fails
  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: config.maxRequests,
    resetTime: Date.now() + config.windowMs
  };
}
```

### Edge Cases

1. **Clock skew**: Use `Date.now()` consistently
2. **Memory pressure**: Implement periodic cleanup (every 60 seconds)
3. **Concurrent requests**: JavaScript's single-threaded nature handles this naturally
4. **Function cold starts**: Rate limit state resets (acceptable trade-off)

## Testing Strategy

### Unit Tests

1. **Rate limiter logic**
   - Test sliding window calculation
   - Test cleanup mechanism
   - Test concurrent request handling
   - Test edge cases (empty store, expired entries)

2. **Helper functions**
   - Test identifier extraction (user ID, IP address)
   - Test header generation
   - Test configuration validation

### Integration Tests

1. **Edge function integration**
   - Test rate limit enforcement in actual edge functions
   - Test header presence in responses
   - Test 429 responses when limit exceeded
   - Test rate limit reset after window expires

### Manual Testing

1. **Load testing**
   - Use tools like `wrk` or `autocannon` to simulate high request rates
   - Verify rate limits are enforced correctly
   - Monitor memory usage during sustained load

2. **Production monitoring**
   - Log rate limit violations
   - Monitor 429 response rates
   - Track rate limit effectiveness

## Performance Considerations

### Memory Usage

- Each identifier stores an array of timestamps
- Maximum memory per identifier: `maxRequests * 8 bytes` (timestamp size)
- Example: 100 requests * 8 bytes = 800 bytes per identifier
- With 1000 active users: ~800 KB total
- Cleanup runs every 60 seconds to remove expired entries

### CPU Usage

- Sliding window check: O(n) where n = number of timestamps
- Worst case: O(maxRequests) per request
- Typical case: Very fast (< 1ms) for reasonable limits

### Scalability

- **Single instance**: Handles thousands of requests/second
- **Multiple instances**: Each instance has independent state (acceptable for this use case)
- **Future improvement**: Could add Redis for distributed rate limiting if needed

## Security Considerations

### Identifier Security

- User IDs are hashed in logs to prevent exposure
- IP addresses are treated as PII and not stored permanently
- Rate limit state is ephemeral (in-memory only)

### Bypass Prevention

- Rate limiting occurs before authentication to prevent auth endpoint abuse
- Multiple identifiers (user ID + IP) prevent simple bypasses
- Fail-open strategy prevents DoS of legitimate users if rate limiter fails

### DDoS Protection

- Rate limiting provides basic DDoS protection
- Should be combined with infrastructure-level protections (Cloudflare, etc.)
- Consider implementing IP-based blocking for severe abuse

## Deployment Strategy

### Rollout Plan

1. **Phase 1**: Deploy rate limiter module to `_shared/`
2. **Phase 2**: Integrate with `create-leave-request` function (highest risk)
3. **Phase 3**: Integrate with `approve-leave` function
4. **Phase 4**: Integrate with remaining functions
5. **Phase 5**: Monitor and adjust limits based on usage patterns

### Monitoring

- Log rate limit violations with context
- Track 429 response rates in application metrics
- Alert on unusual patterns (sudden spike in violations)

### Rollback Plan

- Rate limiting can be disabled by removing the check from edge functions
- No database changes required
- Can be rolled back function-by-function if issues arise

## Future Enhancements

1. **Distributed rate limiting**: Use Redis or Upstash for shared state across instances
2. **Dynamic limits**: Adjust limits based on user tier or subscription
3. **Burst allowance**: Allow short bursts above the limit
4. **Rate limit analytics**: Dashboard showing usage patterns and violations
5. **Whitelist/blacklist**: Allow bypassing rate limits for trusted clients
