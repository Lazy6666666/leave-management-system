# Error Handling Guide

This document describes the comprehensive error handling system implemented in the Leave Management System.

## Overview

The error handling system provides:
- Standardized error types and codes
- User-friendly error messages
- Toast notifications for errors
- Error boundaries for React components
- API middleware for server-side error handling
- Storage error handling with cleanup
- 404 and unauthorized access redirects
- Error logging for development and production

## Error Types

### Custom Error Classes

Located in `frontend/lib/errors.ts`:

- **AppError**: Base error class with error codes and status codes
- **ValidationError**: For input validation errors (400)
- **AuthenticationError**: For authentication failures (401)
- **AuthorizationError**: For permission denials (403)
- **NotFoundError**: For missing resources (404)
- **StorageError**: For file storage operations

### Error Codes

```typescript
enum ErrorCode {
  // Authentication & Authorization
  AUTH_UNAUTHORIZED
  AUTH_FORBIDDEN
  AUTH_SESSION_EXPIRED
  AUTH_INVALID_TOKEN
  
  // Validation
  VALIDATION_ERROR
  VALIDATION_FILE_TYPE
  VALIDATION_FILE_SIZE
  VALIDATION_REQUIRED_FIELD
  VALIDATION_INVALID_DATE
  
  // Database
  DATABASE_ERROR
  DATABASE_NOT_FOUND
  DATABASE_CONSTRAINT
  DATABASE_CONNECTION
  
  // Storage
  STORAGE_UPLOAD_FAILED
  STORAGE_DOWNLOAD_FAILED
  STORAGE_DELETE_FAILED
  STORAGE_QUOTA_EXCEEDED
  STORAGE_BUCKET_NOT_FOUND
  
  // Business Logic
  BUSINESS_INVALID_STATUS
  BUSINESS_INSUFFICIENT_BALANCE
  BUSINESS_DUPLICATE_REQUEST
  BUSINESS_OPERATION_NOT_ALLOWED
  
  // Network & System
  NETWORK_ERROR
  TIMEOUT_ERROR
  INTERNAL_ERROR
  METHOD_NOT_ALLOWED
  RATE_LIMIT_EXCEEDED
}
```

## Client-Side Error Handling

### Toast Notifications

Located in `frontend/lib/toast.ts`:

```typescript
import { toast, showErrorToast, showFileUploadError } from '@/lib/toast'

// Basic toast
toast.success('Operation successful')
toast.error('Operation failed')
toast.warning('Warning message')
toast.info('Information message')

// Error-specific toasts
showErrorToast(error)
showFileUploadError(error)
showValidationError('Field name', 'Error message')
showAuthError(error)
showAuthorizationError(error)
showStorageError(error, 'upload')
showNetworkError()
showDatabaseError(error)

// Success toasts
showLeaveRequestSuccess('created')
showApprovalSuccess('approved')
showDocumentSuccess('uploaded')

// Retryable errors
showRetryableError(error, async () => {
  // Retry logic
})
```

### Error Boundaries

Located in `frontend/components/error-boundary.tsx`:

```typescript
import { ErrorBoundary, PageErrorFallback, FormErrorFallback } from '@/components/error-boundary'

// Wrap components with error boundary
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={PageErrorFallback}>
  <YourPage />
</ErrorBoundary>

// With error handler
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Custom error handling
  }}
  context={{ page: 'dashboard' }}
>
  <YourComponent />
</ErrorBoundary>
```

### Form Validation Errors

React Hook Form automatically displays validation errors:

```typescript
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Field Label</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage /> {/* Displays validation errors */}
    </FormItem>
  )}
/>
```

## Server-Side Error Handling

### API Middleware

Located in `frontend/lib/api-middleware.ts`:

