# Implementation Plan

- [x] 1. Create rate limiter core module





  - Create `backend/supabase/functions/_shared/rate-limiter.ts` with TypeScript interfaces, RateLimiter class, and configuration constants
  - Implement sliding window algorithm for accurate request counting within time windows
  - Implement automatic cleanup mechanism to prevent memory leaks from expired entries
  - _Requirements: 1.1, 1.2, 4.1, 4.2, 4.3, 4.4_

- [x] 2. Implement helper functions




  - [x] 2.1 Create identifier extraction function







    - Implement `getIdentifier()` function that extracts user ID from authenticated requests or IP address from request headers
    - Handle edge cases for missing or malformed headers
    - _Requirements: 1.3, 1.4_
-

  - [x] 2.2 Create rate limit header generation function






    - Implement `getRateLimitHeaders()` function that generates X-RateLimit-* headers
    - Include Retry-After header when rate limit is exceeded
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.3 Create main rate limit check function






    - Implement `checkRateLimit()` function that orchestrates identifier extraction and rate limit checking
    - Add error handling with fail-open strategy
    - Add logging for rate limit violations
    - _Requirements: 1.2, 6.1, 6.2, 6.3, 6.4_

- [x] 3. Integrate rate limiting with create-leave-request function




  - Import rate limiter module into `backend/supabase/functions/create-leave-request/index.ts`
  - Add rate limit check before business logic using `RATE_LIMITS.leaveCreation` configuration
  - Return 429 response with appropriate headers when rate limit is exceeded
  - Add rate limit headers to successful responses
  - _Requirements: 1.5, 1.6, 2.1, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. Integrate rate limiting with approve-leave function





  - Import rate limiter module into `backend/supabase/functions/approve-leave/index.ts`
  - Add rate limit check before business logic using `RATE_LIMITS.leaveApproval` configuration
  - Return 429 response with appropriate headers when rate limit is exceeded
  - Add rate limit headers to successful responses
  - _Requirements: 1.5, 1.6, 2.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Integrate rate limiting with check-document-expiry function





  - Import rate limiter module into `backend/supabase/functions/check-document-expiry/index.ts`
  - Add rate limit check before business logic using `RATE_LIMITS.readOperations` configuration
  - Return 429 response with appropriate headers when rate limit is exceeded
  - Add rate limit headers to successful responses
  - _Requirements: 1.5, 1.6, 2.2, 5.1, 5.2, 5.3, 5.4, 5.5_
-

- [x] 6. Update production checklist




  - Mark "Implement rate limiting" as completed in `docs/PRODUCTION_CHECKLIST.md`
  - _Requirements: All_
