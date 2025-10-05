# Design Document: Leave Management Enhancements

## Overview

This design document outlines the technical approach for enhancing the Leave Management System with critical functionality improvements. The enhancements include leave request editing, document upload capabilities, navigation fixes, team calendar improvements using shadcn components, and new pages for documents, approvals, reports, and leave types management.

The design prioritizes user experience, maintains consistency with the existing system architecture, and leverages the current tech stack (Next.js 15, React 19, Supabase, shadcn/ui components).

## Architecture

### High-Level Architecture

The enhancements follow the existing three-tier architecture:

1. **Presentation Layer**: Next.js pages and React components
2. **Business Logic Layer**: React hooks, API routes, and client-side validation
3. **Data Layer**: Supabase PostgreSQL database with Row Level Security (RLS)

### Component Architecture

```
frontend/
├── pages/
│   └── dashboard/
│       ├── leaves/
│       │   ├── new.tsx (fix routing)
│       │   ├── edit/[id].tsx (new)
│       │   └── index.tsx (enhanced)
│       ├── documents/
│       │   └── index.tsx (new)
│       ├── approvals/
│       │   └── index.tsx (new)
│       ├── reports/
│       │   └── index.tsx (new)
│       └── leave-types/
│           └── index.tsx (new)
├── components/
│   └── features/
│       ├── leave-request-form.tsx (enhanced)
│       ├── document-upload.tsx (new)
│       ├── team-calendar.tsx (enhanced)
│       ├── approvals-list.tsx (new)
│       ├── reports-dashboard.tsx (new)
│       └── leave-types-manager.tsx (new)
└── hooks/
    ├── use-leave-documents.ts (new)
    ├── use-leave-edit.ts (new)
    └── use-team-calendar.ts (enhanced)
```

### Database Schema Changes

```sql
-- New table for document storage
CREATE TABLE leave_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leave_request_id UUID REFERENCES leave_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_file_size CHECK (file_size <= 5242880) -- 5MB limit
);

-- Add audit trail columns to leave_requests
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id);

-- Create indexes for performance
CREATE INDEX idx_leave_documents_request ON leave_documents(leave_request_id);
CREATE INDEX idx_leave_requests_modified ON leave_requests(last_modified_at);
```

## Components and Interfaces

### 1. Leave Request Editing

**Design Decision**: Reuse the existing leave request form component with an "edit mode" flag rather than creating a separate edit form. This ensures consistency and reduces code duplication.

**Component**: `LeaveRequestForm` (enhanced)
- Props: `mode: 'create' | 'edit'`, `initialData?: LeaveRequest`
- State management: React Hook Form with Zod validation
- API integration: PATCH `/api/leaves/[id]` for updates

**Route**: `/dashboard/leaves/edit/[id]`
- Dynamic route using Next.js file-based routing
- Server-side props to fetch existing leave request data
- Authorization check: only allow editing own pending requests

**Business Rules**:
- Only pending requests can be edited
- Validation rules identical to new requests
- Audit trail: update `last_modified_at` and `last_modified_by`
- Maintain original `created_at` and `created_by`

### 2. Document Upload

**Design Decision**: Use Supabase Storage for file management rather than base64 encoding in the database. This provides better performance, scalability, and built-in CDN capabilities.

**Component**: `DocumentUpload`
- File input with drag-and-drop support
- Client-side validation: file type, size (5MB max)
- Preview with file name, size, and remove option
- Upload progress indicator

**Storage Structure**:
```
leave-documents/
└── {user_id}/
    └── {leave_request_id}/
        └── {timestamp}_{filename}
```

**Supported Formats**: PDF, JPG, JPEG, PNG, DOC, DOCX
- MIME types: `application/pdf`, `image/jpeg`, `image/png`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Upload Flow**:
1. Client validates file
2. Upload to Supabase Storage
3. Store metadata in `leave_documents` table
4. Associate with leave request

**Security**:
- RLS policies: users can only access their own documents
- Managers can view documents for requests they approve
- Signed URLs for secure downloads (1-hour expiry)

### 3. Navigation Fix

**Design Decision**: Centralize navigation configuration in a single source of truth to prevent routing inconsistencies.

**Implementation**:
- Create `lib/navigation-config.ts` with route definitions
- Update sidebar component to use centralized config
- Implement role-based filtering for navigation items

**Navigation Configuration**:
```typescript
interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: ('employee' | 'manager' | 'admin')[];
}
```

**Routes to Fix**:
- `/dashboard/leaves/new` - ensure page exists
- All sidebar navigation items - verify href attributes
- Active state highlighting - use Next.js `useRouter` hook

### 4. Team Calendar Enhancement

**Design Decision**: Replace custom calendar implementation with shadcn/ui Calendar component for better UX, accessibility, and maintainability.

**Component**: `TeamCalendar` (redesigned)
- Base: shadcn/ui Calendar component
- Custom day renderer for leave indicators
- Tooltip on hover showing leave details
- Month navigation controls
- Responsive design with mobile optimization

