-- ============================================================================
-- MIGRATION: 20251008041510_refactor_rls_to_employees.sql
-- Description: Refactor RLS policies to use the employees table instead of profiles
-- Created: 2025-10-08
-- ============================================================================

-- Disable RLS on profiles table (if it exists and is enabled) and drop its policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'profiles') THEN
    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "HR and Admin can view all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "HR and Admin can update profiles" ON public.profiles;
    -- Add other policies for profiles if they exist
  END IF;
END $$;

-- Enable RLS on employees table
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- EMPLOYEES TABLE POLICIES (formerly PROFILES)
-- ============================================================================

DROP POLICY IF EXISTS "Employees can view own profile" ON public.employees;
-- Users can view their own employee profile
CREATE POLICY "Employees can view own profile"
  ON public.employees FOR SELECT
  USING (auth.uid() = supabase_id);

DROP POLICY IF EXISTS "Employees can update own profile" ON public.employees;
-- Users can update their own employee profile (except role and is_active)
CREATE POLICY "Employees can update own profile"
  ON public.employees FOR UPDATE
  USING (auth.uid() = supabase_id)
  WITH CHECK (auth.uid() = supabase_id AND role = (SELECT role FROM public.employees WHERE supabase_id = auth.uid()));

DROP POLICY IF EXISTS "HR and Admin can view all employee profiles" ON public.employees;
-- HR and Admin can view all employee profiles
CREATE POLICY "HR and Admin can view all employee profiles"
  ON public.employees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE supabase_id = auth.uid() AND role IN ('hr', 'admin')
    )
  );

DROP POLICY IF EXISTS "HR and Admin can update employee profiles" ON public.employees;
-- HR and Admin can update all employee profiles
CREATE POLICY "HR and Admin can update employee profiles"
  ON public.employees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE supabase_id = auth.uid() AND role IN ('hr', 'admin')
    )
  );

-- ============================================================================
-- LEAVES TABLE POLICIES
-- ============================================================================

-- Drop existing policies that reference profiles
DROP POLICY IF EXISTS "Employees can view own leaves" ON public.leaves;
DROP POLICY IF EXISTS "Managers can view team leaves" ON public.leaves;
DROP POLICY IF EXISTS "Employees can create leaves" ON public.leaves;
DROP POLICY IF EXISTS "Employees can update own pending leaves" ON public.leaves;
DROP POLICY IF EXISTS "Managers can approve team leaves" ON public.leaves;

-- Employees can view their own leave requests
CREATE POLICY "Employees can view own leaves"
  ON public.leaves FOR SELECT
  USING (auth.uid() = (SELECT supabase_id FROM public.employees WHERE id = requester_id));

-- Managers can view their team's leave requests
CREATE POLICY "Managers can view team leaves"
  ON public.leaves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employees p1
      JOIN public.employees p2 ON p1.department = p2.department
      WHERE p1.supabase_id = auth.uid() 
        AND p1.role IN ('manager', 'hr', 'admin')
        AND p2.id = leaves.requester_id
    )
  );

-- Employees can create their own leave requests
CREATE POLICY "Employees can create leaves"
  ON public.leaves FOR INSERT
  WITH CHECK (auth.uid() = (SELECT supabase_id FROM public.employees WHERE id = requester_id));

-- Employees can update their own pending leaves
CREATE POLICY "Employees can update own pending leaves"
  ON public.leaves FOR UPDATE
  USING (auth.uid() = (SELECT supabase_id FROM public.employees WHERE id = requester_id) AND status = 'pending')
  WITH CHECK (auth.uid() = (SELECT supabase_id FROM public.employees WHERE id = requester_id));

-- Managers can approve/reject team leaves
CREATE POLICY "Managers can approve team leaves"
  ON public.leaves FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.employees p1
      JOIN public.employees p2 ON p1.department = p2.department
      WHERE p1.supabase_id = auth.uid() 
        AND p1.role IN ('manager', 'hr', 'admin')
        AND p2.id = leaves.requester_id
    )
  );

