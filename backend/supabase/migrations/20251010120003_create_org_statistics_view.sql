-- ============================================================================
-- MIGRATION: 20251009_create_org_statistics_view.sql
-- Description: Create materialized view for organizational statistics aggregation
-- Created: 2025-10-09
-- Phase: PHASE 2 - Admin Dashboard Live Intelligence & Data Visualization
-- ============================================================================

-- ============================================================================
-- DROP EXISTING VIEW IF ANY
-- ============================================================================
DROP MATERIALIZED VIEW IF EXISTS org_statistics CASCADE;

-- ============================================================================
-- CREATE MATERIALIZED VIEW FOR ORGANIZATIONAL STATISTICS
-- ============================================================================
CREATE MATERIALIZED VIEW org_statistics AS
WITH
-- Employee statistics by role
employee_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE role = 'employee' AND is_active = true) as total_employees,
    COUNT(*) FILTER (WHERE role = 'manager' AND is_active = true) as total_managers,
    COUNT(*) FILTER (WHERE role = 'hr' AND is_active = true) as total_hr,
    COUNT(*) FILTER (WHERE role = 'admin' AND is_active = true) as total_admins,
    COUNT(*) FILTER (WHERE is_active = true) as total_active_users,
    COUNT(*) FILTER (WHERE is_active = false) as total_inactive_users
  FROM employees
),

-- Department statistics
department_stats AS (
  SELECT
    department,
    COUNT(*) FILTER (WHERE is_active = true) as employee_count,
    COUNT(*) FILTER (WHERE role = 'manager' AND is_active = true) as manager_count
  FROM employees
  WHERE department IS NOT NULL
  GROUP BY department
),

-- Leave statistics for current year
current_year_leave_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending') as pending_leaves,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_leaves,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_leaves,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_leaves,
    COUNT(*) as total_leaves,
    COALESCE(SUM(days_count) FILTER (WHERE status = 'approved'), 0) as total_approved_days,
    COALESCE(AVG(days_count) FILTER (WHERE status = 'approved'), 0) as avg_leave_duration
  FROM leaves
  WHERE EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
),

