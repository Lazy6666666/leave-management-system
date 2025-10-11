# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Leave Management System** built with Next.js (Pages Router), React, TypeScript, and Supabase. The project consists of:
- **Frontend**: Next.js application (this directory)
- **Backend**: Supabase services (`../backend/`)

## Commands

### Development
```bash
npm run dev              # Start development server
npm run build            # Production build
npm run start            # Start production server
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format with Prettier
npm run type-check       # TypeScript type checking
npm run check-all        # Run format, lint, types, and build checks
```

### Testing
```bash
# Unit & Integration Tests (Vitest)
npm test                 # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:ui          # Open Vitest UI
npm run test:coverage    # Generate coverage report
npm run test:integration # Run integration tests

# E2E Tests (Playwright)
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Open Playwright UI
npm run test:e2e:debug   # Debug E2E tests

# Visual Regression
npm run test:visual      # Run visual regression tests
npm run test:visual:update  # Update snapshots
npm run test:visual:report  # View test report

# Accessibility Tests
npm run test:a11y        # Run accessibility tests
npm run test:a11y:enhanced  # Enhanced a11y tests
npm run test:a11y:keyboard  # Keyboard navigation tests
npm run test:a11y:all    # Run all a11y tests
```

### Production Readiness
```bash
npm run validate-typescript  # Validate TypeScript strictness
npm run production-check     # Run production readiness checks
npm run cleanup:validate     # Run both validation checks
npm run cleanup:files:dry    # Dry-run file cleanup
npm run cleanup:files        # Execute file cleanup
npm run analyze              # Bundle analysis
```

## Architecture

### Authentication & Authorization

**Middleware-based Auth**: `middleware.ts` intercepts all routes to:
- Check Supabase session using SSR
- Fetch user role from `profiles` table
- Enforce route protection (dashboard, admin pages)
- Redirect unauthenticated users to `/login`
- Redirect authenticated users away from `/login` and `/register`

**Client Creation Pattern**:
- **Browser**: Use `getBrowserClient()` from `lib/supabase-client.ts` (singleton pattern)
- **Server**: Create per-request server clients using `@supabase/ssr` (avoid in middleware)

**Role-based Access**:
- Roles: `employee`, `manager`, `hr`, `admin`
- Admin routes: `/dashboard/admin/*` require `admin` or `hr` role
- RLS policies in Supabase enforce database-level security

### Data Flow Architecture

**React Query (TanStack Query)** is the primary data management layer:
- All server state lives in React Query cache
- Custom hooks in `hooks/` directory handle data fetching
- 5-minute stale time for most queries
- Automatic retry with exponential backoff (3 attempts for queries, 2 for mutations)
- Optimistic updates with automatic rollback on error

**Key Patterns**:
```typescript
// Query pattern (read operations)
const { data, isLoading, error } = useLeaveDocuments({ leaveRequestId })

// Mutation pattern (write operations)
const mutation = useUploadDocument()
await mutation.mutateAsync({ leaveRequestId, file })
```

**Query Key Structure**:
- `['leave-documents']` - All documents
- `['leave-documents', leaveRequestId]` - Filtered by leave
- `['leave-with-documents', leaveRequestId]` - Leave with relations
- `['leaves']` - All leaves (invalidated on edit/cancel)

### API Routes Structure

API routes in `pages/api/` follow REST conventions:

```
pages/api/
├── admin/              # Admin-only endpoints
│   ├── reports/        # Report generation
│   └── users/          # User management
├── auth/               # Authentication
├── documents/          # Document operations
├── leaves/             # Leave request CRUD
├── leave-types/        # Leave type management
├── notifications/      # Notification system
└── user/               # User profile operations
```

**API Middleware** (`lib/api-middleware.ts`):
- Validates HTTP methods
- Checks authentication
- Verifies role-based permissions
- Handles errors consistently

### Component Organization

```
components/
├── features/          # Feature-specific components
│   ├── admin/         # Admin dashboard components
│   ├── analytics/     # Charts and analytics
│   ├── approvals/     # Leave approval workflows
│   ├── auth/          # Login/register forms
│   ├── documents/     # Document upload/management
│   ├── leaves/        # Leave request forms
│   ├── notifications/ # Notification UI
│   └── profile/       # User profile
├── layouts/           # Page layouts (DashboardLayout)
├── providers/         # Context providers (theme, auth)
├── reports/           # Report generation components
└── ui/                # Radix UI + shadcn/ui components
```

**Layout Pattern**: `DashboardLayout` wraps all `/dashboard/*` pages providing:
- Navigation sidebar
- User menu
- Theme toggle
- Real-time notification integration

### Form Management

**React Hook Form + Zod** for all forms:
- Schema definitions in `lib/schemas/` (auth.ts, leave.ts, document.ts, admin.ts)
- Validation happens client-side before submission
- `@hookform/resolvers/zod` bridges RHF and Zod
- Error messages are user-friendly and accessible

**Example Pattern**:
```typescript
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { leaveRequestSchema } from '@/lib/schemas/leave'

const form = useForm({
  resolver: zodResolver(leaveRequestSchema),
  defaultValues: { /* ... */ }
})
```

### Real-time Features

