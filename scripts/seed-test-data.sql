-- ============================================================================
-- Seed Test Data for Leave Management System
-- Run this after deploying migrations to create test users and data
-- ============================================================================

-- Note: Users must be created via Supabase Auth first, then we update their profiles
-- Use the Supabase dashboard or API to create these users:
-- 1. admin@test.com (password: Test123!)
-- 2. hr@test.com (password: Test123!)
-- 3. manager@test.com (password: Test123!)
-- 4. employee1@test.com (password: Test123!)
-- 5. employee2@test.com (password: Test123!)

-- Update profiles with roles (run this AFTER creating users via Auth)
-- Replace the UUIDs below with actual user IDs from auth.users

-- Example: Update roles for test users
-- UPDATE profiles SET role = 'admin', department = 'Administration', full_name = 'Admin User'
-- WHERE id = 'REPLACE_WITH_ADMIN_USER_ID';

-- UPDATE profiles SET role = 'hr', department = 'Human Resources', full_name = 'HR Manager'
-- WHERE id = 'REPLACE_WITH_HR_USER_ID';

-- UPDATE profiles SET role = 'manager', department = 'Engineering', full_name = 'Engineering Manager'
-- WHERE id = 'REPLACE_WITH_MANAGER_USER_ID';

-- UPDATE profiles SET role = 'employee', department = 'Engineering', full_name = 'John Doe'
-- WHERE id = 'REPLACE_WITH_EMPLOYEE1_USER_ID';

-- UPDATE profiles SET role = 'employee', department = 'Marketing', full_name = 'Jane Smith'
-- WHERE id = 'REPLACE_WITH_EMPLOYEE2_USER_ID';

-- Initialize leave balances for test employees (current year)
-- INSERT INTO leave_balances (employee_id, leave_type_id, allocated_days, used_days, year)
-- SELECT
--   p.id,
--   lt.id,
--   lt.default_allocation_days,
--   0,
--   EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
-- FROM profiles p
-- CROSS JOIN leave_types lt
-- WHERE p.role = 'employee';

-- Create sample leave requests
-- INSERT INTO leaves (requester_id, start_date, end_date, leave_type_id, days_count, reason, status)
-- VALUES
-- (
--   'REPLACE_WITH_EMPLOYEE1_USER_ID',
--   CURRENT_DATE + INTERVAL '7 days',
--   CURRENT_DATE + INTERVAL '11 days',
--   (SELECT id FROM leave_types WHERE name = 'Annual Leave'),
--   5,
--   'Family vacation',
--   'pending'
-- );

-- Create sample company document
-- INSERT INTO company_documents (name, document_type, expiry_date, uploaded_by, storage_path, is_public)
-- VALUES
-- (
--   'Company Policy 2024',
--   'policy',
--   CURRENT_DATE + INTERVAL '6 months',
--   'REPLACE_WITH_ADMIN_USER_ID',
--   'documents/company-policy-2024.pdf',
--   true
-- );

-- ============================================================================
-- Helper Queries
-- ============================================================================

-- View all profiles with roles
SELECT id, full_name, role, department, created_at FROM profiles ORDER BY role, created_at;

-- View leave balances
SELECT
  p.full_name,
  lt.name as leave_type,
  lb.allocated_days,
  lb.used_days,
  lb.allocated_days - lb.used_days as available_days,
  lb.year
FROM leave_balances lb
JOIN profiles p ON lb.employee_id = p.id
JOIN leave_types lt ON lb.leave_type_id = lt.id
ORDER BY p.full_name, lt.name;

-- View all leaves
SELECT
  p.full_name as requester,
  lt.name as leave_type,
  l.start_date,
  l.end_date,
  l.days_count,
  l.status,
  l.reason
FROM leaves l
JOIN profiles p ON l.requester_id = p.id
JOIN leave_types lt ON l.leave_type_id = lt.id
ORDER BY l.created_at DESC;
