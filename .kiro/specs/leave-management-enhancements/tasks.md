# Implementation Plan: Leave Management Enhancements

- [x] 1. Database schema and migrations








  - Create migration file for `leave_documents` table with proper constraints
  - Add audit trail columns (`last_modified_at`, `last_modified_by`) to `leave_requests` table
  - Create indexes for `leave_documents(leave_request_id)` and `leave_requests(last_modified_at)`
  - Set up Row Level Security (RLS) policies for `leave_documents` table



  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 2. Supabase Storage configuration














  - Create `leave-documents` storage bucket in Supabase
  - Configure bucket policies for authenticated users
  - Set up RLS policies: users access own documents, managers access team documents
  - Configure file size limits (5MB) and allowed MIME types
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Navigation configuration and fixes




  - Create `lib/navigation-config.ts` with centralized route definitions
  - Define `NavItem` interface with label, href, icon, and roles



  - Add all navigation routes including new pages
  - Update sidebar component to use navigation config
  - Implement role-based filtering for navigation items
  - Fix `/dashboard/leaves/new` route and verify page exists
  - Add active state highlighting using Next.js `useRouter`
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Document upload component









  - Install `react-dropzone` dependency
  - Create `DocumentUpload` component with drag-and-drop support
  - Implement client-side file validation (type, size)
  - Add file preview with name, size, and remove option
  - Create upload progress indicator
  - Implement file upload to Supabase Storage with proper path structure
  - Save document metadata to `leave_documents` table


  - Add error handling for upload failures with retry mechanism
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 5. Leave request form enhancement for editing




  - Update `LeaveRequestForm` component to accept `mode` prop ('create' | 'edit')
  - Add `initialData` prop for edit mode
  - Integrate `DocumentUpload` component into the form
  - Update form submission logic to handle both create and update
  - Add document association logic for new requests
  - Implement audit trail updates (`last_modified_at`, `last_modified_by`)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1_

- [x] 6. Leave request edit page and API



  - Create `/dashboard/leaves/edit/[id].tsx` page with dynamic routing
  - Implement server-side props to fetch existing leave request data
  - Add authorization check: only allow editing own pending requests
  - Create API route PATCH `/api/leaves/[id]` for updates
  - Validate that only pending requests can be edited
  - Implement business rules: maintain original created_at/created_by
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_


- [x] 7. Custom hooks for leave documents and editing




  - Create `useLeaveDocuments` hook with React Query
  - Implement data fetching with JOIN between `leave_documents` and `leave_requests`
  - Add 5-minute stale time caching
  - Create `useLeaveEdit` hook for update logic
  - Implement optimistic updates for better UX
  - Add error handling and retry logic
  - _Requirements: 1.1, 2.1, 2.6_

- [x] 8. Team calendar enhancement with shadcn






  - Install shadcn/ui Calendar component if not already present
  - Create enhanced `TeamCalendar` component using shadcn Calendar
  - Implement custom day renderer for leave indicators
  - Add visual distinction: solid for approved, dashed for pending
  - Create tooltip component showing leave details on hover
  - Add month navigation controls
  - Implement responsive design for mobile
  - Update `useTeamCalendar` hook to fetch current + adjacent months
  - Add React Query caching with 5-minute stale time
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
-


- [x] 9. Documents management page







  - Create `/dashboard/documents/index.tsx` page
  - Implement `DocumentsPage` component with list view
  - Display documents grouped by leave request
  - Add columns: document name, leave request, upload date, file size
  - Implement download action with Supabase signed URLs (1-hour expiry)
  - Add loading states and empty state for no documents
  - Implement search/filter by leave request
  - Add file type icons using Lucide React
  - _Requirements: 2.6_

B/MB)
  - _Requirements: 2.6_
-


