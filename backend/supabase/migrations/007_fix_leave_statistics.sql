-- ============================================================================
-- MIGRATION: 007_fix_leave_statistics.sql
-- Description: Fix nested aggregate function error in get_leave_statistics
-- Created: 2025-10-03
-- ============================================================================

-- Drop and recreate the function with fixed aggregate nesting
CREATE OR REPLACE FUNCTION get_leave_statistics(
  p_user_id UUID,
  p_year INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_role user_role;
BEGIN
  -- Get user role
  SELECT role INTO v_role FROM profiles WHERE id = p_user_id;

  -- Build statistics based on role
  IF v_role IN ('hr', 'admin') THEN
    -- Admin/HR sees organization-wide stats
    SELECT json_build_object(
      'total_employees', (SELECT COUNT(*) FROM profiles WHERE role = 'employee'),
      'total_leaves_pending', (SELECT COUNT(*) FROM leaves WHERE status = 'pending'),
      'total_leaves_approved', (SELECT COUNT(*) FROM leaves WHERE status = 'approved' AND EXTRACT(YEAR FROM start_date) = p_year),
      'total_days_taken', (SELECT COALESCE(SUM(days_count), 0) FROM leaves WHERE status = 'approved' AND EXTRACT(YEAR FROM start_date) = p_year),
      'by_leave_type', (
        SELECT json_agg(row_to_json(t))
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
        ) t
      )
    ) INTO v_result;
  ELSE
    -- Regular employees see their own stats
    SELECT json_build_object(
      'total_requests', (SELECT COUNT(*) FROM leaves WHERE requester_id = p_user_id AND EXTRACT(YEAR FROM start_date) = p_year),
      'pending_requests', (SELECT COUNT(*) FROM leaves WHERE requester_id = p_user_id AND status = 'pending'),
      'approved_requests', (SELECT COUNT(*) FROM leaves WHERE requester_id = p_user_id AND status = 'approved' AND EXTRACT(YEAR FROM start_date) = p_year),
      'total_days_taken', (SELECT COALESCE(SUM(days_count), 0) FROM leaves WHERE requester_id = p_user_id AND status = 'approved' AND EXTRACT(YEAR FROM start_date) = p_year),
      'balances', (
        SELECT json_agg(row_to_json(t))
        FROM (
          SELECT
            lt.name as leave_type,
            lb.allocated_days as allocated,
            lb.used_days as used,
            (lb.allocated_days + lb.carried_forward_days - lb.used_days) as available
          FROM leave_balances lb
          JOIN leave_types lt ON lb.leave_type_id = lt.id
          WHERE lb.employee_id = p_user_id AND lb.year = p_year
        ) t
      )
    ) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