-- ============================================================================
-- LEAVE BALANCES TABLE POLICIES
-- ============================================================================

-- Drop existing policies that reference profiles
DROP POLICY IF EXISTS "Employees can view own balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Managers can view team balances" ON public.leave_balances;
DROP POLICY IF EXISTS "HR and Admin can manage balances" ON public.leave_balances;

-- Employees can view their own balances
CREATE POLICY "Employees can view own balances"
  ON public.leave_balances FOR SELECT
  USING (auth.uid() = (SELECT supabase_id FROM public.employees WHERE id = employee_id));

-- Managers can view team balances
CREATE POLICY "Managers can view team balances"
  ON public.leave_balances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employees p1
      JOIN public.employees p2 ON p1.department = p2.department
      WHERE p1.supabase_id = auth.uid() 
        AND p1.role IN ('manager', 'hr', 'admin')
        AND p2.id = leave_balances.employee_id
    )
  );

-- Only HR and Admin can manage balances
CREATE POLICY "HR and Admin can manage balances"
  ON public.leave_balances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE supabase_id = auth.uid() AND role IN ('hr', 'admin')
    )
  );

-- ============================================================================
-- COMPANY DOCUMENTS TABLE POLICIES
-- ============================================================================

-- Drop existing policies that reference profiles
DROP POLICY IF EXISTS "Users can view own documents" ON public.company_documents;
DROP POLICY IF EXISTS "HR and Admin can view all documents" ON public.company_documents;
DROP POLICY IF EXISTS "HR and Admin can manage documents" ON public.company_documents;

-- Users can view documents they uploaded
CREATE POLICY "Users can view own documents"
  ON public.company_documents FOR SELECT
  USING (auth.uid() = (SELECT supabase_id FROM public.employees WHERE id = uploaded_by));

-- HR and Admin can view all documents
CREATE POLICY "HR and Admin can view all documents"
  ON public.company_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE supabase_id = auth.uid() AND role IN ('hr', 'admin')
    )
  );

-- HR and Admin can manage documents
CREATE POLICY "HR and Admin can manage documents"
  ON public.company_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE supabase_id = auth.uid() AND role IN ('hr', 'admin')
    )
  );

-- ============================================================================
-- DOCUMENT NOTIFIERS TABLE POLICIES
-- ============================================================================

-- Drop existing policies that reference profiles
DROP POLICY IF EXISTS "Users can view own notifiers" ON public.document_notifiers;
DROP POLICY IF EXISTS "Users can manage own notifiers" ON public.document_notifiers;

-- Users can view their own notifiers
CREATE POLICY "Users can view own notifiers"
  ON public.document_notifiers FOR SELECT
  USING (auth.uid() = (SELECT supabase_id FROM public.employees WHERE id = user_id));

-- Users can manage their own notifiers
CREATE POLICY "Users can manage own notifiers"
  ON public.document_notifiers FOR ALL
  USING (auth.uid() = (SELECT supabase_id FROM public.employees WHERE id = user_id))
  WITH CHECK (auth.uid() = (SELECT supabase_id FROM public.employees WHERE id = user_id));

-- ============================================================================
-- NOTIFICATION LOGS TABLE POLICIES
-- ============================================================================

-- Drop existing policies that reference profiles
DROP POLICY IF EXISTS "HR and Admin can view notification logs" ON public.notification_logs;
DROP POLICY IF EXISTS "Users can view own notification logs" ON public.notification_logs;

-- HR and Admin can view all notification logs
CREATE POLICY "HR and Admin can view notification logs"
  ON public.notification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE supabase_id = auth.uid() AND role IN ('hr', 'admin')
    )
  );

-- Users can view their own notification logs
CREATE POLICY "Users can view own notification logs"
  ON public.notification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE supabase_id = auth.uid() AND email = recipient_email
    )
  );