Supabase Realtime subscriptions in `lib/realtime.ts`:
- Subscribe to `leaves` table changes
- Channel-based pub/sub pattern
- Graceful fallback if realtime unavailable
- Remember to unsubscribe on component unmount

**Usage Pattern**:
```typescript
const channel = subscribeToLeaveRequests(userId, department)
// Later...
unsubscribeFromChannel(channel)
```

### Storage & File Uploads

Supabase Storage buckets (configured in `../backend/supabase/migrations/009_storage_bucket_configuration.sql`):
- `avatars` - User profile pictures (public)
- `leave-documents` - Leave request attachments (private with RLS)
- `company-documents` - Company policies (role-based access)

**Upload Pattern** (see `hooks/use-leave-documents.ts`):
1. Upload file to storage bucket
2. Create metadata record in `leave_documents` table
3. On failure, cleanup storage file
4. Invalidate queries on success

### Error Handling

Multi-layer error handling:
1. **Supabase errors**: Wrapped by `lib/supabase-error-handler.ts`
2. **API errors**: Standardized by `lib/api-error-handler.ts`
3. **Client errors**: Displayed via `lib/client-error-handler.ts` + toast notifications
4. **Page errors**: Caught by `_error.tsx` and `components/error-boundary.tsx`

**Best Practice**: Always handle errors explicitly in components:
```typescript
try {
  await mutation.mutateAsync(data)
  toast.success('Operation completed')
} catch (error) {
  // Error is already logged and handled
  // Toast notification shown automatically
}
```

### TypeScript Configuration

**Strict mode enabled** with:
- `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`
- `noUncheckedIndexedAccess` - array access returns `T | undefined`
- Path aliases configured: `@/components`, `@/lib`, `@/types`, `@/hooks`, `@/ui`

**Type Sources**:
- Database types: `lib/database.types.ts` (generated from Supabase)
- Custom types: `types/` directory
- Component props: Use explicit interfaces

## Backend Integration

### Database Schema

Key tables (see `../backend/supabase/migrations/001_initial_schema.sql`):
- `profiles` - User profiles with role
- `leaves` - Leave requests
- `leave_types` - Leave categories
- `leave_balances` - User leave allowances
- `leave_documents` - Document metadata
- `leave_audit_trail` - Change history

### Edge Functions

Supabase Edge Functions in `../backend/supabase/functions/`:
- `approve-leave` - Approve/reject leave requests
- `create-leave-request` - Create new leave request
- `initialize-leave-balances` - Set up leave balances
- `check-document-expiry` - Monitor document expiration
- `search-employees` - Employee search with filters
- `export-employees` - Export employee data

**Calling Edge Functions**:
```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* payload */ }
})
```

### Row Level Security (RLS)

All tables use RLS policies (see `../backend/supabase/migrations/002_row_level_security.sql`):
- Users can only see their own data by default
- Managers can see their department's data
- HR and admins have broader access
- Policies are role-aware and department-aware

## Development Guidelines

### Adding New Features

1. **Define schema** in `lib/schemas/` using Zod
2. **Create API route** in `pages/api/` with middleware
3. **Create custom hook** in `hooks/` using React Query
4. **Build UI component** in `components/features/`
5. **Add tests** in `__tests__/` directory
6. **Update navigation** in `lib/navigation-config.ts` if needed

### Database Changes

1. Create migration in `../backend/supabase/migrations/`
2. Apply migration: `npx supabase db push`
3. Regenerate types: `npx supabase gen types typescript --local > lib/database.types.ts`
4. Update RLS policies if needed
5. Test locally with Supabase CLI

### Testing Strategy

- **Unit tests** (Vitest): Pure functions, utilities, hooks
- **Integration tests**: API routes, database interactions
- **E2E tests** (Playwright): Critical user flows
- **Visual regression**: UI component snapshots
- **Accessibility tests**: WCAG 2.1 AA compliance

**Testing Priorities**:
1. Authentication flows
2. Leave request creation/approval
3. Document upload/download
4. Admin operations
5. Role-based access control

### Performance Considerations

- Bundle size monitored via `npm run analyze`
- Images optimized through Next.js Image component
- Static assets cached with immutable headers (see `next.config.js`)
- React Query reduces redundant fetches
- Lazy load heavy components with `dynamic()` import

### Security Headers

Configured in `next.config.js`:
- `Strict-Transport-Security` for HTTPS enforcement
- `X-Frame-Options: SAMEORIGIN` to prevent clickjacking
- `X-XSS-Protection` for legacy browser protection
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restricts camera, microphone, geolocation

## Common Patterns

### Protected Page Pattern
```typescript
export async function getServerSideProps(context) {
  const supabase = createServerClient(context)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  return { props: { user } }
}
```

### Data Fetching Pattern
```typescript
// In component
const { data, isLoading } = useLeaveDocuments({ leaveRequestId })

if (isLoading) return <Spinner />
if (!data) return <EmptyState />

return <DocumentList documents={data} />
```

### Form Submission Pattern
```typescript
const mutation = useUploadDocument()

const onSubmit = async (data) => {
  try {
    await mutation.mutateAsync(data)
    toast.success('Uploaded successfully')
  } catch (error) {
    // Error handled automatically
  }
}
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # API routes only
```

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.
