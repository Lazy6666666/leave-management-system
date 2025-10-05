# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A production-ready leave management system built with Next.js (Pages Router), React, TypeScript, and Supabase. Features role-based access control, leave approval workflows, document management with expiry tracking, and real-time notifications.

## Development Commands

### Frontend Development
```bash
# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build
npm start

# Code quality
npm run lint                # Run ESLint
npm run lint:fix            # Auto-fix ESLint issues
npm run type-check          # TypeScript type checking
npm run format              # Format with Prettier
npm run check-all           # Run format, lint, type-check, and build

# Testing
npm test                    # Run unit tests in watch mode
npm run test:run            # Run unit tests once
npm run test:coverage       # Generate coverage report (80% threshold)
npm run test:ui             # Vitest UI

# E2E Testing
npm run test:e2e            # Run Playwright E2E tests
npm run test:e2e:ui         # Playwright UI mode
npm run test:e2e:debug      # Debug mode

# Visual Regression Testing
npm run test:visual         # Run visual regression tests
npm run test:visual:update  # Update visual snapshots
npm run test:visual:ui      # Visual tests in UI mode
npm run test:visual:report  # Show test report

# Accessibility Testing
npm run test:a11y           # Run basic accessibility tests
npm run test:a11y:enhanced  # Run enhanced accessibility tests
npm run test:a11y:keyboard  # Test keyboard navigation
npm run test:a11y:all       # Run all accessibility tests
```

### Backend (Supabase)
```bash
cd backend

# Local development
npm run dev                 # Serve Edge Functions locally

# Database operations
npm run db:generate         # Generate TypeScript types from schema
npm run db:push             # Push schema changes to Supabase
npm run db:reset            # Reset local database

# Deployment
npm run deploy              # Deploy Edge Functions to Supabase
```

## Architecture

### Frontend Structure

**Pages Router** (not App Router):
- `/pages/` - Next.js Pages Router structure
  - `/api/` - API route handlers (Next.js API routes, not Edge Runtime)
  - `/dashboard/` - Main application pages (admin, leaves, approvals, documents, team, profile)
  - `/login/` and `/register/` - Authentication pages
  - `index.tsx` - Landing page
  - `_app.tsx` - Custom App component with theme provider
  - `globals.css` - Global styles with Tailwind and custom CSS variables
- `/components/` - Reusable React components
  - `/features/` - Feature-specific components
    - `/admin/` - Admin dashboard components
    - `/approvals/` - Approval workflow components
    - `/auth/` - Login and registration forms
    - `/documents/` - Document management components
    - `/leaves/` - Leave request forms and lists
    - `/notifications/` - Notification system components
    - `/profile/` - User profile components
    - `leave-request-form.tsx` - Main leave request form
  - `/layouts/` - Layout components
    - `DashboardLayout.tsx` - Main dashboard layout with navigation
- `/hooks/` - Custom React hooks
  - `use-auth.ts` - Authentication hook
  - `use-toast.ts` - Toast notification hook
- `/lib/` - Utilities and core logic
  - `/schemas/` - Zod validation schemas
  - `/utils/` - Utility functions
  - `supabase-client.ts` - Browser client (singleton pattern)
  - `supabase-server.ts` - Server-side client with cookie handling for API routes
  - `permissions.ts` - Role-based access control utilities
  - `api-client.ts` - Frontend API client wrapper with business logic
  - `accessibility-utils.ts` - Accessibility helpers
  - `utils.ts` - General utility functions (cn, etc.)
- `/ui/` - UI component library (shadcn/ui based on Radix UI)
- `/e2e/` - Playwright end-to-end tests
- `middleware.ts` - Authentication and route protection middleware

### Backend Structure

**Supabase**:
- `backend/supabase/migrations/` - Database schema migrations
  - `001_initial_schema.sql` - Core tables (profiles, leaves, leave_types, documents)
  - `002_row_level_security.sql` - RLS policies for data security
  - `003_helper_functions.sql` - Database utility functions
