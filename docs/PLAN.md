## Project: Leave Management Application - Comprehensive Development Plan

This document outlines the remaining tasks, required tools, and proposed enhancements for the Leave Management Application to achieve a production-ready state, focusing on intelligent reporting, user management, and robust system validation. All implementations must adhere to strict type-safety (no 'any' types) and avoid deprecated code.

### I. Current Status & Completed Work (Based on provided context)

**Phase 3: Employee Search & Reporting - COMPLETE**
*   **TypeScript Issue**: Fixed `sameSite: 'Lax'` → `"lax"` in supabase-client.ts.
*   **Navigation**: Reports page accessible to HR/Admin users.
*   **All Components**: Production-ready with proper imports and type safety.
*   **Frontend Interface**:
    *   Reports Page: `/dashboard/reports` (HR/Admin access only).
    *   Real-time Search: 300ms debounced queries.
    *   Advanced Filters: Name, department, role selection.
    *   Pagination: Optimized for large datasets.
    *   Excel Export: Downloads employee reports with leave details.
    *   Modal Details: Full employee profiles with leave breakdowns.
*   **Backend APIs**:
    *   Search Endpoint: `/.netlify/functions/search-employees` (Role-based access control, optimized queries, pagination).
    *   Export Endpoint: `/.netlify/functions/export-employees` (Excel generation, metadata sheets, leave balance calculations).
*   **Security Features**: JWT authentication validation, Profile-based permission checks, Input sanitization and SQL injection protection, Role-based API access.

**Recent Fixes (during current interaction):**
*   `frontend/middleware.ts`: Fixed `ReferenceError: profileError is not defined`.
*   `frontend/tsconfig.json`: Corrected `@/ui/*` path alias.
*   `frontend/components/features/AvatarUpload.tsx`:
    *   Updated import paths to `@/ui/avatar`.
    *   Updated `invalidateQueries` to React Query v5 syntax.
    *   Handled `File | undefined` for `setFile` state.
*   `frontend/components/layouts/DashboardLayout.tsx`:
    *   Handled `null | undefined` for `AvatarImage src` prop (2 occurrences).
    *   Handled `undefined` for `getRoleBadgeVariant` parameter (2 occurrences).
*   `frontend/lib/realtime.ts`: Explicitly typed `status` parameter in `channel.subscribe` callback.
*   `frontend/pages/dashboard/admin/documents.tsx`:
    *   Updated `useQuery` to React Query v5 syntax.
    *   Updated `useMutation` calls to React Query v5 syntax (upload, update, delete mutations).
    *   Changed `isLoading` to `isPending` for `useMutation` results (multiple occurrences).
    *   Handled `downloadError` as a string in toast message.
    *   Handled `null | undefined` for `Input defaultValue`.
*   `frontend/hooks/use-admin.ts`: Exported `AdminUsersResponse` type and updated `role` property to union type.
*   `frontend/pages/dashboard/admin/users/index.tsx`:
    *   Corrected `userToEdit` type definition.
    *   Removed misplaced `AdminUsersResponse` import.
    *   Handled `null | undefined` for `userToEdit.department` when passed to `updateRole.mutateAsync`.
    *   Imported `Label` component.
*   `frontend/lib/schemas/admin.ts`: Updated `updateUserRoleSchema` to include `full_name`, `department`, and `is_active`, and made `new_role` optional.

### II. Remaining Critical Issues to Address

1.  **Frontend Build Failure (`ENOENT` error):** The `ENOENT: no such file or directory, open 'C:\Users\Twisted\Desktop\LEAVE\frontend\.next\server\pages\_document.js'` error persists. This indicates a fundamental issue with the Next.js build process, likely related to the Pages Router configuration or a corrupted build.
    *   **Hypothesis:** Despite `frontend/next.config.js` indicating Pages Router, the build process might be misconfigured or corrupted.
    *   **Action:** Investigate the Next.js build process, potentially by examining build logs in detail, verifying `next.config.js` against Pages Router best practices, and ensuring all necessary dependencies are correctly installed and resolved.

2.  **Supabase Schema Cache Issue:** The persistent "Could not find table 'public.employees' in schema cache" error in frontend API routes.
    *   **Hypothesis:** This is likely a combination of incorrect Supabase client initialization, RLS policies, or environment variable configuration. Hydration issues are a strong indicator of this.
    *   **Action:** Thoroughly review Supabase client initialization in `frontend/lib/supabase-server.ts` and API routes (`frontend/pages/api/admin/users/index.ts`), verify Supabase project settings (Site URL, Redirect URLs), and re-inspect RLS policies on `public.employees` and `public.profiles`.

### III. User Requirements & Core Mandates

*   **Intelligent Reporting Ecosystem**:
    *   Dynamic report generation based on various criteria (e.g., leave type, department, date range).
    *   Export functionality for reports (CSV, Excel, PDF).
    *   Visualizations (charts, graphs) for key metrics.
    *   Role-based access to reports (HR/Admin only).
