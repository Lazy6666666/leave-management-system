---
inclusion: always
---

---
inclusion: always
---

# Leave Management System - Product Guidelines

## Business Logic Rules

### Role-Based Access Control (RBAC)
Enforce these permissions in all features:
- **Employee**: Own data only (`leave_requests.user_id = auth.uid()`)
- **Admin/Manager**: Team data + employee permissions
- **System Admin**: Full system access

**Critical**: Check user role in RLS policies AND React components before rendering admin features.

### Leave Request State Machine
Follow this exact workflow - no exceptions:
```
DRAFT → PENDING → APPROVED/DENIED
         ↓
      CANCELLED (only from PENDING)
```

**State Transition Rules**:
- DRAFT can only go to PENDING (never direct to APPROVED)
- Only PENDING requests can be CANCELLED by employees
- All state changes MUST log `updated_by` and `updated_at`
- Admins can transition PENDING to APPROVED/DENIED

### Data Validation Requirements
Validate these business rules on client AND server:
- Start date ≥ today (exception: same-day requests before 2 PM)
- End date ≥ start date
- No overlapping requests for same user
- Sufficient leave balance (check `user_profiles.leave_balance`)
- Maximum 30 days per single request

## UI/UX Standards

### Form Implementation
- Always use `react-hook-form` + `zod` validation
- Show validation errors on blur, not on change
- Disable submit during API calls with loading state
- Toast notifications for success/error feedback
- Optimistic updates for better UX

### Status Display (Exact Colors)
- `PENDING`: `bg-amber-100 text-amber-800` (yellow/amber)
- `APPROVED`: `bg-green-100 text-green-800` (green)
- `DENIED`: `bg-red-100 text-red-800` (red)
- `CANCELLED`: `bg-gray-100 text-gray-800` (gray)

### Loading Patterns
- Skeleton loaders for data (never spinners)
- Button loading states during form submission
- Use React Query's `isLoading` vs `isFetching` appropriately
- Optimistic updates with rollback on error

### Navigation Structure
- Default post-login route: `/dashboard`
- Admin routes: `/admin/*` prefix required
- Breadcrumbs for nested pages
- Mobile-first responsive design

## Error Handling Standards

### HTTP Error Responses
Handle these scenarios consistently:
- `401`: Redirect to login page
- `403`: Show "Access denied" message with role context
- `422`: Display validation errors inline with fields
- `500`: Generic error with retry button

### Form Error Display
- Field errors: Below input with red text and icon
- Form errors: Top of form in error banner
- Consistent styling: `text-red-600` with `AlertCircle` icon

## Component Architecture

### File Organization
- Feature components: `frontend/components/[feature]/ComponentName.tsx`
- Compound components for complex forms: `Form.Header`, `Form.Body`, `Form.Actions`
- Admin components: `frontend/components/admin/`
- Shared UI: `frontend/ui/`

### Required Patterns
- TypeScript interfaces for all props (no `any` types)
- Loading and error states in all data components
- Proper accessibility (ARIA labels, keyboard navigation)
- React.memo for performance when needed

### State Management
- React Query for ALL server state
- Local form state with `react-hook-form`
- Optimistic updates for user actions
- Cache invalidation after mutations
- No global state for UI state (use local state)

## Development Rules

### API Integration
- All API calls through Supabase client
- Proper error boundaries around data fetching
- Loading states for all async operations
- Retry logic for failed requests

### Database Interactions
- Always use RLS policies (never bypass)
- Store user roles in `profiles` table, not auth metadata
- Use TypeScript types generated from Supabase schema
- Database functions for complex business logic

### Testing Requirements
- Unit tests for business logic functions
- Component tests for form validation
- E2E tests for critical user flows
- Accessibility testing with axe-core