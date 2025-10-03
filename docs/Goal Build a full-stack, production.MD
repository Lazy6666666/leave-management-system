Goal: Build a full-stack, production-grade Leave Management System web application that is ready to be shipped and used in the real world. Use Supabase as the backend (Auth + Postgres + Edge Functions + Realtime), and React + TypeScript + Next.js (App Router) for the frontend. Use shadcn/ui + Tailwind for components and styling, and make dark mode the stable/default theme on first load.

HIGH-LEVEL REQUIREMENTS
Tech stack:
- Frontend: Next.js (latest stable), React, TypeScript, Tailwind CSS, shadcn/ui, React Query (or TanStack Query), Zod for validation, testing with Vitest + React Testing Library.
- Backend: Supabase (Auth + Postgres), RLS policies, SQL migrations, Supabase Edge Functions (TypeScript) for server-side logic and cron tasks.
- CI/CD: GitHub Actions to run tests, lint, build, run migrations, and deploy Edge Functions & frontend to Vercel (or Netlify) and Supabase.
- Observability & Security: Structured logging, Sentry (error reporting), Prometheus-style metrics or simple logging for metrics, rate-limiting guidance, secrets stored in environment variables and GitHub Secrets.
- Email: Support SMTP and transactional providers (SendGrid/Mailgun). Edge Functions should abstract provider behind an interface.
- Storage: Supabase Storage for documents.
- Containerization: Dockerfiles for local dev/CI as optional.
- Linting & Formatting: ESLint, Prettier, and TypeScript strict mode.
- Accessibility: WCAG-A11Y checks, semantic HTML.
- Performance: Pagination, indexing, caching & CDNs for assets.

FUNCTIONAL REQUIREMENTS
Authentication & Profiles:
- Use Supabase Auth (email/password + magic links optional).
- Create a profiles table mapped to auth.uid with fields: id (uuid, equals auth.uid), full_name, role ENUM ['employee','manager','admin','hr'], department, photo_url, metadata JSON, created_at, updated_at.
- Ensure signup flow creates a profile row via DB trigger or Edge Function.
- Allow role assignment via a protected admin UI (only admin/HR).

Leaves:
- Table leaves: id (uuid), requester_id (profiles.id), start_date, end_date, leave_type_id, days_count, reason, status ENUM ['pending','approved','rejected','cancelled'], approver_id (profiles.id), comments, created_at, updated_at, metadata JSON.
- leave_types table: id, name, description, default_allocation_days, accrual_rules JSON.
- Implement client & server validation (Zod + Edge Functions/RLS).
- Manager/admin flows to approve/reject with comments. Multi-level approvals optional (implement with extensible structure).

Documents & Notifications:
- company_documents: id, name, document_type, expiry_date (timestamptz), uploaded_by (profiles.id), storage_path, is_public boolean, metadata JSON, created_at.
- document_notifiers: id, user_id, document_id, notification_frequency ENUM ['weekly','monthly','custom'], custom_frequency_days INT, last_notification_sent timestamptz, status ENUM ['active','inactive'].
- notification_logs: id, notifier_id, document_id, recipient_email, sent_at, status ENUM ['sent','failed'], result JSON.
- Upload documents to Supabase Storage; store path in company_documents.
- Implement an Edge Function (documentExpiryCheck) to scan document_notifiers and company_documents and send notifications according to frequency and rules.

DELIVERABLES
- Full source code for React frontend using TypeScript and shadcn components
- SQL migration files for Supabase tables and RLS policies
- Supabase Edge Functions for scheduled tasks and notifications
- Example environment variable file (.env.example)
- README with setup, structure, deployment instructions
- Example unit/integration tests for critical flows
- GitHub Actions workflows for CI/CD
- Documentation (README, CONTRIBUTING, SECURITY)

This specification provides everything needed to build a production-ready Leave Management System with modern stack and best practices.