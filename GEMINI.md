# Gemini Project Context: Leave Management System

## Project Overview

This is a comprehensive, production-ready leave management system. It's a full-stack application built with a modern tech stack designed for scalability, security, and a great user experience.

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **UI:** Tailwind CSS with shadcn/ui components
- **State Management:** React Query for server state
- **Forms:** React Hook Form with Zod for validation

The goal is to provide a robust platform for employees, managers, and administrators to manage leave requests, company documents, and team schedules efficiently.

## Key Features

- **Authentication & Authorization:** Secure login with email/password and role-based access control (Employee, Manager, Admin, HR) using Supabase Auth. Middleware protects routes based on user roles.
- **Leave Management:** Users can submit, track, and manage leave requests. An approval workflow allows managers to approve or reject requests with comments. Leave balances are automatically calculated.
- **Document Management:** Securely upload, manage, and track expiry for company-wide documents using Supabase Storage.
- **Team Calendar:** A visual calendar to see team availability and scheduled leaves.
- **Admin Dashboard:** A central place for administrators to manage users, leave types, and view system-wide reports.
- **Real-time Notifications:** Utilizes Supabase's real-time capabilities to provide instant updates for events like leave status changes.

## Architecture & Project Structure

The project is a monorepo with a `frontend` and `backend` directory.

- **`frontend/`**: A Next.js application that serves as the user interface.
- **`backend/`**: A Node.js project that contains Supabase edge functions and database migrations.

### Frontend (`frontend/`)

The project follows a standard Next.js App Router structure.

- **`src/app/`**: Contains all the pages and API routes.
  - **`api/`**: Backend API endpoints for handling business logic (e.g., approving leaves, signing up users).
  - **`dashboard/`**: Protected routes for the main application dashboard, accessible after login.
- **`src/components/`**: Reusable React components, with `shadcn/ui` components in `src/components/ui/`.
- **`src/lib/`**: Core logic, utility functions, and Supabase client configurations.
  - **`supabase-client.ts`**: Client-side Supabase instance.
  - **`supabase-server.ts`**: Server-side Supabase client for use in API routes and Server Components.
  - **`auth.ts`**: Authentication-related utility functions.
- **`middleware.ts`**: Handles route protection and redirects based on authentication status and user roles.

### Backend (`backend/`)

- **`supabase/functions/`**: Contains the Supabase Edge Functions.
- **`supabase/migrations/`**: Contains the database schema migrations.

## Building and Running

### Prerequisites

- Node.js 18+
- A Supabase project
- Supabase CLI

### Setup & Development

**Frontend:**

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install Dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment:
    Copy `.env.example` to `.env.local` and add your Supabase project URL and keys.
    ```bash
    cp .env.example .env.local
    ```
4.  Run Development Server:
    ```bash
    npm run dev
    ```

**Backend:**

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install Dependencies:
    ```bash
    npm install
    ```
3.  Start Supabase local development environment:
    ```bash
    npx supabase start
    ```
4.  Deploy Supabase functions:
    ```bash
    npm run deploy
    ```

### Key Scripts

**Frontend:**

- `npm run dev`: Start the development server.
- `npm run build`: Create a production build.
- `npm run start`: Start the production server.
- `npm run lint`: Run ESLint to check for code quality issues.
- `npm run test`: Run tests using Vitest.

**Backend:**

- `npm run dev`: Start the Supabase functions development server.
- `npm run deploy`: Deploy Supabase functions.
- `npm run db:generate`: Generate TypeScript types from the database.
- `npm run db:reset`: Reset the local database.
- `npm run db:push`: Push database changes to Supabase.

## Development Conventions

- **Type-Safety:** The project uses TypeScript in strict mode. Types for the database are generated from the Supabase schema.
- **Code Style:** Code is formatted with Prettier and linted with ESLint.
- **UI Components:** The `shadcn/ui` library is used for building the user interface. New components should follow this style.
- **API Routes:** Backend logic is handled via API routes within the `frontend/src/app/api` directory and Supabase Edge Functions in the `backend/supabase/functions` directory.
- **Testing:** Integration and unit tests are written with Vitest and Playwright is used for end-to-end tests.
