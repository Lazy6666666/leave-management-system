-- ============================================================================
-- MIGRATION: 005_fix_profile_creation.sql
-- Description: Fix profile creation policies and triggers
-- Created: 2025-10-03
-- Issue: Users cannot be created because profiles table has RLS but no INSERT policy
-- ============================================================================

-- Add INSERT policy for profile creation during user signup
-- This allows the trigger to create profiles when new users are created
CREATE POLICY "Allow profile creation on signup"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Alternative: More restrictive policy that only allows inserting own profile
-- CREATE POLICY "Users can insert own profile"
--   ON profiles FOR INSERT
--   WITH CHECK (auth.uid() = id);

-- Ensure the trigger function can bypass RLS properly
-- Drop and recreate with proper security context
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate the function with proper security settings
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_role user_role;
BEGIN
  -- Extract full_name from metadata, fallback to email
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );

  -- Extract role from metadata, default to employee
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'employee'::user_role
  );

  -- Insert profile
  INSERT INTO profiles (id, full_name, role, department)
  VALUES (
    NEW.id,
    v_full_name,
    v_role,
    NEW.raw_user_meta_data->>'department'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON leave_types TO authenticated, anon;

-- Function to initialize leave balances for new employees
CREATE OR REPLACE FUNCTION initialize_leave_balances(p_employee_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_year INTEGER;
BEGIN
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  -- Create leave balances for all active leave types
  INSERT INTO leave_balances (employee_id, leave_type_id, allocated_days, used_days, carried_forward_days, year)
  SELECT
    p_employee_id,
    id,
    default_allocation_days,
    0,
    0,
    v_current_year
  FROM leave_types
  WHERE is_active = true
  ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to initialize leave balances for employee %: %', p_employee_id, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to initialize balances when profile is created
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Initialize leave balances for the new employee
  PERFORM initialize_leave_balances(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_profile();

-- Add helpful comments
COMMENT ON POLICY "Allow profile creation on signup" ON profiles IS
  'Allows automatic profile creation when users sign up via the auth trigger';
COMMENT ON FUNCTION initialize_leave_balances(UUID) IS
  'Initializes leave balances for a new employee with all active leave types';
