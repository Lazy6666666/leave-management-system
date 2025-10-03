-- ============================================================================
-- SEED TEST USERS - DIRECT SQL APPROACH
-- Description: Create test users directly using SQL for development/testing
-- ============================================================================

-- First, we need to allow the trigger to insert profiles
-- Add a policy for service role to insert profiles
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- CREATE TEST USERS
-- ============================================================================

-- Note: This uses the auth.users table directly
-- Passwords are hashed using crypt function

-- Helper function to create a user with profile
CREATE OR REPLACE FUNCTION create_test_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role user_role,
  p_department TEXT
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  -- Generate user ID
  v_user_id := gen_random_uuid();
  
  -- Encrypt password (Supabase uses bcrypt)
  v_encrypted_password := crypt(p_password, gen_salt('bf'));
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    aud,
    role
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    v_encrypted_password,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    'authenticated',
    'authenticated'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;
  
  -- If user already exists, get their ID
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    RAISE NOTICE 'User % already exists with ID %', p_email, v_user_id;
  ELSE
    RAISE NOTICE 'Created user % with ID %', p_email, v_user_id;
  END IF;
  
  -- Update or insert profile
  INSERT INTO profiles (id, full_name, role, department)
  VALUES (v_user_id, p_full_name, p_role, p_department)
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      department = EXCLUDED.department;
  
  RAISE NOTICE 'Updated profile for % with role %', p_email, p_role;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TEST USERS
-- ============================================================================

DO $$
DECLARE
  v_admin_id UUID;
  v_hr_id UUID;
  v_manager_id UUID;
  v_employee1_id UUID;
  v_employee2_id UUID;
  v_employee3_id UUID;
  v_current_year INTEGER;
BEGIN
  RAISE NOTICE '🚀 Creating test users...';
  
  -- Create users
  v_admin_id := create_test_user('admin@test.com', 'Test123!', 'Admin User', 'admin', 'Management');
  v_hr_id := create_test_user('hr@test.com', 'Test123!', 'HR Manager', 'hr', 'Human Resources');
  v_manager_id := create_test_user('manager@test.com', 'Test123!', 'Department Manager', 'manager', 'Engineering');
  v_employee1_id := create_test_user('employee1@test.com', 'Test123!', 'John Doe', 'employee', 'Engineering');
  v_employee2_id := create_test_user('employee2@test.com', 'Test123!', 'Jane Smith', 'employee', 'Marketing');
  v_employee3_id := create_test_user('employee3@test.com', 'Test123!', 'Bob Johnson', 'employee', 'Sales');
  
  -- Initialize leave balances for all users
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  
  RAISE NOTICE '📊 Initializing leave balances...';
  
  INSERT INTO leave_balances (employee_id, leave_type_id, allocated_days, used_days, carried_forward_days, year)
  SELECT
    p.id,
    lt.id,
    lt.default_allocation_days,
    0,
    0,
    v_current_year
  FROM profiles p
  CROSS JOIN leave_types lt
  WHERE p.id IN (v_admin_id, v_hr_id, v_manager_id, v_employee1_id, v_employee2_id, v_employee3_id)
    AND lt.is_active = true
  ON CONFLICT (employee_id, leave_type_id, year) DO UPDATE
  SET allocated_days = EXCLUDED.allocated_days;
  
  RAISE NOTICE '✅ Test users created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Test User Credentials:';
  RAISE NOTICE '  admin@test.com      | Password: Test123! | Role: admin';
  RAISE NOTICE '  hr@test.com         | Password: Test123! | Role: hr';
  RAISE NOTICE '  manager@test.com    | Password: Test123! | Role: manager';
  RAISE NOTICE '  employee1@test.com  | Password: Test123! | Role: employee';
  RAISE NOTICE '  employee2@test.com  | Password: Test123! | Role: employee';
  RAISE NOTICE '  employee3@test.com  | Password: Test123! | Role: employee';
  RAISE NOTICE '';
  RAISE NOTICE '💡 You can now login at http://localhost:3000/login';
END $$;

-- Clean up the helper function (optional)
-- DROP FUNCTION IF EXISTS create_test_user(TEXT, TEXT, TEXT, user_role, TEXT);