*   **User Management Lifecycle**:
    *   CRUD operations for users (create, read, update, deactivate/delete).
    *   Role assignment and management.
    *   User profile viewing and editing.
    *   Password reset/management.
*   **Comprehensive System Validation**:
    *   Robust unit and integration tests for all new features.
    *   End-to-end (E2E) tests using Playwright for critical user flows.
    *   Continuous integration (CI) setup to automate testing and deployment.
*   **Adherence to Conventions:** Maintain existing project conventions (formatting, naming, structure, framework choices, typing, architectural patterns).
*   **Type-Safety:** Strictly enforce type-safety across the entire codebase (no `any` types).
*   **No Deprecated Code:** Avoid using deprecated libraries, functions, or patterns.
*   **Security:** Implement and verify robust security measures (JWT validation, RLS, input sanitization, role-based access).
*   **Performance:** Optimize frontend and backend for speed and efficiency (e.g., debouncing, pagination, efficient database queries).
*   **Responsive Design:** Ensure the application is fully responsive across various devices.

### IV. Proposed Enhancements for Production Readiness

1.  **Advanced Reporting Features**:
    *   **Custom Report Builder:** Allow HR/Admin to define custom report templates with selectable fields and filters.
    *   **Scheduled Reports:** Implement functionality to schedule reports to be generated and sent automatically (e.g., weekly, monthly).
    *   **Interactive Dashboards:** Create interactive dashboards with drill-down capabilities for HR/Admin to monitor key leave metrics.
    *   **Anomaly Detection:** Implement basic anomaly detection for leave patterns (e.g., unusually high sick leave in a department).
2.  **Enhanced User Management**:
    *   **Bulk User Operations:** Allow HR/Admin to perform bulk actions (e.g., deactivate multiple users, assign roles to a group).
    *   **User Activity Logs:** Implement a comprehensive audit trail for user actions within the application.
    *   **Self-Service Profile Management:** Allow employees to update their own non-sensitive profile information.
    *   **Multi-Factor Authentication (MFA):** Integrate MFA options for enhanced security.
3.  **Robust System Validation & Monitoring**:
    *   **Error Logging & Monitoring:** Integrate with a robust error logging and monitoring service (e.g., Sentry, Datadog).
    *   **Performance Monitoring:** Implement application performance monitoring (APM) to track and optimize performance in production.
    *   **Automated Security Scans:** Integrate static application security testing (SAST) and dynamic application security testing (DAST) into the CI/CD pipeline.
    *   **Accessibility Audits:** Regularly perform automated and manual accessibility audits.
4.  **Internationalization (i18n):** Support multiple languages for the user interface.
5.  **Theming & Customization:** Provide options for light/dark mode and potentially custom branding/theming.
6.  **Notifications System:** Implement in-app and email notifications for leave requests, approvals, and other relevant events.
7.  **API Rate Limiting:** Implement rate limiting on all public-facing and critical API endpoints to prevent abuse.
8.  **Database Backup & Restore Strategy:** Define and implement a clear strategy for database backups and disaster recovery.
9.  **Deployment Automation:** Fully automate deployment to production environments (e.g., Vercel, Netlify) with rollback capabilities.

### V. Tech Stack & Tools to be Used

*   **Frontend Framework:** Next.js (Pages Router)
*   **Styling:** Tailwind CSS, Shadcn UI
*   **State Management/Data Fetching:** React Query (v5)
*   **Form Management:** React Hook Form, Zod (for schema validation)
*   **Animation:** Framer Motion
*   **Database:** Supabase (PostgreSQL)
*   **Authentication:** Supabase Auth, `@supabase/ssr`
*   **Realtime:** Supabase Realtime
*   **Storage:** Supabase Storage
*   **Serverless Functions:** Supabase Edge Functions (Deno)
*   **Testing**:
    *   Unit Testing: Jest, React Testing Library
    *   Integration Testing: Jest, React Testing Library
    *   End-to-End Testing: Playwright
*   **Code Quality:** ESLint, Prettier, TypeScript
*   **Deployment:** Vercel, Netlify
*   **Error Monitoring:** Sentry (or similar)
*   **Performance Monitoring:** Datadog (or similar)
*   **Documentation:** Markdown (for project documentation)
*   **Version Control:** Git, GitHub

### VI. Next Steps (Immediate Actions)

1.  **Resolve Frontend Build Failure:** Focus on debugging and resolving the `ENOENT: no such file or directory, open 'C:\Users\Twisted\Desktop\LEAVE\frontend\.next\server\pages\_document.js'` error. This is critical before any further development or testing.
2.  **Verify Supabase Client & RLS:** Re-verify Supabase client initialization, environment variables, and RLS policies to address the "Could not find table 'public.employees' in schema cache" error.
3.  **Implement Missing Features:** Begin implementing the remaining user requirements and proposed enhancements, prioritizing core functionalities and security.
4.  **Develop Comprehensive Tests:** Write unit, integration, and E2E tests for all new and existing features.
5.  **Set up CI/CD:** Configure and automate the CI/CD pipeline for continuous testing and deployment.