```typescript
import {
  withAuth,
  withRole,
  withManagerAccess,
  withAdminAccess,
  withMethods,
  withValidation,
  withErrorHandling,
  compose,
} from '@/lib/api-middleware'

// Basic error handling
export default withErrorHandling(async (req, res) => {
  // Your handler code
  // Errors are automatically caught and formatted
})

// With authentication
export default withAuth(async (req, res) => {
  // req.user is available
  // req.supabase is available
})

// With role check
export default withRole('admin', async (req, res) => {
  // req.profile is available
})

// With manager access
export default withManagerAccess(async (req, res) => {
  // Only managers and admins can access
})

// With method validation
export default withMethods(['GET', 'POST'], async (req, res) => {
  // Only GET and POST allowed
})

// Compose multiple middleware
export default compose(
  withMethods(['PATCH']),
  withManagerAccess
)(async (req, res) => {
  // Your handler code
})
```

### Throwing Errors in API Routes

```typescript
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  StorageError,
  handleSupabaseError,
} from '@/lib/errors'

// Validation error
if (!data.field) {
  throw new ValidationError('Field is required')
}

// Not found
if (!resource) {
  throw new NotFoundError('Resource')
}

// Authorization
if (!hasPermission) {
  throw new AuthorizationError('Insufficient permissions')
}

// Handle Supabase errors
const { data, error } = await supabase.from('table').select()
if (error) {
  throw handleSupabaseError(error)
}
```

## Storage Error Handling

### File Upload with Error Handling

Located in `frontend/lib/storage-utils.ts`:

```typescript
import { uploadDocument, getDocumentDownloadUrl, deleteDocument } from '@/lib/storage-utils'

// Upload with automatic retry and cleanup
const result = await uploadDocument(file, userId, leaveRequestId)

if (!result.success) {
  showFileUploadError(new Error(result.error))
  return
}

// Download with error handling
const downloadResult = await getDocumentDownloadUrl(storagePath)

if (!downloadResult.success) {
  showStorageError(new Error(downloadResult.error), 'download')
  return
}

// Delete with error handling
const deleted = await deleteDocument(storagePath)

if (!deleted) {
  showStorageError(new Error('Failed to delete'), 'delete')
}
```

### Cleanup on Failure

The upload function automatically cleans up partial uploads on failure:

```typescript
// If upload fails, the file is automatically removed from storage
// No manual cleanup needed
const result = await uploadDocument(file, userId, leaveRequestId)
```

## Redirects and Navigation

### Client-Side Redirects

Located in `frontend/lib/redirects.ts`:

```typescript
import {
  redirectTo404,
  redirectToLogin,
  redirectToUnauthorized,
  redirectToDashboard,
  redirectBack,
} from '@/lib/redirects'

// 404 redirect
redirectTo404(router, 'Page not found')

// Login redirect with return URL
redirectToLogin(router, router.asPath, 'Please log in')

// Unauthorized redirect
redirectToUnauthorized(router, 'Admin access required')

// Dashboard redirect
redirectToDashboard(router)

// Go back or fallback
redirectBack(router, '/dashboard')
```

### Server-Side Redirects

```typescript
import {
  createRedirect,
  createNotFound,
  createLoginRedirect,
  createUnauthorizedRedirect,
} from '@/lib/redirects'

// In getServerSideProps
export async function getServerSideProps(context) {
  if (!user) {
    return createLoginRedirect(context.resolvedUrl)
  }
  
  if (!hasPermission) {
    return createUnauthorizedRedirect()
  }
  
  if (!resource) {
    return createNotFound()
  }
  
  return { props: { data } }
}
```

### Route Guards

```typescript
import { requireAuth, requireRole, requireResource } from '@/lib/redirects'

// In component
useEffect(() => {
  const checkAccess = async () => {
    // Check authentication
    const isAuth = await requireAuth(router, async () => {
      return !!user
    })
    
    if (!isAuth) return
    
    // Check role
    const hasRole = await requireRole(router, async () => {
      return user.role === 'admin'
    }, 'admin')
    
    if (!hasRole) return
    
    // Check resource
    await requireResource(router, async () => {
      return !!data
    }, 'Leave request')
  }
  
  checkAccess()
}, [router, user, data])
```

