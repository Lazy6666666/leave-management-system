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
npm run lint
npm run type-check

# Testing
npm test                    # Run unit tests in watch mode
npm run test:run            # Run unit tests once
npm run test:coverage       # Generate coverage report (80% threshold)
npm run test:ui             # Vitest UI
npm run test:e2e            # Run Playwright E2E tests
npm run test:e2e:ui         # Playwright UI mode
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
  - `/api/` - API route handlers
  - `/dashboard/` - Main application pages (admin, leaves, approvals, documents, team)
  - `/login/` and `/register/` - Authentication pages
- `/components/` - Reusable React components
  - `/admin/` - Admin-specific components
  - `/features/` - Feature-specific components
- `/hooks/` - Custom React hooks
- `/lib/` - Utilities and core logic
  - `/schemas/` - Zod validation schemas
  - `supabase-client.ts` - Browser client (singleton pattern)
  - `supabase-server.ts` - Server-side client with cookie handling
  - `permissions.ts` - Role-based access control utilities
  - `api-client.ts` - Frontend API client wrapper
- `/ui/` - UI component library (shadcn/ui)

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
- Location: Co-located with source files (`*.test.ts`)
- Setup: `src/test/setup.ts`
- Coverage thresholds: 80% (branches, functions, lines, statements)
- Run individual test: `npm test -- path/to/test.test.ts`

**E2E Tests** (Playwright):
- Location: `e2e/` directory
- Tests Chromium, Mobile Chrome, and Mobile Safari
- Automatic dev server startup
- Run single test: `npm run test:e2e -- -g "test name"`

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
1. Create page component in `pages/dashboard/your-page/page.tsx`
2. Add layout if needed in `pages/dashboard/your-page/layout.tsx`
3. Update `middleware.ts` if route requires protection
4. Add navigation link in dashboard layout

### Adding a New API Endpoint
1. Create route in `pages/api/your-endpoint/route.ts`
2. Define Zod schema in `lib/schemas/`
3. Implement request handler with authentication and permission checks
4. Add corresponding method in `lib/api-client.ts`

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

## TypeScript Configuration

- Strict mode enabled
- Path alias: `@/` maps to project root for cleaner imports
- Vitest globals enabled for test files

## Notes

- This project uses **Pages Router**, not App Router
- All database operations should respect RLS policies
- Service role key should only be used in Edge Functions or secure API routes
- Document upload uses Supabase Storage with access policies
- Leave balance updates are handled via database triggers and Edge Functions
