-- ============================================================================
-- MIGRATION: 20251009_create_org_statistics_triggers.sql
-- Description: Create triggers to auto-refresh org_statistics materialized view
-- Created: 2025-10-09
-- Phase: PHASE 2 - Admin Dashboard Live Intelligence & Data Visualization
-- ============================================================================

-- ============================================================================
-- FUNCTION TO REFRESH ORG STATISTICS MATERIALIZED VIEW
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_org_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh the materialized view concurrently to avoid locking
  -- Note: CONCURRENTLY requires a unique index which we created in previous migration
  REFRESH MATERIALIZED VIEW CONCURRENTLY org_statistics;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DROP EXISTING TRIGGERS IF ANY
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_refresh_org_stats_on_leave_change ON leaves;
DROP TRIGGER IF EXISTS trigger_refresh_org_stats_on_profile_change ON profiles;
DROP TRIGGER IF EXISTS trigger_refresh_org_stats_on_leave_type_change ON leave_types;

-- ============================================================================
-- CREATE TRIGGERS FOR AUTOMATIC REFRESH
-- ============================================================================

-- Trigger on leaves table: refresh when leaves are inserted, updated, or deleted
CREATE TRIGGER trigger_refresh_org_stats_on_leave_change
  AFTER INSERT OR UPDATE OR DELETE ON leaves
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_org_statistics();

-- Trigger on profiles table: refresh when profiles are inserted, updated, or deleted
-- This captures role changes, department changes, and active status changes
CREATE TRIGGER trigger_refresh_org_stats_on_profile_change
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_org_statistics();

-- Trigger on leave_types table: refresh when leave types are modified
CREATE TRIGGER trigger_refresh_org_stats_on_leave_type_change
  AFTER INSERT OR UPDATE OR DELETE ON leave_types
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_org_statistics();

-- ============================================================================
-- OPTIONAL: FUNCTION FOR MANUAL REFRESH (useful for testing or scheduled jobs)
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_org_statistics_manual()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY org_statistics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (will be restricted via RLS in Edge Function)
GRANT EXECUTE ON FUNCTION refresh_org_statistics_manual() TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION refresh_org_statistics() IS
'Trigger function to automatically refresh org_statistics materialized view
when data changes occur in leaves, profiles, or leave_types tables.
Uses CONCURRENTLY to avoid locking the view during refresh.';

COMMENT ON FUNCTION refresh_org_statistics_manual() IS
'Manual refresh function for org_statistics materialized view.
Can be called explicitly for testing or scheduled maintenance.
Uses SECURITY DEFINER to allow execution by authenticated users.';

COMMENT ON TRIGGER trigger_refresh_org_stats_on_leave_change ON leaves IS
'Auto-refresh org_statistics when leaves are created, updated, or deleted';

COMMENT ON TRIGGER trigger_refresh_org_stats_on_profile_change ON profiles IS
'Auto-refresh org_statistics when employee profiles change (role, department, active status)';

COMMENT ON TRIGGER trigger_refresh_org_stats_on_leave_type_change ON leave_types IS
'Auto-refresh org_statistics when leave types are modified';
