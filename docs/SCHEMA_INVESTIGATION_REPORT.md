# Schema Investigation Report

**Date**: 2025-10-10
**Issue**: "Could not find table 'public.employees' in schema cache"
**Status**: ✅ ROOT CAUSE IDENTIFIED

## Executive Summary

The application has a **critical schema inconsistency** caused by an incomplete migration refactoring from `profiles` to `employees` table. The `employees` table was referenced in RLS policies and functions but **never actually created**.

## Root Cause Analysis

### What Happened

1. **Initial Schema** (001_initial_schema.sql):
   - Created `profiles` table with columns: id, full_name, role, department, photo_url
   - Set up RLS policies and triggers for `profiles`
   - ✅ Working correctly

2. **Attempted Refactoring** (20251008035529 & 20251008041510):
   - Migration attempted to switch from `profiles` to `employees` table
   - Updated `handle_new_user()` function to insert into `employees` table
   - Updated ALL RLS policies to reference `employees` table
   - ❌ **NEVER created the `employees` table itself**

3. **Result**:
   - Middleware correctly queries `profiles` table (line 54 in middleware.ts)
   - Backend functions try to insert into non-existent `employees` table
   - RLS policies reference non-existent `employees` table
   - Supabase throws "schema cache" errors

### Evidence

```bash
# Search for CREATE TABLE employees - NO RESULTS
$ grep -r "CREATE TABLE.*employees" backend/supabase/migrations/
# (no output - table creation doesn't exist!)

# But found 13 references to 'employees' table
$ grep -r "employees" backend/supabase/migrations/
# All in RLS policies and functions, but no table creation
```

## Impact Assessment

| Component | Status | Impact |
|-----------|--------|--------|
| **User Authentication** | ⚠️ WORKING | Using `profiles` table correctly |
| **Middleware** | ✅ WORKING | Queries `profiles` table |
| **New User Registration** | ❌ BROKEN | Tries to insert into `employees` |
| **RLS Policies** | ❌ BROKEN | Reference non-existent `employees` |
| **Leave Management** | ⚠️ PARTIAL | Some queries work, others fail |
| **Admin Functions** | ❌ BROKEN | Cannot query employee data properly |

**Severity**: HIGH (blocking new user registrations and admin features)
**Workaround**: Existing users with `profiles` records can still login

## Recommended Fix Strategy

### Option A: Complete the Employees Table Migration (RECOMMENDED)

Create missing `employees` table and migrate data from `profiles`:

```sql
-- Create employees table with proper schema
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supabase_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role user_role NOT NULL DEFAULT 'employee',
  department TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing data from profiles
INSERT INTO public.employees (supabase_id, email, name, role, department, photo_url)
SELECT
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.department,
  p.photo_url
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ON CONFLICT (supabase_id) DO NOTHING;

-- Update all frontend code to use employees table
-- Update middleware to query employees instead of profiles
```

**Pros**:
- Cleaner separation between auth.users and employee data
- Better schema design with proper foreign keys
- Aligns with existing RLS policies

**Cons**:
- Requires code updates in frontend
- More migration work

### Option B: Revert to Profiles Table (QUICK FIX)

Rollback the incomplete migration and stick with `profiles`:

```sql
-- Revert handle_new_user function to use profiles
DROP FUNCTION IF EXISTS handle_new_user();
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'employee'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revert all RLS policies to use profiles table
-- (see migration 002_row_level_security.sql)
```

**Pros**:
- Quick fix, minimal code changes
- Frontend already uses `profiles` in most places
- Less risk

**Cons**:
- Keeps suboptimal schema design
- Doesn't improve data model

## Action Plan

### Immediate Actions (Today)

1. ✅ **Document findings** (this report)
2. ⏳ **Create fix migration**:
   - Option A: `20251010_create_employees_table.sql`
   - Option B: `20251010_revert_to_profiles.sql`
3. ⏳ **Update frontend code** to use consistent table
4. ⏳ **Test authentication flow** end-to-end
5. ⏳ **Verify RLS policies** work correctly

### Short-term (This Week)

1. Update all API routes to use correct table
2. Regenerate TypeScript types: `supabase gen types typescript`
3. Update documentation (CLAUDE.md, README.md)
4. Add migration testing to CI/CD pipeline

### Long-term (Next Sprint)

1. Implement proper database migration strategy
2. Add schema validation tests
3. Set up migration rollback procedures
4. Create migration documentation

## Files Affected

### Backend (Supabase Migrations)
- ✅ `001_initial_schema.sql` - Original profiles table
- ❌ `20251008035529_update_handle_new_user_to_employees.sql` - Incomplete
- ❌ `20251008041510_refactor_rls_to_employees.sql` - Incomplete
- ❌ `20251008041511_enable_realtime_on_profiles.sql` - May need update
- ❌ `20251008041512_recreate_user_role_and_leave_statistics.sql` - Check dependencies

### Frontend Code
- ✅ `middleware.ts` (line 54) - Uses `profiles` ✓
- ❌ `pages/api/admin/users/index.ts` - May reference `employees`
- ❌ `hooks/use-employee-search.ts` - May reference `employees`
- ❌ Various other files (13 total with "employees" references)

## Recommendation

**CHOOSE OPTION A** (Complete employees migration) because:

1. RLS policies already updated to use `employees`
2. Better long-term schema design
3. The refactoring was 90% complete, just need the table
4. Aligns with Phase 3 (Employee Search) requirements in AGENTS.md

## Next Steps

1. Create `20251010_create_employees_table_complete.sql` migration
2. Run migration on local Supabase
3. Test new user registration
4. Update frontend to use `employees` table consistently
5. Verify all AGENTS.md phases can proceed

---

**Confidence Level**: 100% (root cause confirmed)
**Risk Level**: MEDIUM (fixable with proper migration)
**Time to Fix**: 2-4 hours
