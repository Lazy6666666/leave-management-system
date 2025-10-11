-- ============================================================================
-- MIGRATION: 20251009_add_org_statistics_indexes.sql
-- Description: Add database indexes for optimal org statistics query performance
-- Created: 2025-10-09
-- Phase: PHASE 2 - Admin Dashboard Live Intelligence & Data Visualization
-- ============================================================================

-- ============================================================================
-- LEAVES TABLE INDEXES FOR STATISTICS QUERIES
-- ============================================================================

-- Index for year-based leave queries (most common filter)
-- Supports: WHERE EXTRACT(YEAR FROM start_date) = current_year
CREATE INDEX IF NOT EXISTS idx_leaves_year_start_date
  ON leaves (EXTRACT(YEAR FROM start_date), start_date);

-- Index for status and year-based queries with days_count
-- Supports: filtering by status, year, and aggregating days_count
CREATE INDEX IF NOT EXISTS idx_leaves_status_year_days
  ON leaves (status, EXTRACT(YEAR FROM start_date))
  INCLUDE (days_count);

-- Index for month and year extraction for monthly trends
-- Supports: GROUP BY EXTRACT(MONTH FROM start_date), EXTRACT(YEAR FROM start_date)
CREATE INDEX IF NOT EXISTS idx_leaves_month_year_status
  ON leaves (EXTRACT(MONTH FROM start_date), EXTRACT(YEAR FROM start_date), status);

-- Index for approval time calculations
-- Supports: calculating time between created_at and approved_at
CREATE INDEX IF NOT EXISTS idx_leaves_approval_timing
  ON leaves (status, created_at, approved_at)
  WHERE approved_at IS NOT NULL;

-- Index for pending overdue leaves
-- Supports: WHERE status = 'pending' AND created_at < threshold
CREATE INDEX IF NOT EXISTS idx_leaves_pending_created
  ON leaves (status, created_at)
  WHERE status = 'pending';

-- Index for leave type aggregations
-- Supports: JOIN with leave_types and GROUP BY leave_type_id
CREATE INDEX IF NOT EXISTS idx_leaves_type_status_year
  ON leaves (leave_type_id, status, EXTRACT(YEAR FROM start_date));

-- ============================================================================
-- EMPLOYEES TABLE INDEXES FOR EMPLOYEE STATISTICS
-- ============================================================================

-- Index for role and active status filtering
-- Supports: COUNT(*) FILTER (WHERE role = 'X' AND is_active = true)
CREATE INDEX IF NOT EXISTS idx_employees_role_active
  ON employees (role, is_active);

-- Index for department statistics
-- Supports: GROUP BY department with role and active filters
CREATE INDEX IF NOT EXISTS idx_employees_department_role_active
  ON employees (department, role, is_active)
  WHERE department IS NOT NULL;

-- Index for employee leave statistics joins
-- Supports: JOIN employees ON leaves.requester_id = employees.id
CREATE INDEX IF NOT EXISTS idx_employees_id_active_dept
  ON employees (id)
  INCLUDE (is_active, department, name, role);

-- ============================================================================
-- LEAVE_TYPES TABLE INDEXES
-- ============================================================================

-- Index for active leave types
-- Supports: WHERE is_active = true queries
CREATE INDEX IF NOT EXISTS idx_leave_types_active
  ON leave_types (is_active)
  WHERE is_active = true;

-- Index for leave type ID lookups with name
-- Supports: JOIN queries that need leave type name
CREATE INDEX IF NOT EXISTS idx_leave_types_id_name
  ON leave_types (id)
  INCLUDE (name, is_active);

-- ============================================================================
-- COMPOUND INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Index for requester leave aggregations
-- Supports: JOIN profiles with leaves for top requesters query
CREATE INDEX IF NOT EXISTS idx_leaves_requester_status_days
  ON leaves (requester_id, status, EXTRACT(YEAR FROM start_date))
  INCLUDE (days_count);

-- Index for approver statistics
-- Supports: queries involving approver_id and approval timestamps
CREATE INDEX IF NOT EXISTS idx_leaves_approver_status_time
  ON leaves (approver_id, status, approved_at)
  WHERE approver_id IS NOT NULL;

-- ============================================================================
-- STATISTICS AND MAINTENANCE
-- ============================================================================

-- Analyze tables to update query planner statistics
ANALYZE leaves;
ANALYZE employees;
ANALYZE leave_types;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_leaves_year_start_date IS
'Supports year-based leave filtering, most common query pattern in org statistics';

COMMENT ON INDEX idx_leaves_status_year_days IS
'Optimizes status and year filtering with included days_count for aggregations';

COMMENT ON INDEX idx_leaves_month_year_status IS
'Enables fast monthly trend calculations grouped by month and year';

COMMENT ON INDEX idx_leaves_approval_timing IS
'Optimizes approval time metric calculations (approved_at - created_at)';

COMMENT ON INDEX idx_leaves_pending_created IS
'Identifies overdue pending requests efficiently (partial index for pending status)';

COMMENT ON INDEX idx_leaves_type_status_year IS
'Supports leave type statistics aggregations by type, status, and year';

COMMENT ON INDEX idx_employees_role_active IS
'Optimizes employee statistics by role and active status filtering';

COMMENT ON INDEX idx_employees_department_role_active IS
'Enables fast department statistics with role and active status filters';

COMMENT ON INDEX idx_employees_id_active_dept IS
'Covering index for employee lookups including frequently accessed columns';

COMMENT ON INDEX idx_leave_types_active IS
'Partial index for active leave types, reduces index size';

COMMENT ON INDEX idx_leave_types_id_name IS
'Covering index for leave type joins, avoids table lookups';

COMMENT ON INDEX idx_leaves_requester_status_days IS
'Optimizes top requesters query with requester, status, year, and days aggregation';

COMMENT ON INDEX idx_leaves_approver_status_time IS
'Supports approver-related statistics and approval time metrics';

-- ============================================================================
-- INDEX USAGE MONITORING QUERY (for DBA reference)
-- ============================================================================

-- Use this query to monitor index usage and identify unused indexes:
--
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('leaves', 'employees', 'leave_types')
-- ORDER BY idx_scan DESC;
