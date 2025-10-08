The project adheres to the following development conventions:

- **Type-Safety:** Uses TypeScript in strict mode. Database types are generated from the Supabase schema.
- **Code Style:** Code is formatted with Prettier and linted with ESLint.
- **UI Components:** The `shadcn/ui` library is used for building the user interface. New components should follow this style.
- **API Routes:** Backend logic is handled via API routes within `frontend/src/app/api` and Supabase Edge Functions in `backend/supabase/functions`.
- **Testing:** Integration and unit tests are written with Vitest, and Playwright is used for end-to-end tests.