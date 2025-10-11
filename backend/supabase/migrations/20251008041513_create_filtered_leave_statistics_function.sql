-- ============================================================================
-- MIGRATION: 20251008041513_create_filtered_leave_statistics_function.sql
-- Description: Creates a new RPC function for filtered leave statistics
-- Created: 2025-10-08
-- ============================================================================

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
BEGIN
  -- Get the role of the user making the request
  SELECT role INTO v_user_role FROM profiles WHERE id = p_user_id;

  -- Only HR and Admin can access filtered organization-wide stats
  IF v_user_role IN ('hr', 'admin') THEN
    -- Filter counts by the provided p_role
    SELECT COUNT(*) INTO v_total_employees FROM profiles WHERE role = 'employee' AND (p_role IS NULL OR p_role = 'all' OR role = p_role);
    SELECT COUNT(*) INTO v_total_managers FROM profiles WHERE role = 'manager' AND (p_role IS NULL OR p_role = 'all' OR role = p_role);
    SELECT COUNT(*) INTO v_total_hr FROM profiles WHERE role = 'hr' AND (p_role IS NULL OR p_role = 'all' OR role = p_role);

    SELECT json_build_object(
      'total_employees', v_total_employees,
      'total_managers', v_total_managers,
      'total_hr', v_total_hr,
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
    -- Regular employees see their own stats (no role filtering for them)
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

-- Added a comment to force schema refresh
