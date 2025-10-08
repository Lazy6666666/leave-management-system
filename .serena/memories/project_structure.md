The project is a monorepo with a `frontend` and `backend` directory.

- **`frontend/`**: A Next.js application that serves as the user interface.
  - **`src/app/`**: Contains all the pages and API routes.
  - **`src/components/`**: Reusable React components, with `shadcn/ui` components in `src/components/ui/`.
  - **`src/lib/`**: Core logic, utility functions, and Supabase client configurations.
    - **`supabase-client.ts`**: Client-side Supabase instance.
    - **`supabase-server.ts`**: Server-side Supabase client for use in API routes and Server Components.
    - **`auth.ts`**: Authentication-related utility functions.
  - **`middleware.ts`**: Handles route protection and redirects based on authentication status and user roles.

- **`backend/`**: A Node.js project that contains Supabase edge functions and database migrations.
  - **`supabase/functions/`**: Contains the Supabase Edge Functions.
  - **`supabase/migrations/`**: Contains the database schema migrations.