## Error Logging

### Client-Side Logging

```typescript
import { logError } from '@/lib/errors'

try {
  // Your code
} catch (error) {
  logError(error, {
    context: 'operation_name',
    userId: user.id,
    additionalData: 'value',
  })
}
```

### Development vs Production

- **Development**: Errors logged to console with full details
- **Production**: Errors logged as JSON, ready for external service integration

### Integration with Error Tracking Services

To integrate with Sentry, LogRocket, or similar:

```typescript
// In frontend/lib/errors.ts, update logError function:

export function logError(error: unknown, context?: ErrorLogContext): void {
  // ... existing code ...
  
  if (!isDevelopment) {
    // Send to error tracking service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: { custom: context }
      })
    }
  }
}
```

## Best Practices

### 1. Always Use Try-Catch in Async Functions

```typescript
async function fetchData() {
  try {
    const result = await apiCall()
    return result
  } catch (error) {
    logError(error, { context: 'fetch_data' })
    showErrorToast(error)
    throw error // Re-throw if caller needs to handle
  }
}
```

### 2. Provide User-Friendly Messages

```typescript
// Bad
throw new Error('ECONNREFUSED')

// Good
throw new NetworkError('Unable to connect to server. Please check your internet connection.')
```

### 3. Use Specific Error Types

```typescript
// Bad
throw new Error('Invalid input')

// Good
throw new ValidationError('Email address is required', {
  field: 'email'
})
```

### 4. Clean Up Resources on Error

```typescript
let resource = null

try {
  resource = await allocateResource()
  await useResource(resource)
} catch (error) {
  logError(error)
  throw error
} finally {
  if (resource) {
    await cleanupResource(resource)
  }
}
```

### 5. Don't Swallow Errors

```typescript
// Bad
try {
  await operation()
} catch (error) {
  // Silent failure
}

// Good
try {
  await operation()
} catch (error) {
  logError(error)
  showErrorToast(error)
  // Handle or re-throw
}
```

## Testing Error Handling

### Unit Tests

```typescript
import { ValidationError, getUserFriendlyMessage } from '@/lib/errors'

describe('Error Handling', () => {
  it('should create validation error', () => {
    const error = new ValidationError('Invalid input')
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.statusCode).toBe(400)
  })
  
  it('should return user-friendly message', () => {
    const error = new ValidationError('Field required')
    const message = getUserFriendlyMessage(error)
    expect(message).toBe('Please check your input and try again')
  })
})
```

### Integration Tests

```typescript
describe('API Error Handling', () => {
  it('should return 401 for unauthenticated requests', async () => {
    const response = await fetch('/api/protected')
    expect(response.status).toBe(401)
    
    const data = await response.json()
    expect(data.error.code).toBe('AUTH_UNAUTHORIZED')
  })
})
```

## Troubleshooting

### Error Not Showing Toast

1. Check if Sonner Toaster is mounted in `_app.tsx`
2. Verify toast import: `import { toast } from '@/lib/toast'`
3. Check browser console for errors

### Error Boundary Not Catching Errors

1. Error boundaries only catch errors in child components
2. They don't catch errors in event handlers (use try-catch)
3. They don't catch errors in async code (use try-catch)

### API Errors Not Formatted

1. Ensure middleware is applied: `withErrorHandling(handler)`
2. Check that errors are thrown, not returned
3. Verify error is instance of AppError or Error

## Summary

The error handling system provides:

✅ Standardized error types and codes
✅ User-friendly error messages
✅ Toast notifications for all error types
✅ Error boundaries for React components
✅ API middleware for automatic error handling
✅ Storage error handling with cleanup
✅ 404 and unauthorized pages
✅ Comprehensive error logging
✅ Retry logic for transient failures
✅ Type-safe error handling throughout

For questions or issues, refer to the code documentation or contact the development team.
