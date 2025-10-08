When a task is completed, ensure the following:

1.  **Code Style:** Run `npm run lint` (in `frontend` or `backend` as appropriate) to ensure code adheres to ESLint rules.
2.  **Formatting:** Ensure code is formatted with Prettier (usually integrated with ESLint or IDE).
3.  **Testing:** Run `npm run test` (in `frontend`) for unit/integration tests. If applicable, run end-to-end tests with Playwright.
4.  **Type-Safety:** Ensure no TypeScript errors are present.
5.  **Build:** Run `npm run build` (in `frontend`) to verify a successful production build.
6.  **Deployment (Backend):** If backend changes involve Supabase functions or database migrations, run `npm run deploy` and `npm run db:push` respectively (in `backend`).