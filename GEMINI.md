
# Gemini Project: Leave Management System

## Project Overview

This repository contains a comprehensive Leave Management System built with a modern, full-stack technology stack. The project is structured as a monorepo with separate `frontend` and `backend` workspaces.

**Frontend:**

The frontend is a Next.js application written in TypeScript. It features a rich user interface built with a combination of technologies:

*   **Framework:** Next.js (Pages Router)
*   **Styling:** Tailwind CSS with a detailed design system.
*   **UI Components:** A custom component library built on Radix UI primitives, including components for forms, data display, feedback, and more. It also uses shadcn/ui components.
*   **State Management:** TanStack Query for server state and React Hooks for local state.
*   **Forms:** React Hook Form with Zod for validation.
*   **Testing:** A comprehensive testing suite using Vitest for unit/integration tests and Playwright for end-to-end and visual regression testing.

**Backend:**

The backend is powered by Supabase, providing a robust set of services:

*   **Database:** PostgreSQL for data storage.
*   **Authentication:** Supabase Auth for user management.
*   **APIs:** Supabase Functions for serverless backend logic.
*   **Storage:** Supabase Storage for file management.

## Building and Running

### Prerequisites

*   Node.js (>=18.0.0)
*   npm (>=9.0.0)
*   Supabase CLI

### Installation

Install all dependencies for the frontend and backend workspaces:

```bash
npm run install:all
```

### Development

Run the frontend and backend development servers concurrently:

*   **Frontend:** `npm run dev:frontend` (or `npm run dev`)
*   **Backend:** `npm run dev:backend`

### Building for Production

Build the frontend application for production:

```bash
npm run build
```

### Testing

Run the test suites for the frontend:

*   **All tests:** `npm test`
*   **Unit/Integration tests (UI):** `npm run test:ui`
*   **End-to-end tests:** `npm run test:e2e`
*   **Visual regression tests:** `npm run test:visual`

### Database Management (Backend)

*   **Generate types:** `npm run db:generate`
*   **Push changes:** `npm run db:push`
*   **Reset database:** `npm run db:reset`
*   **Seed users:** `npm run db:seed-users`

## Development Conventions

### Design System

The frontend follows a strict design system documented in `frontend/docs/DESIGN_SYSTEM.md`. Key aspects include:

*   **8-Point Grid:** All spacing and sizing is based on an 8-point grid.
*   **Semantic Colors:** A semantic color system is used for light and dark modes, with specific colors for success, destructive, warning, and info states.
*   **Typography:** A modular type scale is defined with specific utility classes for headings, body text, and labels.

### Component Library

A comprehensive component library is available in `frontend/components`. The documentation for each component, including variants, sizes, and usage examples, can be found in `frontend/docs/COMPONENT_LIBRARY.md`.

### Coding Style

*   **TypeScript:** The project uses TypeScript with strict mode enabled.
*   **Linting:** ESLint and Prettier are used for code linting and formatting. Use `npm run lint` and `npm run format` to check and fix code.
*   **Path Aliases:** Path aliases are configured in `tsconfig.json` for easier imports (e.g., `@/components/*`).

### Testing Practices

*   **Unit & Integration Tests:** Write Vitest tests for individual components and features.
*   **End-to-End Tests:** Use Playwright to test user flows and interactions.
*   **Visual Regression Tests:** Use Playwright to catch unintended visual changes.
*   **Accessibility:** Write Playwright tests to ensure WCAG 2.1 AA compliance.

### Committing and Deploying

*   **Pre-commit Hooks:** A pre-commit hook is set up with `lint-staged` to run linting and formatting before committing.
*   **CI/CD:** The `.github/workflows` directory contains CI/CD pipelines for continuous integration and deployment.
*   **Deployment:** The frontend is deployed to Vercel, and the backend is deployed to Supabase.
