Create a PostgreSQL function for Supabase that retrieves a user's profile information by their email. The function should:

1. Be named `get_user_profile_with_email`
2. Accept a single parameter: `user_email` (text)
3. Return a table with these columns:
   - id (uuid)
   - email (text)
   - full_name (text)
   - role (text)
   - department (text)
   - photo_url (text)
   - created_at (timestamptz)
4. Join the `auth.users` table with `public.profiles` table
5. Include proper security definitions (SECURITY DEFINER)
6. Grant EXECUTE permissions to 'authenticated' and 'service_role' roles
7. Add comments explaining the function's purpose and parameters

The function should be optimized for performance and follow PostgreSQL best practices. Provide the complete SQL statement ready to be executed in the Supabase SQL Editor.