- [x] 10. Approvals page for managers








  - Create `/dashboard/approvals/index.tsx` page
  - Implement authorization check: manager or admin role only
  - Create `ApprovalsPage` component with table view
  - Display pending leave requests filtered by team
  - Add filters: date range, employee, leave type
  - Implement approve action with API call
  - Create rejection modal with reason input
  - Add document preview/download functionality
  - Implement optimistic updates for approval/rejection


  - Integrate with notification system for employee alerts
  - Create API routes: PATCH `/api/leaves/[id]/a
pprove` and `/reject`



  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 11. Reports page for admins








  - Install `recharts` and `papaparse` dependencies
  - Create `/dashboard/reports/index.tsx` page
  - Implement authorization check: admin role only
  - Create `ReportsPage` component with report type selector
  - Add date range picker and filter options (department, leave type)
  - Implement server-side data aggregation API routes


  - Create API route `/api/reports/[type]` with PostgreSQL aggregation
  - Implement visualizations using Recharts: bar, line, pie charts
  - Add data tables for detailed view


  - Implement CSV export using papaparse
  - Add 15-minute caching with React Query
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_



- [x] 12. Leave types management page








  - Create `/dashboard/leave-types/index.tsx` page
  - Implement authorization check: admin role only
  - Create `LeaveTypesPage` component with table view


  - Implement CRUD operations: Create, Read, Update, Delete
  - Create form modal for add/edit leave type
  - Add confirmation dialog for delete action
  - Implement business rule: prevent delete if leave type in use


  - Add active/inactive toggle instead of hard delete
  - Implement validation: unique name, positive allocation

  - Add sorting by name or creation date
  - Create API routes for CRUD operations

  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

-

- [x] 13. Error handling and validation

















  - Implement client-side file upload error handling with toast notifications
  - Add form validation error display using React Hook Form
  - Create 404 and unauthorized access redirects
  - Implement server-side error handling for database operations
  - Add storage error handling with cleanup for partial uploads
  - Implement authorization error responses (401, 403)
  - Add error logging for development and production
  - _Requirements: 1.5, 2.5, 3.3, 5.6, 6.6, 7.5_
 


- [x] 14. Testing implementation









- [x] 14.1 Write unit tests for components






  - Test `DocumentUpload` component: file validation, upload flow
  - Test `LeaveRequestForm` in edit mode with validation
  - Test `TeamCalendar` date rendering and leave indicators
  - Test `ApprovalsPage` filtering and approval actions
  - _Requirements: All_




- [ ] 14.2 Write unit tests for hooks



  - Test `useLeaveDocuments` data fetching and caching

  - Test `useLeaveEdit` update logic and optimistic updates

  - Test `useTeamCalendar` date calculations and filtering
  - _Requirements: All_

- [ ] 14.3 Write integration tests




  - Test leave request editing flow end-to-end
  - Test document upload and download flow
  - Test approval workflow with notifications
  - _Requirements: 1.1-1.5, 2.1-2.6, 5.1-5.6_

- [x] 14.4 Write E2E tests





  - Test complete leave request lifecycle with documents
  - Test navigation across all new pages
  - Test calendar interaction and tooltips
  - _Requirements: All_

- [ ] 14.5 Accessibility testing



  - Test keyboard navigation for all interactive elements
  - Verify screen reader compatibility
  - Check ARIA labels for custom components
  - Validate color contrast compliance (WCAG AA)
  - _Requirements: All_


- [x] 15. Performance optimization



  - Implement code splitting for admin pages
  - Add lazy loading for report visualizations
  - Implement pagination for documents and approvals lists
  - Add memoization for calendar day renderers
  - Configure React Query caching strategies per component
  - Optimize file upload with client-side image compression
  - _Requirements: 2.4, 4.5, 6.5_


- [x] 16. Documentation and deployment preparation



  - Update API documentation with new endpoints
  - Document new components and hooks
  - Create migration guide for database changes
  - Update environment variables documentation
  - Prepare rollout plan following phased approach
  - _Requirements: All_
