# Frontend Directory Structure

This document outlines the clean, consolidated directory structure for the frontend application.

## Directory Organization

```
frontend/
├── components/           # Main components directory
│   ├── features/        # Feature-specific components
│   │   ├── admin/       # Admin feature components
│   │   ├── analytics/   # Analytics components
│   │   ├── approvals/   # Approval workflow components
│   │   ├── auth/        # Authentication components
│   │   ├── documents/   # Document management components
│   │   ├── leaves/      # Leave management components
│   │   ├── notifications/ # Notification components
│   │   ├── profile/     # User profile components
│   │   └── __tests__/   # Feature component tests
│   ├── admin/           # Admin-specific components
│   ├── layouts/         # Layout components
│   └── ui/              # Custom composite UI components
├── ui/                  # shadcn/ui primitive components
├── pages/               # Next.js pages and API routes
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries and configurations
├── types/               # TypeScript type definitions
└── __tests__/           # Integration tests and test setup
```

## Import Conventions

### shadcn/ui Primitives
Use `@/ui/*` for importing base UI components:
```typescript
import { Button } from '@/ui/button'
import { Card, CardContent } from '@/ui/card'
import { Table, TableBody, TableCell } from '@/ui/table'
```

### Custom Components
Use `@/components/*` for importing custom components:
```typescript
import { StatCard } from '@/components/ui/stat-card'
import { LeaveRequestForm } from '@/components/features/leave-request-form'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
```

### Other Imports
```typescript
import { useAuth } from '@/hooks/use-auth'
import { LeaveType } from '@/types'
import { cn } from '@/lib/utils'
```

## Component Categories

### `ui/` - shadcn/ui Primitives
- Base components from shadcn/ui
- Minimal styling, maximum reusability
- Examples: Button, Card, Input, Table, Dialog

### `components/ui/` - Custom Composite Components
- Application-specific UI components
- Built using shadcn/ui primitives
- Examples: StatCard, StatusBadge, EmptyState, PageHeader

### `components/features/` - Feature Components
- Business logic components
- Feature-specific functionality
- Examples: LeaveRequestForm, TeamCalendar, DocumentUpload

### `components/layouts/` - Layout Components
- Page layout and structure components
- Navigation and shell components
- Examples: DashboardLayout, AuthLayout

### `components/admin/` - Admin Components
- Admin-specific components
- Management and configuration interfaces
- Examples: SummaryCards, UserManagement

## Testing Structure

- Unit tests: Alongside components in `__tests__/` subdirectories
- Integration tests: In `frontend/__tests__/`
- E2E tests: In `frontend/e2e/`
- Test setup: `frontend/__tests__/setup.ts`

## Benefits of This Structure

1. **Clear Separation**: Primitive vs. composite vs. feature components
2. **Predictable Imports**: Consistent import patterns
3. **Scalability**: Easy to add new features and components
4. **Maintainability**: Clear ownership and responsibility
5. **No Duplication**: Single source of truth for each component type

## Migration Notes

- Removed duplicate `table.tsx` from `components/ui/`
- Consolidated test files into proper locations
- Removed empty `src/` directory structure
- Updated vitest configuration for new test locations