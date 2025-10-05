---
inclusion: always
---

# Project Structure & Code Organization

## Workspace Layout
This is a monorepo with frontend and backend separation:

```
├── frontend/           # Next.js app - all UI components and pages
├── backend/            # Supabase config - database and edge functions
├── docs/              # Project documentation
├── scripts/           # Deployment and utility scripts
└── .kiro/             # IDE configuration and steering rules
```

## File Creation Rules

### Component Files
- **Location**: `frontend/components/[feature]/ComponentName.tsx`
- **Naming**: PascalCase for components (e.g., `LeaveRequestForm.tsx`)
- **Structure**: Export component as default, types as named exports
- **Admin components**: Place in `frontend/components/admin/`

### Hook Files
- **Location**: `frontend/hooks/use-[feature-name].ts`
- **Naming**: Always start with `use-` (e.g., `use-leave-requests.ts`)
- **Pattern**: Return object with data, loading, error states

### Type Definitions
- **Location**: `frontend/types/[feature].types.ts`
- **Naming**: End with `.types.ts` (e.g., `leave-request.types.ts`)
- **Pattern**: Export interfaces and types, avoid default exports

### API Routes
- **Location**: `frontend/pages/api/[endpoint].ts`
- **Pattern**: Use Next.js API route conventions
- **Validation**: Always validate inputs with Zod schemas

### Database Files
- **Migrations**: `backend/supabase/migrations/[timestamp]_[description].sql`
- **Functions**: `backend/supabase/functions/[function-name]/index.ts`

## Code Organization Patterns

### Import Order (Enforce Strictly)
```typescript
// 1. External libraries
import React from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal modules (absolute paths)
import { Button } from '@/ui/button'
import { useAuth } from '@/hooks/use-auth'

// 3. Relative imports
import './component.css'
```

### Component Structure Template
```typescript
// Types first
interface ComponentProps {
  // props definition
}

// Component implementation
export default function ComponentName({ ...props }: ComponentProps) {
  // hooks
  // handlers
  // render
}

// Named exports for types
export type { ComponentProps }
```

### File Placement Logic
- **Reusable UI**: `frontend/ui/` (buttons, inputs, modals)
- **Feature-specific**: `frontend/components/[feature]/`
- **Business logic**: `frontend/lib/` (utilities, API clients)
- **Validation**: `frontend/lib/schemas/` (Zod schemas)
- **Tests**: Adjacent `__tests__/` directories

## Critical Conventions

### Never Create Files In
- Root level (except config files)
- `frontend/src/` (use `frontend/` directly)
- `backend/src/` (currently unused)

### Always Use
- TypeScript for all new files
- Absolute imports from project root
- Zod validation for forms and API inputs
- React Query for server state management

### Testing File Placement
- Unit tests: `[module]/__tests__/[file].test.ts`
- Integration tests: `frontend/__tests__/`
- E2E tests: `frontend/e2e/`
