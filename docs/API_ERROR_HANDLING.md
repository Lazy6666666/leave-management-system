# API Error Handling Documentation

## Overview

This document describes the error handling patterns and validation rules for all API endpoints in the Leave Management System.

## Error Response Format

All API errors follow a standardized format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "additional context"
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## HTTP Status Codes

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST request |
| 204 | No Content | Successful DELETE request |
| 400 | Bad Request | Validation error or invalid input |
| 401 | Unauthorized | Authentication required or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource or constraint violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

## Error Codes

### Authentication & Authorization

| Code | Status | Description |
|------|--------|-------------|
| `AUTH_UNAUTHORIZED` | 401 | User not authenticated |
| `AUTH_FORBIDDEN` | 403 | User lacks required permissions |
| `AUTH_SESSION_EXPIRED` | 401 | Session has expired |
| `AUTH_INVALID_TOKEN` | 401 | Invalid authentication token |

### Validation

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | General validation error |
| `VALIDATION_FILE_TYPE` | 400 | Invalid file type |
| `VALIDATION_FILE_SIZE` | 400 | File size exceeds limit |
| `VALIDATION_REQUIRED_FIELD` | 400 | Required field missing |
| `VALIDATION_INVALID_DATE` | 400 | Invalid date format or value |

### Database

| Code | Status | Description |
|------|--------|-------------|
| `DATABASE_ERROR` | 500 | Database operation failed |
| `DATABASE_NOT_FOUND` | 404 | Resource not found |
| `DATABASE_CONSTRAINT` | 409 | Constraint violation |

### Storage

| Code | Status | Description |
|------|--------|-------------|
| `STORAGE_UPLOAD_FAILED` | 500 | File upload failed |
| `STORAGE_DOWNLOAD_FAILED` | 500 | File download failed |
| `STORAGE_QUOTA_EXCEEDED` | 400 | Storage quota exceeded |

### Business Logic

| Code | Status | Description |
|------|--------|-------------|
| `BUSINESS_INVALID_STATUS` | 400 | Operation not allowed for current status |
| `BUSINESS_INSUFFICIENT_BALANCE` | 400 | Insufficient leave balance |
| `BUSINESS_DUPLICATE_REQUEST` | 400 | Duplicate or overlapping request |
| `BUSINESS_OPERATION_NOT_ALLOWED` | 400 | Operation not permitted |

## API Endpoints

### Leave Requests

#### GET /api/leaves

**Description**: Get all leave requests for the authenticated user

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `status` (optional): Filter by status (pending, approved, rejected)

**Success Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "leave_type_id": "uuid",
      "start_date": "2024-06-01",
      "end_date": "2024-06-05",
      "reason": "Family vacation",
      "status": "pending",
      "created_at": "2024-05-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

**Error Responses**:
- 401: `AUTH_UNAUTHORIZED` - Not authenticated
- 400: `VALIDATION_ERROR` - Invalid query parameters

#### POST /api/leaves

**Description**: Create a new leave request

**Authentication**: Required

**Request Body**:
```json
{
  "leave_type_id": "uuid",
  "start_date": "2024-06-01",
  "end_date": "2024-06-05",
  "reason": "Family vacation"
}
```

**Validation Rules**:
- `leave_type_id`: Required, must be valid UUID
- `start_date`: Required, must be YYYY-MM-DD format, cannot be in the past
- `end_date`: Required, must be >= start_date
- `reason`: Required, 10-500 characters

