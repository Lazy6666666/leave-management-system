-- ============================================================================
-- MIGRATION: 003_helper_functions.sql
-- Description: Additional helper functions for business logic
-- Created: 2025-10-02
-- ============================================================================

-- Function to update leave balance after approval
CREATE OR REPLACE FUNCTION update_leave_balance(
  p_employee_id UUID,
  p_leave_type_id UUID,
  p_days_used INTEGER,
  p_year INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE leave_balances
  SET used_days = used_days + p_days_used,
      updated_at = NOW()
  WHERE employee_id = p_employee_id
    AND leave_type_id = p_leave_type_id
    AND year = p_year;

  -- Create balance record if it doesn't exist
  IF NOT FOUND THEN
    INSERT INTO leave_balances (employee_id, leave_type_id, year, used_days)
    VALUES (p_employee_id, p_leave_type_id, p_year, p_days_used);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get team leave calendar
CREATE OR REPLACE FUNCTION get_team_leave_calendar(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  leave_start DATE,
  leave_end DATE,
  leave_type TEXT,
  status leave_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    l.start_date,
    l.end_date,
    lt.name,
    l.status
  FROM leaves l
  JOIN profiles p ON l.requester_id = p.id
  JOIN leave_types lt ON l.leave_type_id = lt.id
  WHERE l.start_date <= p_end_date
    AND l.end_date >= p_start_date
    AND l.status IN ('approved', 'pending')
    AND EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = p_user_id
        AND (
          p2.role IN ('hr', 'admin')
          OR (p2.role = 'manager' AND p2.department = p.department)
        )
    )
  ORDER BY l.start_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get leave statistics
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
        SELECT json_agg(json_build_object(
          'leave_type', lt.name,
          'total_requests', COUNT(l.id),
          'total_days', COALESCE(SUM(l.days_count), 0)
        ))
        FROM leave_types lt
        LEFT JOIN leaves l ON lt.id = l.leave_type_id AND l.status = 'approved' AND EXTRACT(YEAR FROM l.start_date) = p_year
        GROUP BY lt.id, lt.name
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
        SELECT json_agg(json_build_object(
          'leave_type', lt.name,
          'allocated', lb.allocated_days,
          'used', lb.used_days,
          'available', lb.allocated_days + lb.carried_forward_days - lb.used_days
        ))
        FROM leave_balances lb
        JOIN leave_types lt ON lb.leave_type_id = lt.id
        WHERE lb.employee_id = p_user_id AND lb.year = p_year
      )
    ) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to check leave conflicts
CREATE OR REPLACE FUNCTION check_leave_conflicts(
  p_employee_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_exclude_leave_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_conflict_count
  FROM leaves
  WHERE requester_id = p_employee_id
    AND status IN ('pending', 'approved')
    AND (
      (start_date <= p_end_date AND end_date >= p_start_date)
    )
    AND (p_exclude_leave_id IS NULL OR id != p_exclude_leave_id);

  RETURN v_conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent overlapping leaves
CREATE OR REPLACE FUNCTION prevent_leave_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF check_leave_conflicts(NEW.requester_id, NEW.start_date, NEW.end_date, NEW.id) THEN
    RAISE EXCEPTION 'Leave request conflicts with existing leave';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_leave_overlap
  BEFORE INSERT OR UPDATE ON leaves
  FOR EACH ROW
  EXECUTE FUNCTION prevent_leave_overlap();
