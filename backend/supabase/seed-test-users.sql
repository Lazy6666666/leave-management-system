-- ============================================================================
-- SEED TEST USERS
-- Description: Create test users with different roles for development/testing
-- ============================================================================

-- Note: In production, use Supabase Auth API or Dashboard to create users
-- This script is for development/testing purposes only

-- Update existing profiles with test data and roles
-- Replace these UUIDs with actual user IDs from auth.users after signup

-- Example of how to update a profile after user signup:
-- UPDATE profiles SET
--   full_name = 'Admin User',
--   role = 'admin',
--   department = 'Management'
-- WHERE id = '<user-id-here>';

-- ============================================================================
-- TEST USER SETUP INSTRUCTIONS
-- ============================================================================

-- 1. Sign up users through the application UI or Supabase Auth:
--    - admin@test.com (password: Test123!)
--    - hr@test.com (password: Test123!)
--    - manager@test.com (password: Test123!)
--    - employee@test.com (password: Test123!)

-- 2. Get user IDs from auth.users table:
SELECT id, email FROM auth.users;

-- 3. Update profiles with appropriate roles (replace UUIDs with actual IDs):
/*
UPDATE profiles SET
  full_name = 'Admin User',
  role = 'admin',
  department = 'Management'
WHERE email = (SELECT email FROM auth.users WHERE email = 'admin@test.com');

UPDATE profiles SET
  full_name = 'HR Manager',
  role = 'hr',
  department = 'Human Resources'
WHERE id = (SELECT id FROM auth.users WHERE email = 'hr@test.com');

UPDATE profiles SET
  full_name = 'Department Manager',
  role = 'manager',
  department = 'Engineering'
WHERE id = (SELECT id FROM auth.users WHERE email = 'manager@test.com');

UPDATE profiles SET
  full_name = 'Test Employee',
  role = 'employee',
  department = 'Engineering'
WHERE id = (SELECT id FROM auth.users WHERE email = 'employee@test.com');
*/

-- ============================================================================
-- SEED DEPARTMENTS
-- ============================================================================

-- Update profiles with department information
-- Note: Departments are stored as TEXT in the profiles table

COMMENT ON COLUMN profiles.department IS 'Department name (e.g., Engineering, HR, Sales, Marketing)';

-- ============================================================================
-- INITIALIZE LEAVE BALANCES FOR TEST USERS
-- ============================================================================

-- After users are created and roles assigned, initialize their leave balances
-- This can be done by calling the initialize-leave-balances Edge Function
-- or by running this SQL:

/*
INSERT INTO leave_balances (employee_id, leave_type_id, allocated_days, used_days, carried_forward_days, year)
SELECT
  p.id,
  lt.id,
  lt.default_allocation_days,
  0,
  0,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
FROM profiles p
CROSS JOIN leave_types lt
WHERE lt.is_active = true
ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;
*/