-- Leave statistics by type for current year
leave_type_stats AS (
  SELECT
    lt.id as leave_type_id,
    lt.name as leave_type_name,
    COUNT(l.id) as total_requests,
    COUNT(l.id) FILTER (WHERE l.status = 'approved') as approved_requests,
    COUNT(l.id) FILTER (WHERE l.status = 'pending') as pending_requests,
    COUNT(l.id) FILTER (WHERE l.status = 'rejected') as rejected_requests,
    COALESCE(SUM(l.days_count) FILTER (WHERE l.status = 'approved'), 0) as total_days_taken,
    COALESCE(AVG(l.days_count) FILTER (WHERE l.status = 'approved'), 0) as avg_days_per_request
  FROM leave_types lt
  LEFT JOIN leaves l ON lt.id = l.leave_type_id
    AND EXTRACT(YEAR FROM l.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  WHERE lt.is_active = true
  GROUP BY lt.id, lt.name
),

-- Monthly leave trends for current year
monthly_leave_trends AS (
  SELECT
    EXTRACT(MONTH FROM start_date) as month_num,
    TO_CHAR(start_date, 'Month') as month_name,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_requests,
    COALESCE(SUM(days_count) FILTER (WHERE status = 'approved'), 0) as total_days
  FROM leaves
  WHERE EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  GROUP BY EXTRACT(MONTH FROM start_date), TO_CHAR(start_date, 'Month')
  ORDER BY month_num
),

-- Top leave requesters (for current year)
top_requesters AS (
  SELECT
    e.id as employee_id,
    e.name as full_name,
    e.department,
    e.role::text as role,
    COUNT(l.id) as total_requests,
    COALESCE(SUM(l.days_count) FILTER (WHERE l.status = 'approved'), 0) as total_days_taken
  FROM employees e
  LEFT JOIN leaves l ON e.id = l.requester_id
    AND EXTRACT(YEAR FROM l.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  WHERE e.is_active = true
  GROUP BY e.id, e.name, e.department, e.role
  HAVING COUNT(l.id) > 0
  ORDER BY total_days_taken DESC
  LIMIT 10
),

-- Department leave statistics
department_leave_stats AS (
  SELECT
    e.department,
    COUNT(l.id) as total_requests,
    COUNT(l.id) FILTER (WHERE l.status = 'approved') as approved_requests,
    COUNT(l.id) FILTER (WHERE l.status = 'pending') as pending_requests,
    COALESCE(SUM(l.days_count) FILTER (WHERE l.status = 'approved'), 0) as total_days_taken,
    COALESCE(AVG(l.days_count) FILTER (WHERE l.status = 'approved'), 0) as avg_days_per_employee
  FROM employees e
  LEFT JOIN leaves l ON e.id = l.requester_id
    AND EXTRACT(YEAR FROM l.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  WHERE e.department IS NOT NULL AND e.is_active = true
  GROUP BY e.department
),

-- Leave approval metrics
approval_metrics AS (
  SELECT
    COUNT(*) FILTER (WHERE status IN ('approved', 'rejected') AND approved_at IS NOT NULL) as total_processed,
    COUNT(*) FILTER (WHERE status = 'approved' AND approved_at IS NOT NULL) as total_approved,
    COUNT(*) FILTER (WHERE status = 'rejected' AND approved_at IS NOT NULL) as total_rejected,
    COALESCE(
      AVG(EXTRACT(EPOCH FROM (approved_at - created_at)) / 3600)
      FILTER (WHERE status IN ('approved', 'rejected') AND approved_at IS NOT NULL),
      0
    ) as avg_approval_time_hours,
    COUNT(*) FILTER (
      WHERE status = 'pending'
      AND created_at < CURRENT_TIMESTAMP - INTERVAL '48 hours'
    ) as overdue_pending_requests
  FROM leaves
  WHERE EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
)

-- Combine all statistics into a single row
SELECT
  -- Timestamp for when view was last refreshed
  CURRENT_TIMESTAMP as last_refreshed,

  -- Employee statistics
  json_build_object(
    'total_employees', es.total_employees,
    'total_managers', es.total_managers,
    'total_hr', es.total_hr,
    'total_admins', es.total_admins,
    'total_active_users', es.total_active_users,
    'total_inactive_users', es.total_inactive_users
  ) as employee_stats,

  -- Department statistics
  (SELECT json_agg(row_to_json(department_stats)) FROM department_stats) as department_stats,

  -- Current year leave statistics
  json_build_object(
    'pending_leaves', cyls.pending_leaves,
    'approved_leaves', cyls.approved_leaves,
    'rejected_leaves', cyls.rejected_leaves,
    'cancelled_leaves', cyls.cancelled_leaves,
    'total_leaves', cyls.total_leaves,
    'total_approved_days', cyls.total_approved_days,
    'avg_leave_duration', ROUND(cyls.avg_leave_duration::numeric, 2)
  ) as current_year_leave_stats,

  -- Leave type statistics
  (SELECT json_agg(
    json_build_object(
      'leave_type_id', leave_type_id,
      'leave_type_name', leave_type_name,
      'total_requests', total_requests,
      'approved_requests', approved_requests,
      'pending_requests', pending_requests,
      'rejected_requests', rejected_requests,
      'total_days_taken', total_days_taken,
      'avg_days_per_request', ROUND(avg_days_per_request::numeric, 2)
    )
  ) FROM leave_type_stats) as leave_type_stats,

  -- Monthly trends
  (SELECT json_agg(
    json_build_object(
      'month_num', month_num,
      'month_name', TRIM(month_name),
      'total_requests', total_requests,
      'approved_requests', approved_requests,
      'total_days', total_days
    ) ORDER BY month_num
  ) FROM monthly_leave_trends) as monthly_trends,

  -- Top requesters
  (SELECT json_agg(
    json_build_object(
      'employee_id', employee_id,
      'full_name', full_name,
      'department', department,
      'role', role,
      'total_requests', total_requests,
      'total_days_taken', total_days_taken
    )
  ) FROM top_requesters) as top_requesters,

  -- Department leave stats
  (SELECT json_agg(
    json_build_object(
      'department', department,
      'total_requests', total_requests,
      'approved_requests', approved_requests,
      'pending_requests', pending_requests,
      'total_days_taken', total_days_taken,
      'avg_days_per_employee', ROUND(avg_days_per_employee::numeric, 2)
    )
  ) FROM department_leave_stats) as department_leave_stats,

  -- Approval metrics
  json_build_object(
    'total_processed', am.total_processed,
    'total_approved', am.total_approved,
    'total_rejected', am.total_rejected,
    'avg_approval_time_hours', ROUND(am.avg_approval_time_hours::numeric, 2),
    'approval_rate', CASE
      WHEN am.total_processed > 0
      THEN ROUND((am.total_approved::numeric / am.total_processed * 100), 2)
      ELSE 0
    END,
    'overdue_pending_requests', am.overdue_pending_requests
  ) as approval_metrics

FROM employee_stats es
CROSS JOIN current_year_leave_stats cyls
CROSS JOIN approval_metrics am;

-- ============================================================================
-- CREATE INDEXES FOR MATERIALIZED VIEW
-- ============================================================================
CREATE UNIQUE INDEX idx_org_statistics_refresh ON org_statistics(last_refreshed);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Allow authenticated users to read the view (RLS will be applied via Edge Function)
GRANT SELECT ON org_statistics TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON MATERIALIZED VIEW org_statistics IS
'Aggregated organizational statistics for admin dashboard.
Refreshed automatically on data changes via triggers.
Contains employee stats, leave stats by type, department breakdowns,
monthly trends, and approval metrics for the current year.';

-- ============================================================================
-- INITIAL REFRESH
-- ============================================================================
REFRESH MATERIALIZED VIEW org_statistics;
