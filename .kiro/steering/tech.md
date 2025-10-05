---
inclusion: always
---

# Technology Stack & Development Guidelines

## Core Technologies

### Frontend Stack
- **Framework**: Next.js 15.5.4 with React 19.2.0 (App Router)
- **Language**: TypeScript 5.9.3 (strict mode enabled)
- **Styling**: Tailwind CSS 4.1.14 with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui components
- **State Management**: TanStack React Query 5.90.2 for server state
- **Forms**: React Hook Form with Zod validation schemas
- **Icons**: Lucide React (consistent icon library)
- **Theme**: Next Themes for dark/light mode support

### Backend Stack
- **Platform**: Supabase (managed PostgreSQL, Auth, Edge Functions)
- **Runtime**: Deno for Supabase Edge Functions
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with role-based access control
- **API**: RESTful endpoints via Supabase client

### Testing Framework
- **Unit Tests**: Vitest with TypeScript support
- **E2E Tests**: Playwright with accessibility testing
- **Component Testing**: Testing Library React
- **Accessibility**: Axe Core integration for a11y compliance

## Development Standards

### Code Style Requirements
- Use TypeScript strict mode - no `any` types allowed
- Prefer named exports over default exports
- Use absolute imports from project root (`@/components`, `@/lib`)
- Follow React Query patterns for all server state management
- Implement proper error boundaries and loading states
- Use Zod schemas for all form validation and API data validation

### Component Patterns
- Use compound components for complex UI patterns
- Implement proper TypeScript interfaces for all props
- Follow accessibility best practices (ARIA labels, keyboard navigation)
- Use React.memo for performance optimization when needed
- Prefer composition over prop drilling

### Database Conventions
- Always use Row Level Security (RLS) policies
- Store user roles in profiles table, not auth metadata
- Use TypeScript types generated from Supabase schema
- Implement proper foreign key relationships
- Use database functions for complex business logic

## Essential Commands

### Development Workflow
```bash
# Start development (frontend + backend)
npm run dev

# Install all workspace dependencies
npm run install:all

# Generate TypeScript types from Supabase
npm run db:generate
```

### Testing & Quality
```bash
# Run all tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Check code quality (lint + type check)
npm run check-all
```

### Database Management
```bash
# Push schema changes to Supabase
npm run db:push

# Reset database to clean state
npm run db:reset
```

## Critical Requirements
- Node.js >= 18.0.0 with npm >= 9.0.0
- Supabase CLI for local development
- All API calls must handle loading and error states
- Implement optimistic updates with proper rollback
- Use React Query for caching and synchronization
- Follow mobile-first responsive design principles