**Success Response** (201):
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "leave_type_id": "uuid",
    "start_date": "2024-06-01",
    "end_date": "2024-06-05",
    "reason": "Family vacation",
    "status": "pending",
    "created_at": "2024-05-01T00:00:00Z"
  }
}
```

**Error Responses**:
- 400: `VALIDATION_ERROR` - Invalid input data
- 400: `BUSINESS_INSUFFICIENT_BALANCE` - Insufficient leave balance
- 400: `BUSINESS_DUPLICATE_REQUEST` - Overlapping leave request exists
- 401: `AUTH_UNAUTHORIZED` - Not authenticated

#### PATCH /api/leaves/[id]

**Description**: Update a pending leave request

**Authentication**: Required

**Authorization**: User must own the leave request

**Request Body**:
```json
{
  "leave_type_id": "uuid",
  "start_date": "2024-06-01",
  "end_date": "2024-06-05",
  "reason": "Updated reason"
}
```

**Business Rules**:
- Only pending requests can be edited
- User can only edit their own requests
- Same validation rules as POST

**Success Response** (200):
```json
{
  "data": {
    "id": "uuid",
    "last_modified_at": "2024-05-02T00:00:00Z",
    "last_modified_by": "uuid"
  }
}
```

**Error Responses**:
- 400: `BUSINESS_INVALID_STATUS` - Request is not pending
- 403: `AUTH_FORBIDDEN` - User doesn't own the request
- 404: `DATABASE_NOT_FOUND` - Leave request not found

#### DELETE /api/leaves/[id]

**Description**: Delete a pending leave request

**Authentication**: Required

**Authorization**: User must own the leave request

**Business Rules**:
- Only pending requests can be deleted
- User can only delete their own requests

**Success Response** (204): No content

**Error Responses**:
- 400: `BUSINESS_INVALID_STATUS` - Request is not pending
- 403: `AUTH_FORBIDDEN` - User doesn't own the request
- 404: `DATABASE_NOT_FOUND` - Leave request not found

### Leave Approvals

#### PATCH /api/leaves/[id]/approve

**Description**: Approve a leave request

**Authentication**: Required

**Authorization**: Manager or Admin role required

**Request Body**:
```json
{
  "action": "approve"
}
```

**Business Rules**:
- Only pending requests can be approved
- Only managers and admins can approve
- Managers can only approve their team's requests

**Success Response** (200):
```json
{
  "data": {
    "id": "uuid",
    "status": "approved",
    "approved_by": "uuid",
    "approved_at": "2024-05-02T00:00:00Z"
  }
}
```

**Error Responses**:
- 400: `BUSINESS_INVALID_STATUS` - Request is not pending
- 403: `AUTH_FORBIDDEN` - Insufficient permissions
- 404: `DATABASE_NOT_FOUND` - Leave request not found

#### PATCH /api/leaves/[id]/reject

**Description**: Reject a leave request

**Authentication**: Required

**Authorization**: Manager or Admin role required

**Request Body**:
```json
{
  "action": "reject",
  "rejection_reason": "Insufficient coverage during requested period"
}
```

**Validation Rules**:
- `rejection_reason`: Required, 10-500 characters

**Success Response** (200):
```json
{
  "data": {
    "id": "uuid",
    "status": "rejected",
    "approved_by": "uuid",
    "approved_at": "2024-05-02T00:00:00Z",
    "rejection_reason": "Insufficient coverage during requested period"
  }
}
```

**Error Responses**:
- 400: `VALIDATION_ERROR` - Missing or invalid rejection reason
- 400: `BUSINESS_INVALID_STATUS` - Request is not pending
- 403: `AUTH_FORBIDDEN` - Insufficient permissions

### Documents

#### POST /api/documents

**Description**: Upload a document for a leave request

**Authentication**: Required

**Authorization**: User must own the leave request

**Request**: Multipart form data
- `leave_request_id`: UUID
- `file`: File (PDF, JPEG, PNG, DOC, DOCX)

**Validation Rules**:
- File size: Max 5MB
- File types: PDF, JPEG, PNG, DOC, DOCX
- Max 5 documents per leave request

**Success Response** (201):
```json
{
  "data": {
    "id": "uuid",
    "leave_request_id": "uuid",
    "file_name": "medical-certificate.pdf",
    "file_size": 1024000,
    "file_type": "application/pdf",
    "storage_path": "user123/request456/1234567890_medical-certificate.pdf",
    "uploaded_at": "2024-05-01T00:00:00Z"
  }
}
```

**Error Responses**:
- 400: `VALIDATION_FILE_TYPE` - Invalid file type
- 400: `VALIDATION_FILE_SIZE` - File too large
- 403: `AUTH_FORBIDDEN` - User doesn't own the leave request
- 500: `STORAGE_UPLOAD_FAILED` - Upload failed

#### GET /api/documents/[id]/download

**Description**: Download a document

**Authentication**: Required

**Authorization**: User must own the leave request or be a manager/admin

**Success Response** (200): File download

**Error Responses**:
- 403: `AUTH_FORBIDDEN` - Insufficient permissions
- 404: `DATABASE_NOT_FOUND` - Document not found
- 500: `STORAGE_DOWNLOAD_FAILED` - Download failed

#### DELETE /api/documents/[id]

**Description**: Delete a document

**Authentication**: Required

**Authorization**: User must own the leave request

**Business Rules**:
- Can only delete documents from pending requests

**Success Response** (204): No content

**Error Responses**:
- 400: `BUSINESS_INVALID_STATUS` - Request is not pending
- 403: `AUTH_FORBIDDEN` - Insufficient permissions
- 404: `DATABASE_NOT_FOUND` - Document not found

### Leave Types

#### GET /api/leave-types

**Description**: Get all active leave types

**Authentication**: Required

**Success Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Annual Leave",
      "description": "Annual vacation leave",
      "default_allocation": 20,
      "is_active": true
    }
  ]
}
```

#### POST /api/leave-types

**Description**: Create a new leave type

**Authentication**: Required

**Authorization**: Admin role required

**Request Body**:
```json
{
  "name": "Sick Leave",
  "description": "Medical leave",
  "default_allocation": 10,
  "is_active": true
}
```

