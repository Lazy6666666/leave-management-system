# Scripts Documentation

This directory contains utility scripts for the Leave Management System.

## Test User Creation

### Quick Start (Recommended)

The easiest way to create test users is using the Supabase Dashboard:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `scripts/seed-test-users-direct.sql`
6. Click **Run** (or press Ctrl+Enter)

You should see success messages in the Results panel.

### Alternative Methods

#### Method 1: PowerShell Script (Windows)

```powershell
.\scripts\run-seed-users.ps1
```

This script will attempt to run the SQL file automatically or guide you through manual execution.

#### Method 2: Node.js Script (All Platforms)

```bash
npm run db:seed-users
```

**Note:** This method uses the Supabase Admin API and may encounter permission issues. If it fails, use the SQL method above.

#### Method 3: Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db execute --file scripts/seed-test-users-direct.sql --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual project reference (found in your Supabase URL).

## Test User Credentials

After running the seed script, you'll have these test users:

| Email | Password | Role | Department |
|-------|----------|------|------------|
| admin@test.com | Test123! | admin | Management |
| hr@test.com | Test123! | hr | Human Resources |
| manager@test.com | Test123! | manager | Engineering |
| employee1@test.com | Test123! | employee | Engineering |
| employee2@test.com | Test123! | employee | Marketing |
| employee3@test.com | Test123! | employee | Sales |

### What Gets Created

For each test user, the script:
1. Creates an authenticated user in `auth.users`
2. Creates a profile in `profiles` table with the specified role and department
3. Initializes leave balances for all active leave types for the current year

## Troubleshooting

### "Database error creating new user"

This error occurs when using the Admin API method. The issue is typically related to Row Level Security (RLS) policies. **Solution:** Use the SQL method via Supabase Dashboard instead.

### "User already exists"

If users already exist, the script will skip creation and update their profiles with the correct roles. This is safe to run multiple times.

### "Permission denied"

Make sure you're using the Service Role Key (not the Anon Key) in your `.env.local` file, or run the SQL directly in the Supabase Dashboard which has full permissions.

### Resetting Test Users

To completely reset and recreate test users:

1. Go to Supabase Dashboard → Authentication → Users
2. Delete the test users manually
3. Run the seed script again

Or use SQL:

```sql
-- Delete test users (run in Supabase SQL Editor)
DELETE FROM auth.users WHERE email LIKE '%@test.com';
```

## Other Scripts

### `check-unused-imports.js`
Checks for unused imports in the codebase.

### `deploy-supabase.sh`
Deploys Supabase functions to production.

### `vercel-env-setup.sh`
Sets up environment variables for Vercel deployment.

## Adding New Test Users

To add more test users, edit `scripts/seed-test-users-direct.sql` and add new calls to `create_test_user()`:

```sql
v_new_user_id := create_test_user(
  'newuser@test.com',    -- email
  'Test123!',            -- password
  'New User Name',       -- full name
  'employee',            -- role (employee, manager, hr, admin)
  'Department Name'      -- department
);
```

Don't forget to add the new user ID to the leave balances initialization section.