- `backend/supabase/functions/` - Edge Functions (Deno runtime)
  - `approve-leave/` - Leave approval workflow logic
  - `create-leave-request/` - Leave request creation and validation
  - `check-document-expiry/` - Automated document expiry notifications
  - `initialize-leave-balances/` - Leave balance initialization for new users

### Authentication & Authorization

**Middleware** (`middleware.ts`):
- Uses `@supabase/ssr` for server-side auth
- Protects routes: `/dashboard/*`, `/profile`, `/approvals`, `/documents`, `/team`
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from `/login` and `/register`

**Role-Based Access Control** (`lib/permissions.ts`):
- Roles: `employee`, `manager`, `hr`, `admin`
- Helper functions: `isAdminOrHr()`, `isManagerOrHigher()`
- Used throughout API routes and UI for feature gating

**Supabase Client Pattern**:
- Browser: `getBrowserClient()` - singleton pattern
- Server Components/API: `createClient()` - per-request instance with cookie handling
- Admin operations: `getServiceRoleClient()` - bypasses RLS (use carefully)

### Database Architecture

**Core Tables**:
- `profiles` - User profiles with role, department, manager relationships
- `leaves` - Leave requests with status workflow (pending → approved/rejected/cancelled)
- `leave_types` - Configurable leave types with balance rules
- `leave_balances` - Per-user balance tracking by leave type
- `company_documents` - Document metadata with expiry tracking
- `document_notifiers` - Automated notification scheduling for expiring documents

**Row Level Security (RLS)**:
- All tables have RLS enabled
- Policies enforce role-based access at database level
- Users can only access their own data unless they have elevated permissions
- Managers can see their team's data, HR/Admin can see organization-wide data

### API Architecture

**API Routes** (`pages/api/`):
- Follow Next.js Pages Router conventions
- Authentication via `supabase-server` client
- Input validation using Zod schemas (`lib/schemas/`)
- Error responses follow consistent format: `{ error: { message: string } }`

**Edge Functions** (Deno):
- Business logic that requires service role access
- Background jobs (document expiry checks)
- Complex workflows (leave approval with balance updates)

### Testing Strategy

**Unit Tests** (Vitest):
- Location: Co-located with source files as `__tests__/*.test.tsx` or `*.test.ts`
- Testing libraries: `@testing-library/react`, `@testing-library/user-event`
- Coverage thresholds: 80% (branches, functions, lines, statements)
- Run individual test: `npm test -- path/to/test.test.ts`
- Run specific test file: `npm test -- ui/button`

**E2E Tests** (Playwright):
- Location: `e2e/` directory
- Browsers: Chromium, Mobile Chrome, Mobile Safari
- Test types: Basic E2E, accessibility (axe-core), visual regression, keyboard navigation
- Automatic dev server startup at http://localhost:3000
- Run single test: `npm run test:e2e -- -g "test name"`
- Debug specific test: `npm run test:e2e:debug -- -g "test name"`

**Visual Regression Testing**:
- Uses Playwright's screenshot comparison
- Snapshots stored in `e2e/visual-regression.spec.ts-snapshots/`
- Update snapshots: `npm run test:visual:update`
- Tests light/dark themes and responsive layouts

**Accessibility Testing**:
- Automated a11y checks with @axe-core/playwright
- Keyboard navigation tests
- ARIA attribute validation
- Focus management testing

## Key Patterns

### Supabase Client Usage
```typescript
// Browser components
import { getBrowserClient } from '@/lib/supabase-client'
const supabase = getBrowserClient()

// Server components / API routes
import { createClient } from '@/lib/supabase-server'
const supabase = createClient()
```

### Permission Checks
```typescript
import { getUserProfile, isAdminOrHr } from '@/lib/permissions'

const profile = await getUserProfile(supabase, userId)
if (!isAdminOrHr(profile.role)) {
  return res.status(403).json({ error: { message: 'Forbidden' } })
}
```

### Business Days Calculation
Leave days are calculated using `calculateBusinessDays()` from `lib/api-client.ts`, which excludes weekends. Public holidays should be handled by future enhancements.

