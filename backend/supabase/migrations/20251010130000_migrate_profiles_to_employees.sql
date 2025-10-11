-- ============================================================================
-- MIGRATION: 20251010130000_migrate_profiles_to_employees.sql
-- Description: Complete migration from profiles to employees table
-- Phase: Critical - Updates all foreign keys, RLS policies, and functions
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP OLD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Drop old foreign keys pointing to profiles (must do this FIRST before updating data)
ALTER TABLE leaves DROP CONSTRAINT IF EXISTS leaves_requester_id_fkey;
ALTER TABLE leaves DROP CONSTRAINT IF EXISTS leaves_approver_id_fkey;
ALTER TABLE leave_balances DROP CONSTRAINT IF EXISTS leave_balances_employee_id_fkey;
ALTER TABLE company_documents DROP CONSTRAINT IF EXISTS company_documents_uploaded_by_fkey;
ALTER TABLE document_notifiers DROP CONSTRAINT IF EXISTS document_notifiers_user_id_fkey;

-- ============================================================================
-- STEP 2: UPDATE FOREIGN KEY DATA (profiles.id → employees.id)
-- ============================================================================

-- Update leaves table - requester_id and approver_id
UPDATE leaves l
SET requester_id = e.id
FROM employees e
WHERE l.requester_id = e.supabase_id;

UPDATE leaves l
SET approver_id = e.id
FROM employees e
WHERE l.approver_id = e.supabase_id AND l.approver_id IS NOT NULL;

-- Update leave_balances table - employee_id
UPDATE leave_balances lb
SET employee_id = e.id
FROM employees e
WHERE lb.employee_id = e.supabase_id;

-- Update company_documents table - uploaded_by
UPDATE company_documents cd
SET uploaded_by = e.id
FROM employees e
WHERE cd.uploaded_by = e.supabase_id;

-- Update document_notifiers table - user_id
UPDATE document_notifiers dn
SET user_id = e.id
FROM employees e
WHERE dn.user_id = e.supabase_id;