**Data Structure**:
```typescript
interface CalendarLeave {
  date: Date;
  employees: {
    id: string;
    name: string;
    leaveType: string;
    status: 'pending' | 'approved';
  }[];
}
```

**Visual Design**:
- Approved leaves: solid color indicator
- Pending leaves: dashed border indicator
- Multiple leaves: stacked indicators or count badge
- Dark mode support with theme-aware colors

**Performance**:
- Fetch leaves for current month + adjacent months
- Cache with React Query (5-minute stale time)
- Optimistic updates on leave approval/rejection

### 5. Documents Management Page

**Component**: `DocumentsPage`
- List view grouped by leave request
- Columns: document name, leave request, upload date, file size
- Download action with loading state
- Empty state for no documents

**Data Fetching**:
- Hook: `useLeaveDocuments()`
- Query: JOIN `leave_documents` with `leave_requests`
- Sorting: most recent first

**UI Features**:
- Search/filter by leave request
- File type icons
- File size formatting (KB/MB)
- Download button with icon

### 6. Approvals Page for Managers

**Component**: `ApprovalsPage`
- Table view of pending leave requests
- Filters: date range, employee, leave type
- Actions: Approve, Reject (with reason modal)
- Document preview/download

**Authorization**:
- Check user role: manager or admin
- Filter requests: only show team members' requests
- RLS policy: managers see their team's requests

**Approval Flow**:
1. Click Approve/Reject button
2. For rejection: show modal for reason input
3. Call API: PATCH `/api/leaves/[id]/approve` or `/reject`
4. Update status in database
5. Trigger notification to employee
6. Refresh list with optimistic update

**Notification Integration**:
- Use existing notification system
- Email notification (if configured)
- In-app notification

### 7. Reports Page for Admins

**Component**: `ReportsPage`
- Report type selector
- Date range picker
- Filter options (department, leave type)
- Visualization: charts using Recharts library
- Export buttons (PDF, CSV)

**Report Types**:
1. Leave usage summary
2. Leaves by type
3. Leaves by department
4. Leave trends over time
5. Employee leave balance

**Data Aggregation**:
- Server-side aggregation using PostgreSQL
- API route: `/api/reports/[type]`
- Caching: 15-minute stale time

**Visualizations**:
- Bar charts for categorical data
- Line charts for trends
- Pie charts for distribution
- Data tables for detailed view

**Export Functionality**:
- CSV: client-side generation using `papaparse`
- PDF: server-side generation using `pdfkit` or similar
- Include filters and date range in export

### 8. Leave Types Management Page

**Component**: `LeaveTypesPage`
- Table view of leave types
- CRUD operations: Create, Read, Update, Delete
- Form modal for add/edit
- Confirmation dialog for delete