### Document Expiry System
Documents have expiry dates tracked in `company_documents`. A scheduled Edge Function (`check-document-expiry`) runs daily to send notifications for documents expiring within configured thresholds.

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Backend only, never expose to client
```

## Common Development Workflows

### Adding a New Page
1. Create page component in `pages/dashboard/your-page/index.tsx` (Pages Router, not `page.tsx`)
2. Update `middleware.ts` if route requires protection (add to `protectedPaths` array)
3. Add navigation link in `components/layouts/DashboardLayout.tsx`
4. Implement permission checks using `lib/permissions.ts` if role-based access needed

### Adding a New API Endpoint
1. Create handler in `pages/api/your-endpoint/index.ts` (or nested route)
2. Define Zod schema in `lib/schemas/` for request validation
3. Implement handler with Next.js API route pattern:
   ```typescript
   import type { NextApiRequest, NextApiResponse } from 'next'
   import { createClient } from '@/lib/supabase-server'

   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     const supabase = createClient(req, res)
     // Implementation
   }
   ```
4. Add authentication check with `supabase.auth.getUser()`
5. Add permission checks using `lib/permissions.ts`
6. Add corresponding method in `lib/api-client.ts` for frontend usage
7. Add unit tests in `pages/api/your-endpoint/__tests__/`

### Adding a Database Table
1. Create migration in `backend/supabase/migrations/`
2. Add RLS policies for the table
3. Run `npm run db:push` to apply migration
4. Run `npm run db:generate` to update TypeScript types
5. Update `lib/database.types.ts` if needed

### Modifying an Edge Function
1. Edit function in `backend/supabase/functions/function-name/`
2. Test locally with `npm run dev` (from backend/)
3. Deploy with `npm run deploy`

## Styling & Theming

**Tailwind CSS**:
- Version 4.x configured via `tailwind.config.js`
- Custom CSS variables defined in `globals.css` for light/dark themes
- Uses `next-themes` for theme switching

**UI Components**:
- Based on shadcn/ui (Radix UI primitives + Tailwind)
- Components in `/ui/` directory
- Class merging with `cn()` utility from `lib/utils.ts`
- Variants managed with `class-variance-authority`

**Dark Mode**:
- System preference detection
- Manual toggle via theme switcher component
- CSS variables adapt based on theme: `--background`, `--foreground`, `--primary`, etc.

## TypeScript Configuration

- Strict mode enabled
- Path alias: `@/` maps to `frontend/` for cleaner imports
- Vitest globals enabled for test files
- Type checking: `npm run type-check`

## Monorepo Structure

This is a workspace monorepo with:
- **Root**: Workspace configuration and shared scripts
- **frontend/**: Next.js application
- **backend/**: Supabase Edge Functions and migrations

Run commands from root:
- `npm run dev` → runs frontend dev server
- `npm run dev:frontend` → explicit frontend dev
- `npm run dev:backend` → backend Edge Functions
- `npm run db:*` → database operations

## Critical Notes

### Pages Router (Not App Router)
- Uses Next.js Pages Router architecture
- Page files are `index.tsx`, not `page.tsx`
- API routes in `pages/api/`, not `app/api/`
- No React Server Components - all components are client-side unless using `getServerSideProps`

### Authentication Flow
- Middleware protects routes server-side before rendering
- Client components use `getBrowserClient()` for auth state
- API routes use `createClient(req, res)` for server-side auth
- Edge Functions use service role for admin operations

### Database Access
- All tables have RLS enabled - test with appropriate user roles
- Service role bypasses RLS - only use in Edge Functions or secure API routes
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Test RLS policies with different user roles (employee, manager, hr, admin)

### Testing Approach
- Unit tests for utilities and API clients
- Component tests for React components
- E2E tests for critical user flows
- Visual regression for UI consistency
- Accessibility tests for WCAG compliance

### Common Gotchas
- **API Routes**: Must export default function, not named exports
- **Middleware**: Runs on every request matching the matcher pattern
- **Supabase Client**: Use `getBrowserClient()` in components, `createClient(req, res)` in API routes
- **Theme Variables**: Defined in `globals.css`, not `tailwind.config.js`
- **Path Alias**: `@/` refers to `frontend/`, not project root