-- ============================================================================
-- STEP 3: ADD NEW FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add new foreign keys pointing to employees
ALTER TABLE leaves
  ADD CONSTRAINT leaves_requester_id_fkey
  FOREIGN KEY (requester_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE leaves
  ADD CONSTRAINT leaves_approver_id_fkey
  FOREIGN KEY (approver_id) REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE leave_balances
  ADD CONSTRAINT leave_balances_employee_id_fkey
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE company_documents
  ADD CONSTRAINT company_documents_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE document_notifiers
  ADD CONSTRAINT document_notifiers_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 2: UPDATE RLS POLICIES TO USE EMPLOYEES
-- ============================================================================

-- LEAVES TABLE POLICIES
DROP POLICY IF EXISTS "Managers can view team leaves" ON leaves;
CREATE POLICY "Managers can view team leaves"
  ON leaves FOR SELECT
  USING (
    (get_user_role() = ANY (ARRAY['manager'::text, 'hr'::text, 'admin'::text]))
    AND (EXISTS (
      SELECT 1
      FROM employees e1
      JOIN employees e2 ON e1.department = e2.department
      WHERE e1.supabase_id = auth.uid()
        AND e2.id = leaves.requester_id
    ))
  );

DROP POLICY IF EXISTS "Managers can approve team leaves" ON leaves;
CREATE POLICY "Managers can approve team leaves"
  ON leaves FOR UPDATE
  USING (
    (get_user_role() = ANY (ARRAY['manager'::text, 'hr'::text, 'admin'::text]))
    AND (EXISTS (
      SELECT 1
      FROM employees e1
      JOIN employees e2 ON e1.department = e2.department
      WHERE e1.supabase_id = auth.uid()
        AND e2.id = leaves.requester_id
    ))
  );

-- LEAVE BALANCES TABLE POLICIES
DROP POLICY IF EXISTS "Managers can view team balances" ON leave_balances;
CREATE POLICY "Managers can view team balances"
  ON leave_balances FOR SELECT
  USING (
    (get_user_role() = ANY (ARRAY['manager'::text, 'hr'::text, 'admin'::text]))
    AND (EXISTS (
      SELECT 1
      FROM employees e1
      JOIN employees e2 ON e1.department = e2.department
      WHERE e1.supabase_id = auth.uid()
        AND e2.id = leave_balances.employee_id
    ))
  );

-- ============================================================================
-- STEP 3: UPDATE FUNCTIONS TO USE EMPLOYEES
-- ============================================================================

-- Update get_user_role function
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.employees WHERE supabase_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Update get_leave_statistics function
CREATE OR REPLACE FUNCTION get_leave_statistics(
  p_user_id UUID,
  p_year INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_role user_role;
  v_by_leave_type JSON;
BEGIN
  -- Get user role from employees
  SELECT role INTO v_role FROM employees WHERE id = p_user_id;

  -- Build statistics based on role
  IF v_role IN ('hr', 'admin') THEN
    -- Admin/HR sees organization-wide stats
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_by_leave_type
    FROM (
      SELECT
        lt.name as leave_type,
        COUNT(l.id) as total_requests,
        COALESCE(SUM(l.days_count), 0) as total_days
      FROM leave_types lt
      LEFT JOIN leaves l ON lt.id = l.leave_type_id
        AND l.status = 'approved'
        AND EXTRACT(YEAR FROM l.start_date) = p_year
      GROUP BY lt.id, lt.name
    ) t;

    SELECT json_build_object(
      'total_employees', (SELECT COUNT(*) FROM employees WHERE role = 'employee'),
      'total_leaves_pending', (SELECT COUNT(*) FROM leaves WHERE status = 'pending'),
      'total_leaves_approved', (SELECT COUNT(*) FROM leaves WHERE status = 'approved' AND EXTRACT(YEAR FROM start_date) = p_year),
      'total_days_taken', (SELECT COALESCE(SUM(days_count), 0) FROM leaves WHERE status = 'approved' AND EXTRACT(YEAR FROM start_date) = p_year),
      'by_leave_type', v_by_leave_type
    ) INTO v_result;
  ELSE
    -- Regular employees see their own stats
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_by_leave_type
    FROM (
      SELECT
        lt.name as leave_type,
        lb.allocated_days as allocated,
        lb.used_days as used,
        (lb.allocated_days + lb.carried_forward_days - lb.used_days) as available
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.employee_id = p_user_id AND lb.year = p_year
    ) t;

    SELECT json_build_object(
      'total_requests', (SELECT COUNT(*) FROM leaves WHERE requester_id = p_user_id AND EXTRACT(YEAR FROM start_date) = p_year),
      'pending_requests', (SELECT COUNT(*) FROM leaves WHERE requester_id = p_user_id AND status = 'pending'),
      'approved_requests', (SELECT COUNT(*) FROM leaves WHERE requester_id = p_user_id AND status = 'approved' AND EXTRACT(YEAR FROM start_date) = p_year),
      'total_days_taken', (SELECT COALESCE(SUM(days_count), 0) FROM leaves WHERE requester_id = p_user_id AND status = 'approved' AND EXTRACT(YEAR FROM start_date) = p_year),
      'balances', v_by_leave_type
    ) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_filtered_leave_statistics function
CREATE OR REPLACE FUNCTION get_filtered_leave_statistics(
  p_user_id UUID,
  p_year INTEGER,
  p_role TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_user_role user_role;
  v_total_employees INTEGER;
  v_total_managers INTEGER;
  v_total_hr INTEGER;
  v_by_leave_type JSON;
BEGIN
  -- Get the role of the user making the request from employees
  SELECT role INTO v_user_role FROM employees WHERE id = p_user_id;

  -- Only HR and Admin can access filtered organization-wide stats
  IF v_user_role IN ('hr', 'admin') THEN
    -- Filter counts by the provided p_role
    SELECT COUNT(*) INTO v_total_employees FROM employees WHERE role = 'employee' AND (p_role IS NULL OR p_role = 'all' OR role::text = p_role);
    SELECT COUNT(*) INTO v_total_managers FROM employees WHERE role = 'manager' AND (p_role IS NULL OR p_role = 'all' OR role::text = p_role);
    SELECT COUNT(*) INTO v_total_hr FROM employees WHERE role = 'hr' AND (p_role IS NULL OR p_role = 'all' OR role::text = p_role);

    -- Get by_leave_type data with guaranteed array return
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_by_leave_type
    FROM (
      SELECT
        lt.name as leave_type,
        COUNT(l.id) as total_requests,
        COALESCE(SUM(l.days_count), 0) as total_days
      FROM leave_types lt
      LEFT JOIN leaves l ON lt.id = l.leave_type_id
        AND l.status = 'approved'
        AND EXTRACT(YEAR FROM l.start_date) = p_year
      GROUP BY lt.id, lt.name
    ) t;

    SELECT json_build_object(
      'total_employees', v_total_employees,
      'total_managers', v_total_managers,
      'total_hr', v_total_hr,
      'total_leaves_pending', (SELECT COUNT(*) FROM leaves WHERE status = 'pending'),
      'total_leaves_approved', (SELECT COUNT(*) FROM leaves WHERE status = 'approved' AND EXTRACT(YEAR FROM start_date) = p_year),
      'total_days_taken', (SELECT COALESCE(SUM(days_count), 0) FROM leaves WHERE status = 'approved' AND EXTRACT(YEAR FROM start_date) = p_year),
      'by_leave_type', v_by_leave_type
    ) INTO v_result;
  ELSE
    -- Regular employees see their own stats (no role filtering for them) with guaranteed array return
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_by_leave_type
    FROM (
      SELECT
        lt.name as leave_type,
        lb.allocated_days as allocated,
        lb.used_days as used,
        (lb.allocated_days + lb.carried_forward_days - lb.used_days) as available
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.employee_id = p_user_id AND lb.year = p_year
    ) t;

    SELECT json_build_object(
      'total_requests', (SELECT COUNT(*) FROM leaves WHERE requester_id = p_user_id AND EXTRACT(YEAR FROM start_date) = p_year),
      'pending_requests', (SELECT COUNT(*) FROM leaves WHERE requester_id = p_user_id AND status = 'pending'),
      'approved_requests', (SELECT COUNT(*) FROM leaves WHERE requester_id = p_user_id AND status = 'approved' AND EXTRACT(YEAR FROM start_date) = p_year),
      'total_days_taken', (SELECT COALESCE(SUM(days_count), 0) FROM leaves WHERE requester_id = p_user_id AND status = 'approved' AND EXTRACT(YEAR FROM start_date) = p_year),
      'balances', v_by_leave_type
    ) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_team_leave_calendar function (drop first to avoid return type conflict)
DROP FUNCTION IF EXISTS get_team_leave_calendar(UUID, DATE, DATE);
CREATE OR REPLACE FUNCTION get_team_leave_calendar(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  start_date DATE,
  end_date DATE,
  name TEXT,
  status leave_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name as full_name,
    l.start_date,
    l.end_date,
    lt.name,
    l.status
  FROM leaves l
  JOIN employees e ON l.requester_id = e.id
  JOIN leave_types lt ON l.leave_type_id = lt.id
  WHERE l.start_date <= p_end_date
    AND l.end_date >= p_start_date
    AND l.status IN ('approved', 'pending')
    AND EXISTS (
      SELECT 1 FROM employees e2
      WHERE e2.id = p_user_id
        AND (
          e2.role IN ('hr', 'admin')
          OR (e2.role = 'manager' AND e2.department = e.department)
        )
    )
  ORDER BY l.start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: ADD COMMENTS AND DEPRECATION NOTICES
-- ============================================================================

COMMENT ON TABLE profiles IS 'DEPRECATED: Use employees table instead. Kept for backward compatibility only.';
COMMENT ON TABLE employees IS 'Primary employee data table with authentication linkage. Replaces profiles table.';

-- ============================================================================
-- VERIFICATION QUERIES (commented out, for manual testing)
-- ============================================================================

-- Verify foreign keys are updated:
-- SELECT
--   tc.table_name,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND ccu.table_name IN ('employees')
-- ORDER BY tc.table_name;