**Leave Type Schema**:
```typescript
interface LeaveType {
  id: string;
  name: string;
  description: string;
  default_allocation: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

**Business Rules**:
- Cannot delete leave type if in use
- Check: COUNT leave_requests WHERE leave_type_id = ?
- Can deactivate instead of delete
- Validation: unique name, positive allocation

**UI Features**:
- Add button opens modal
- Edit icon in each row
- Delete with confirmation
- Active/Inactive toggle
- Sort by name or creation date

## Data Models

### LeaveDocument Model

```typescript
interface LeaveDocument {
  id: string;
  leave_request_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  uploaded_by: string;
  uploaded_at: Date;
}
```

### Enhanced LeaveRequest Model

```typescript
interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type_id: string;
  start_date: Date;
  end_date: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  created_by: string;
  last_modified_at?: Date;  // New
  last_modified_by?: string; // New
  approved_by?: string;
  approved_at?: Date;
  rejection_reason?: string;
  documents?: LeaveDocument[]; // Relation
}
```

### LeaveType Model

```typescript
interface LeaveType {
  id: string;
  name: string;
  description: string;
  default_allocation: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

## Error Handling

### Client-Side Errors

1. **File Upload Errors**:
   - Invalid file type: Show toast with supported formats
   - File too large: Show toast with size limit
   - Upload failure: Retry mechanism with exponential backoff

2. **Form Validation Errors**:
   - Display inline errors using React Hook Form
   - Highlight invalid fields
   - Prevent submission until valid

3. **Navigation Errors**:
   - 404 handling: Redirect to dashboard with error message
   - Unauthorized access: Redirect to login

### Server-Side Errors

1. **Database Errors**:
   - Constraint violations: Return 400 with user-friendly message
   - Connection errors: Return 503 with retry suggestion

2. **Storage Errors**:
   - Upload failure: Clean up partial uploads
   - Download failure: Return 404 or 500 with message

3. **Authorization Errors**:
   - Insufficient permissions: Return 403
   - Invalid token: Return 401 and trigger re-authentication

### Error Logging

- Client errors: Log to console in development
- Server errors: Log to Supabase logs
- Critical errors: Consider error tracking service (e.g., Sentry)

## Testing Strategy

### Unit Tests

1. **Component Tests**:
   - `DocumentUpload`: file validation, upload flow
   - `LeaveRequestForm`: edit mode, validation
   - `TeamCalendar`: date rendering, leave indicators
   - `ApprovalsPage`: filtering, approval actions

2. **Hook Tests**:
   - `useLeaveDocuments`: data fetching, caching
   - `useLeaveEdit`: update logic, optimistic updates
   - `useTeamCalendar`: date calculations, filtering

3. **Utility Tests**:
   - File validation functions
   - Date formatting utilities
   - Navigation configuration

### Integration Tests

1. **Leave Request Editing Flow**:
   - Navigate to edit page
   - Modify request details
   - Submit and verify update

2. **Document Upload Flow**:
   - Select file
   - Upload to storage
   - Verify metadata saved
   - Download and verify

3. **Approval Flow**:
   - Manager views pending requests
   - Approves/rejects request
   - Verify status update
   - Verify notification sent

### E2E Tests

1. **Complete Leave Request Lifecycle**:
   - Employee creates request with document
   - Manager approves request
   - Employee views approved request
   - Document is downloadable

2. **Navigation Test**:
   - Click all navigation items
   - Verify correct pages load
   - Verify role-based visibility

3. **Calendar Interaction**:
   - View team calendar
   - Navigate months
   - Hover over leave dates
   - Verify tooltip content

### Accessibility Tests

- Keyboard navigation for all interactive elements
- Screen reader compatibility
- ARIA labels for custom components
- Color contrast compliance (WCAG AA)
- Focus management in modals

## Performance Considerations

### Optimization Strategies

1. **Code Splitting**:
   - Lazy load report visualizations
   - Dynamic imports for admin pages
   - Route-based code splitting (automatic with Next.js)

2. **Data Fetching**:
   - React Query for caching and deduplication
   - Pagination for large lists (documents, approvals)
   - Infinite scroll for reports

3. **File Upload**:
   - Client-side compression for images
   - Chunked uploads for large files (future enhancement)
   - Progress feedback for better UX

4. **Calendar Performance**:
   - Fetch only visible month range
   - Memoize day renderers
   - Debounce month navigation

### Caching Strategy

- Leave requests: 1-minute stale time
- Documents list: 5-minute stale time
- Team calendar: 5-minute stale time
- Reports: 15-minute stale time
- Leave types: 1-hour stale time (rarely changes)

## Security Considerations

### Authentication & Authorization

1. **Row Level Security (RLS)**:
   - Employees: access own leave requests and documents
   - Managers: access team members' requests
   - Admins: access all data

2. **API Route Protection**:
   - Verify authentication token
   - Check user role for admin endpoints
   - Validate request ownership for edit operations

3. **File Upload Security**:
   - Validate file type on client and server
   - Scan for malicious content (future enhancement)
   - Use signed URLs with expiration
   - Prevent directory traversal attacks

### Data Validation

1. **Input Sanitization**:
   - Zod schemas for all form inputs
   - SQL injection prevention (Supabase handles this)
   - XSS prevention (React handles this)

2. **File Validation**:
   - MIME type checking
   - File extension validation
   - Size limit enforcement
   - Filename sanitization

## Migration Strategy

### Database Migrations

1. Create `leave_documents` table
2. Add audit columns to `leave_requests`
3. Create indexes for performance
4. Set up RLS policies

### Data Migration

- No existing data migration needed (new features)
- Existing leave requests remain unchanged
- Documents are optional, no backfill required

### Rollout Plan

1. **Phase 1**: Navigation fixes and route corrections
2. **Phase 2**: Leave request editing functionality
3. **Phase 3**: Document upload feature
4. **Phase 4**: Team calendar enhancement
5. **Phase 5**: New pages (Documents, Approvals, Reports, Leave Types)

### Rollback Strategy

- Database migrations are reversible
- Feature flags for gradual rollout (optional)
- Keep old calendar component as fallback
- Monitor error rates post-deployment

## Dependencies

### New Dependencies

1. **Recharts** (^2.x): For report visualizations
   - Rationale: Well-maintained, React-friendly, good documentation

2. **papaparse** (^5.x): For CSV export
   - Rationale: Robust CSV parsing/generation, widely used

3. **react-dropzone** (^14.x): For file upload UX
   - Rationale: Excellent drag-and-drop support, accessibility

### Existing Dependencies (Leveraged)

- shadcn/ui Calendar component
- React Hook Form + Zod
- TanStack React Query
- Supabase client
- Lucide React icons

## Future Enhancements

1. **Advanced Document Features**:
   - Document preview (PDF viewer)
   - Multiple file upload
   - Document versioning

2. **Calendar Enhancements**:
   - Export calendar to iCal
   - Sync with external calendars
   - Team availability view

3. **Reporting Enhancements**:
   - Scheduled reports via email
   - Custom report builder
   - Dashboard widgets

4. **Approval Workflow**:
   - Multi-level approvals
   - Delegation of approval authority
   - Bulk approval actions

5. **Notifications**:
   - Real-time notifications using Supabase Realtime
   - Push notifications
   - Notification preferences
