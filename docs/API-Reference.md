# API Reference

Complete API documentation for the Leave Management System.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All API endpoints (except `/auth/signup` and `/auth/login`) require authentication via Supabase session cookies. The session is automatically managed by the `@supabase/ssr` middleware.

### Headers

```http
Content-Type: application/json
Cookie: sb-<project-id>-auth-token=<session-token>
```

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication Endpoints

### POST `/api/auth/signup`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "department": "Engineering"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "employee"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "jwt-token"
  }
}
```

**Errors:**
- `400` - Email already registered
- `400` - Invalid email format
- `400` - Password too weak (min 8 characters)

---

### POST `/api/auth/login`

Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "employee",
    "full_name": "John Doe"
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "jwt-token"
  }
}
```

**Errors:**
- `400` - Invalid credentials
- `400` - Missing email or password

---

## Leave Management Endpoints

### GET `/api/leaves`

Get user's leave requests with optional filtering.

**Query Parameters:**
- `status` (optional) - Filter by status: `pending`, `approved`, `rejected`, `cancelled`
- `limit` (optional) - Number of results (default: 50, max: 100)
- `offset` (optional) - Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "leaves": [
    {
      "id": "uuid",
      "requester_id": "uuid",
      "start_date": "2024-02-01",
      "end_date": "2024-02-05",
      "leave_type_id": "uuid",
      "leave_type": {
        "id": "uuid",
        "name": "Annual Leave",
        "description": "Paid vacation time"
      },
      "days_count": 5,
      "reason": "Family vacation",
      "status": "pending",
      "approver_id": null,
      "comments": null,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

**Permissions:**
- Employee: Own leaves only
- Manager: Team leaves + own leaves
- HR/Admin: All leaves

---

### POST `/api/leaves`

Create a new leave request.

**Request Body:**
```json
{
  "leave_type_id": "uuid",
  "start_date": "2024-02-01",
  "end_date": "2024-02-05",
  "reason": "Family vacation to Europe"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "requester_id": "uuid",
  "start_date": "2024-02-01",
  "end_date": "2024-02-05",
  "leave_type_id": "uuid",
  "days_count": 5,
  "reason": "Family vacation to Europe",
  "status": "pending",
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Validation Rules:**
- `start_date` must be in the future
- `end_date` must be >= `start_date`
- `leave_type_id` must be valid and active
- Sufficient leave balance required
- Cannot overlap with existing approved leaves

**Errors:**
- `400` - Insufficient leave balance
- `400` - Invalid date range
- `400` - Overlapping leave request exists
- `404` - Leave type not found

---

### POST `/api/leaves/approve`

Approve or reject a leave request (Manager/HR/Admin only).

**Request Body:**
```json
{
  "id": "leave-request-uuid",
  "action": "approved",
  "comments": "Approved for family time"
}
```

**Parameters:**
- `action` - Either `approved` or `rejected`
- `comments` (optional) - Approval/rejection comments

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "approved",
  "approver_id": "uuid",
  "comments": "Approved for family time",
  "updated_at": "2024-01-16T14:30:00Z"
}
```

**Permissions:**
- Manager: Can approve team member requests
- HR/Admin: Can approve any request

**Errors:**
- `403` - Not authorized to approve this request
- `404` - Leave request not found
- `400` - Leave request already processed

---

## Document Management Endpoints

### GET `/api/documents`

List company documents with optional filtering.

**Query Parameters:**
- `document_type` (optional) - Filter by type
- `limit` (optional) - Results per page (default: 50)
- `offset` (optional) - Pagination offset

**Response:** `200 OK`
```json
{
  "documents": [
    {
      "id": "uuid",
      "name": "Company Policy 2024",
      "document_type": "policy",
      "expiry_date": "2024-12-31T23:59:59Z",
      "uploaded_by": "uuid",
      "uploader": {
        "full_name": "Admin User",
        "role": "admin"
      },
      "storage_path": "documents/policy-2024.pdf",
      "is_public": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 25
}
```

**Permissions:**
- Employee: Public documents only
- HR/Admin: All documents

---

### POST `/api/documents`

Upload a new document.

**Request:** `multipart/form-data`
```
file: <binary>
name: "Company Policy 2024"
document_type: "policy"
expiry_date: "2024-12-31"
is_public: true
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Company Policy 2024",
  "document_type": "policy",
  "expiry_date": "2024-12-31T23:59:59Z",
  "storage_path": "documents/policy-2024.pdf",
  "storage_url": "https://storage-url.com/documents/policy-2024.pdf",
  "is_public": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Validation:**
- Max file size: 10MB
- Allowed types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
- Name required (max 255 chars)

**Permissions:**
- HR/Admin only

**Errors:**
- `400` - File too large
- `400` - Invalid file type
- `403` - Insufficient permissions

---

### DELETE `/api/documents/[id]`

Delete a document.

**Response:** `200 OK`
```json
{
  "message": "Document deleted successfully"
}
```

**Permissions:**
- HR/Admin only
- Document uploader can delete own documents

**Errors:**
- `403` - Insufficient permissions
- `404` - Document not found

---

### POST `/api/documents/[id]/notifiers`

Create expiry notification for a document.

**Request Body:**
```json
{
  "user_id": "uuid",
  "notification_frequency": "monthly",
  "custom_frequency_days": null
}
```

**Parameters:**
- `notification_frequency` - `weekly`, `monthly`, or `custom`
- `custom_frequency_days` - Required if frequency is `custom` (1-365)

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "document_id": "uuid",
  "user_id": "uuid",
  "notification_frequency": "monthly",
  "status": "active",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Permissions:**
- HR/Admin only

---

### POST `/api/documents/[id]/notifiers/schedule`

Manually trigger document expiry notification.

**Response:** `200 OK`
```json
{
  "message": "Notification scheduled successfully",
  "scheduled_for": "2024-01-15T09:00:00Z"
}
```

**Permissions:**
- HR/Admin only

---

## Admin Endpoints

### GET `/api/admin/users`

List all users (Admin/HR only).

**Query Parameters:**
- `role` (optional) - Filter by role
- `department` (optional) - Filter by department
- `limit` (optional) - Results per page
- `offset` (optional) - Pagination offset

**Response:** `200 OK`
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "employee",
      "department": "Engineering",
      "manager_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 150
}
```

---

### PATCH `/api/admin/users`

Update user role or details (Admin only).

**Request Body:**
```json
{
  "user_id": "uuid",
  "role": "manager",
  "department": "Engineering",
  "manager_id": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "role": "manager",
  "department": "Engineering",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Permissions:**
- Admin only

---

### GET `/api/admin/leave-types`

List all leave types.

**Response:** `200 OK`
```json
{
  "leave_types": [
    {
      "id": "uuid",
      "name": "Annual Leave",
      "description": "Paid vacation time",
      "default_allocation_days": 25,
      "accrual_rules": {
        "accrual_rate": "monthly",
        "days_per_period": 2.08
      },
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST `/api/admin/leave-types`

Create a new leave type (Admin only).

**Request Body:**
```json
{
  "name": "Maternity Leave",
  "description": "Maternity leave for new mothers",
  "default_allocation_days": 90,
  "is_active": true
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Maternity Leave",
  "default_allocation_days": 90,
  "is_active": true,
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

### GET `/api/admin/reports`

Generate various system reports (Admin/HR only).

**Query Parameters:**
- `report_type` - `leave_utilization`, `user_activity`, `document_expiry`, `balance_summary`
- `start_date` (optional) - Report period start
- `end_date` (optional) - Report period end
- `department` (optional) - Filter by department

**Response:** `200 OK`
```json
{
  "report_type": "leave_utilization",
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "data": {
    "total_leaves": 45,
    "approved": 38,
    "rejected": 5,
    "pending": 2,
    "by_type": {
      "annual": 30,
      "sick": 10,
      "personal": 5
    },
    "by_department": {
      "Engineering": 25,
      "Marketing": 12,
      "Sales": 8
    }
  },
  "generated_at": "2024-02-01T10:00:00Z"
}
```

---

### GET `/api/admin/audit-logs`

Retrieve system audit logs (Admin only).

**Query Parameters:**
- `action_type` (optional) - Filter by action: `create`, `update`, `delete`, `approve`
- `entity_type` (optional) - Filter by entity: `leave`, `document`, `user`
- `user_id` (optional) - Filter by user
- `start_date` (optional)
- `end_date` (optional)
- `limit` (optional)
- `offset` (optional)

**Response:** `200 OK`
```json
{
  "logs": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_email": "admin@example.com",
      "action": "approve",
      "entity_type": "leave",
      "entity_id": "uuid",
      "changes": {
        "status": ["pending", "approved"],
        "approver_id": [null, "uuid"]
      },
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 1250
}
```

---

## Notifications Endpoints

### GET `/api/notifications`

Get user notifications.

**Query Parameters:**
- `status` (optional) - `read`, `unread`
- `limit` (optional)
- `offset` (optional)

**Response:** `200 OK`
```json
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "leave_approved",
      "title": "Leave Request Approved",
      "message": "Your annual leave from Feb 1-5 has been approved",
      "data": {
        "leave_id": "uuid",
        "approver_name": "Manager Name"
      },
      "read": false,
      "created_at": "2024-01-16T14:30:00Z"
    }
  ],
  "unread_count": 3
}
```

---

## Rate Limiting

All API endpoints are rate-limited to prevent abuse:

- **Anonymous requests:** 10 requests/minute
- **Authenticated requests:** 100 requests/minute
- **Admin endpoints:** 200 requests/minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642345678
```

---

## Pagination

Endpoints that return lists support pagination:

**Request:**
```http
GET /api/leaves?limit=25&offset=50
```

**Response includes:**
```json
{
  "data": [...],
  "total": 125,
  "limit": 25,
  "offset": 50,
  "has_more": true
}
```

---

## Webhooks (Future)

Webhook support for real-time event notifications is planned for future releases.

**Supported Events:**
- `leave.created`
- `leave.approved`
- `leave.rejected`
- `document.expiring`
- `user.created`

---

## SDK & Client Libraries

Official client libraries:

- **JavaScript/TypeScript:** Use `@supabase/supabase-js` with provided client configuration
- **React:** Use custom hooks in `/hooks` directory

---

## Support

For API issues or questions:
- Check logs: `/api/admin/audit-logs`
- Contact: support@your-domain.com
- Documentation: https://docs.your-domain.com
