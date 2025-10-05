# Requirements Document

## Introduction

This feature implements comprehensive rate limiting for all Supabase Edge Functions in the Leave Management System to prevent API abuse, ensure fair resource usage, and protect against denial-of-service attacks. Rate limiting will be applied at different levels based on operation types and user roles, with appropriate feedback to clients when limits are exceeded.

## Requirements

### Requirement 1: Basic Rate Limiting Infrastructure

**User Story:** As a system administrator, I want a reusable rate limiting infrastructure for all edge functions, so that I can consistently protect API endpoints from abuse.

#### Acceptance Criteria

1. WHEN the system initializes THEN it SHALL create a centralized rate limiting utility module that can be imported by all edge functions
2. WHEN an edge function receives a request THEN it SHALL check rate limits before processing the request
3. WHEN rate limit checks are performed THEN the system SHALL use the user's ID as the primary identifier for authenticated requests
4. WHEN rate limit checks are performed for unauthenticated requests THEN the system SHALL use the client's IP address as the identifier
5. IF a request exceeds the rate limit THEN the system SHALL return a 429 (Too Many Requests) HTTP status code
6. WHEN a rate limit response is returned THEN it SHALL include headers indicating the limit, remaining requests, and reset time

### Requirement 2: Differentiated Rate Limits by Operation Type

**User Story:** As a system administrator, I want different rate limits for different types of operations, so that critical operations are protected while allowing reasonable usage of read operations.

#### Acceptance Criteria

1. WHEN a user creates a leave request THEN the system SHALL enforce a limit of 10 requests per 10 seconds
2. WHEN a user performs read operations (viewing leaves, balances, profiles) THEN the system SHALL enforce a limit of 100 requests per minute
3. WHEN a user uploads documents THEN the system SHALL enforce a limit of 50 requests per hour
4. WHEN a manager approves or rejects leave requests THEN the system SHALL enforce a limit of 30 requests per minute
5. WHEN an admin performs administrative operations THEN the system SHALL enforce a limit of 200 requests per minute

### Requirement 3: Rate Limit Response Headers

**User Story:** As a frontend developer, I want rate limit information in response headers, so that I can display appropriate feedback to users and implement client-side throttling.

#### Acceptance Criteria

1. WHEN any API response is returned THEN it SHALL include an `X-RateLimit-Limit` header indicating the maximum requests allowed
2. WHEN any API response is returned THEN it SHALL include an `X-RateLimit-Remaining` header indicating remaining requests in the current window
3. WHEN any API response is returned THEN it SHALL include an `X-RateLimit-Reset` header indicating when the rate limit window resets (Unix timestamp)
4. WHEN a rate limit is exceeded THEN the response SHALL include a `Retry-After` header indicating seconds until the limit resets

### Requirement 4: In-Memory Rate Limiting Implementation

**User Story:** As a developer, I want a simple in-memory rate limiting solution that doesn't require external dependencies, so that the system remains lightweight and easy to deploy.

#### Acceptance Criteria

1. WHEN the rate limiter is initialized THEN it SHALL use an in-memory Map to store request counts per identifier
2. WHEN the rate limiter tracks requests THEN it SHALL use a sliding window algorithm to accurately count requests within time windows
3. WHEN the rate limiter stores data THEN it SHALL automatically clean up expired entries to prevent memory leaks
4. WHEN multiple requests arrive simultaneously THEN the rate limiter SHALL handle concurrent access safely
5. IF the edge function restarts THEN rate limit counters SHALL reset (acceptable for this implementation)

### Requirement 5: Integration with Existing Edge Functions

**User Story:** As a developer, I want to easily add rate limiting to existing edge functions, so that I can protect all endpoints with minimal code changes.

#### Acceptance Criteria

1. WHEN integrating rate limiting THEN it SHALL require adding only 2-3 lines of code to each edge function
2. WHEN rate limiting is added to an edge function THEN it SHALL not break existing functionality
3. WHEN rate limiting middleware is applied THEN it SHALL execute before any business logic
4. WHEN rate limiting passes THEN the edge function SHALL continue normal execution
5. WHEN rate limiting fails THEN the edge function SHALL return immediately without executing business logic

### Requirement 6: Error Handling and Logging

**User Story:** As a system administrator, I want rate limit violations to be logged, so that I can monitor for potential abuse patterns and adjust limits as needed.

#### Acceptance Criteria

1. WHEN a rate limit is exceeded THEN the system SHALL log the event with the identifier, endpoint, and timestamp
2. WHEN rate limit checks fail due to errors THEN the system SHALL log the error but allow the request to proceed
3. WHEN logging rate limit events THEN the system SHALL include sufficient context for debugging (user ID, IP, endpoint, limit type)
4. WHEN rate limiting errors occur THEN they SHALL not cause the entire request to fail

### Requirement 7: Configuration and Flexibility

**User Story:** As a developer, I want rate limit configurations to be easily adjustable, so that I can tune limits based on production usage patterns.

#### Acceptance Criteria

1. WHEN defining rate limits THEN they SHALL be configured in a centralized configuration object
2. WHEN rate limit configurations are changed THEN they SHALL take effect on the next function deployment
3. WHEN defining rate limits THEN the configuration SHALL support different time windows (seconds, minutes, hours)
4. WHEN defining rate limits THEN the configuration SHALL support different request counts per window
