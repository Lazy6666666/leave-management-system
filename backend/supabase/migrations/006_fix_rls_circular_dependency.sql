-- ============================================================================
-- MIGRATION: 006_fix_rls_circular_dependency.sql
-- Description: Fix circular dependency in RLS policies for profiles table
-- Created: 2025-10-03
-- ============================================================================

-- Drop the circular dependency policies
DROP POLICY IF EXISTS "HR and Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "HR and Admin can update profiles" ON profiles;
DROP POLICY IF EXISTS "HR and Admin can manage leave types" ON leave_types;
DROP POLICY IF EXISTS "HR and Admin can manage balances" ON leave_balances;
DROP POLICY IF EXISTS "HR and Admin can view all documents" ON company_documents;
DROP POLICY IF EXISTS "HR and Admin can manage documents" ON company_documents;
DROP POLICY IF EXISTS "HR and Admin can view notification logs" ON notification_logs;

-- Create a security definer function in public schema to get user role
-- This bypasses RLS to break the circular dependency
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- Revoke from anon and public for security
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon, public;

-- Recreate policies using the security definer function

-- HR and Admin can view all profiles
CREATE POLICY "HR and Admin can view all profiles"
  ON profiles FOR SELECT
  USING (public.get_user_role() IN ('hr', 'admin'));

-- HR and Admin can update all profiles
CREATE POLICY "HR and Admin can update profiles"
  ON profiles FOR UPDATE
  USING (public.get_user_role() IN ('hr', 'admin'));

-- HR and Admin can manage leave types
CREATE POLICY "HR and Admin can manage leave types"
  ON leave_types FOR ALL
  USING (public.get_user_role() IN ('hr', 'admin'));

-- HR and Admin can manage balances
CREATE POLICY "HR and Admin can manage balances"
  ON leave_balances FOR ALL
  USING (public.get_user_role() IN ('hr', 'admin'));

-- HR and Admin can view all documents
CREATE POLICY "HR and Admin can view all documents"
  ON company_documents FOR SELECT
  USING (public.get_user_role() IN ('hr', 'admin'));

-- HR and Admin can manage documents
CREATE POLICY "HR and Admin can manage documents"
  ON company_documents FOR ALL
  USING (public.get_user_role() IN ('hr', 'admin'));

-- HR and Admin can view notification logs
CREATE POLICY "HR and Admin can view notification logs"
  ON notification_logs FOR SELECT
  USING (public.get_user_role() IN ('hr', 'admin'));

-- Update manager and team leave policies to use the function
DROP POLICY IF EXISTS "Managers can view team leaves" ON leaves;
DROP POLICY IF EXISTS "Managers can approve team leaves" ON leaves;
DROP POLICY IF EXISTS "Managers can view team balances" ON leave_balances;

CREATE POLICY "Managers can view team leaves"
  ON leaves FOR SELECT
  USING (
    public.get_user_role() IN ('manager', 'hr', 'admin') AND
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department = p2.department
      WHERE p1.id = auth.uid() AND p2.id = leaves.requester_id
    )
  );

CREATE POLICY "Managers can approve team leaves"
  ON leaves FOR UPDATE
  USING (
    public.get_user_role() IN ('manager', 'hr', 'admin') AND
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department = p2.department
      WHERE p1.id = auth.uid() AND p2.id = leaves.requester_id
    )
  );

CREATE POLICY "Managers can view team balances"
  ON leave_balances FOR SELECT
  USING (
    public.get_user_role() IN ('manager', 'hr', 'admin') AND
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department = p2.department
      WHERE p1.id = auth.uid() AND p2.id = leave_balances.employee_id
    )
  );