**Validation Rules**:
- `name`: Required, 1-100 characters, must be unique
- `description`: Optional, max 500 characters
- `default_allocation`: Required, positive integer, max 365
- `is_active`: Optional, boolean (default: true)

**Success Response** (201):
```json
{
  "data": {
    "id": "uuid",
    "name": "Sick Leave",
    "description": "Medical leave",
    "default_allocation": 10,
    "is_active": true,
    "created_at": "2024-05-01T00:00:00Z"
  }
}
```

**Error Responses**:
- 400: `VALIDATION_ERROR` - Invalid input
- 403: `AUTH_FORBIDDEN` - Not an admin
- 409: `DATABASE_CONSTRAINT` - Duplicate name

#### DELETE /api/leave-types/[id]

**Description**: Delete a leave type

**Authentication**: Required

**Authorization**: Admin role required

**Business Rules**:
- Cannot delete leave type if it's in use
- Consider deactivating instead

**Success Response** (204): No content

**Error Responses**:
- 400: `BUSINESS_OPERATION_NOT_ALLOWED` - Leave type in use
- 403: `AUTH_FORBIDDEN` - Not an admin
- 404: `DATABASE_NOT_FOUND` - Leave type not found

### Reports

#### GET /api/reports/[type]

**Description**: Generate a report

**Authentication**: Required

**Authorization**: Admin role required

**Path Parameters**:
- `type`: Report type (usage, by-type, by-department, trends, balance)

**Query Parameters**:
- `start_date`: Required, YYYY-MM-DD format
- `end_date`: Required, YYYY-MM-DD format
- `department`: Optional, filter by department
- `leave_type_id`: Optional, filter by leave type

**Success Response** (200):
```json
{
  "data": {
    "type": "usage",
    "period": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    },
    "summary": {
      "total_requests": 150,
      "approved": 120,
      "pending": 20,
      "rejected": 10
    },
    "details": [...]
  }
}
```

**Error Responses**:
- 400: `VALIDATION_ERROR` - Invalid date range
- 403: `AUTH_FORBIDDEN` - Not an admin

## Rate Limiting

All API endpoints are rate-limited to prevent abuse:

- **Default**: 100 requests per minute per user
- **File uploads**: 10 requests per minute per user
- **Reports**: 20 requests per minute per user

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

**Rate Limit Exceeded Response** (429):
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Handling Best Practices

### Client-Side

1. **Always check response status**:
```typescript
const response = await fetch('/api/leaves')
if (!response.ok) {
  const error = await response.json()
  throw new AppError(error.error.code, error.error.message)
}
```

2. **Handle specific error codes**:
```typescript
try {
  await createLeaveRequest(data)
} catch (error) {
  if (error.code === 'BUSINESS_INSUFFICIENT_BALANCE') {
    showError('You do not have enough leave balance')
  } else if (error.code === 'BUSINESS_DUPLICATE_REQUEST') {
    showError('You already have a leave request for these dates')
  } else {
    showError('Failed to create leave request')
  }
}
```

3. **Provide user-friendly messages**:
```typescript
import { getUserFriendlyMessage } from '@/lib/errors'

const message = getUserFriendlyMessage(error)
showToast(message)
```

### Server-Side

1. **Use error handler middleware**:
```typescript
import { withErrorHandler } from '@/lib/api-error-handler'

export default withErrorHandler(async (req, res) => {
  // Your handler code
})
```

2. **Throw typed errors**:
```typescript
import { ValidationError, NotFoundError } from '@/lib/errors'

if (!data.email) {
  throw new ValidationError('Email is required', { field: 'email' })
}

if (!user) {
  throw new NotFoundError('User')
}
```

3. **Validate input**:
```typescript
import { validateRequestBody, leaveRequestSchema } from '@/lib/api-validation'

const data = validateRequestBody(req.body, leaveRequestSchema)
```

## Testing Error Handling

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest'

describe('POST /api/leaves', () => {
  it('should return 400 for invalid date range', async () => {
    const response = await request(app)
      .post('/api/leaves')
      .send({
        leave_type_id: 'uuid',
        start_date: '2024-06-05',
        end_date: '2024-06-01', // Invalid: end before start
        reason: 'Test'
      })
    
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })
})
```

### Integration Tests

```typescript
it('should handle insufficient balance error', async () => {
  // Setup: User with 0 leave balance
  
  const response = await request(app)
    .post('/api/leaves')
    .send(validLeaveRequest)
  
  expect(response.status).toBe(400)
  expect(response.body.error.code).toBe('BUSINESS_INSUFFICIENT_BALANCE')
})
```

## Changelog

### Version 1.1.0 (2024-01-15)

- Added comprehensive error handling system
- Implemented validation for all endpoints
- Added rate limiting
- Improved error messages
- Added error logging

### Version 1.0.0 (2024-01-01)

- Initial API release
