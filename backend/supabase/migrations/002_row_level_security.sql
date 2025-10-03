-- ============================================================================
-- MIGRATION: 002_row_level_security.sql
-- Description: Row Level Security (RLS) policies for all tables
-- Created: 2025-10-02
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_notifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- HR and Admin can view all profiles
CREATE POLICY "HR and Admin can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('hr', 'admin')
    )
  );

-- HR and Admin can update all profiles
CREATE POLICY "HR and Admin can update profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('hr', 'admin')
    )
  );

-- ============================================================================
-- LEAVES TABLE POLICIES
-- ============================================================================

-- Employees can view their own leave requests
CREATE POLICY "Employees can view own leaves"
  ON leaves FOR SELECT
  USING (auth.uid() = requester_id);

-- Managers can view their team's leave requests
CREATE POLICY "Managers can view team leaves"
  ON leaves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department = p2.department
      WHERE p1.id = auth.uid() 
        AND p1.role IN ('manager', 'hr', 'admin')
        AND p2.id = leaves.requester_id
    )
  );

-- Employees can create their own leave requests
CREATE POLICY "Employees can create leaves"
  ON leaves FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Employees can update their own pending leaves
CREATE POLICY "Employees can update own pending leaves"
  ON leaves FOR UPDATE
  USING (auth.uid() = requester_id AND status = 'pending')
  WITH CHECK (auth.uid() = requester_id);

-- Managers can approve/reject team leaves
CREATE POLICY "Managers can approve team leaves"
  ON leaves FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department = p2.department
      WHERE p1.id = auth.uid() 
        AND p1.role IN ('manager', 'hr', 'admin')
        AND p2.id = leaves.requester_id
    )
  );

-- ============================================================================
-- LEAVE TYPES TABLE POLICIES
-- ============================================================================

-- Everyone can view active leave types
CREATE POLICY "Everyone can view leave types"
  ON leave_types FOR SELECT
  USING (is_active = true);

-- Only HR and Admin can manage leave types
CREATE POLICY "HR and Admin can manage leave types"
  ON leave_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('hr', 'admin')
    )
  );

-- ============================================================================
-- LEAVE BALANCES TABLE POLICIES
-- ============================================================================

-- Employees can view their own balances
CREATE POLICY "Employees can view own balances"
  ON leave_balances FOR SELECT
  USING (auth.uid() = employee_id);

-- Managers can view team balances
CREATE POLICY "Managers can view team balances"
  ON leave_balances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.department = p2.department
      WHERE p1.id = auth.uid() 
        AND p1.role IN ('manager', 'hr', 'admin')
        AND p2.id = leave_balances.employee_id
    )
  );

-- Only HR and Admin can manage balances
CREATE POLICY "HR and Admin can manage balances"
  ON leave_balances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('hr', 'admin')
    )
  );

-- ============================================================================
-- COMPANY DOCUMENTS TABLE POLICIES
-- ============================================================================

-- Everyone can view public documents
CREATE POLICY "Everyone can view public documents"
  ON company_documents FOR SELECT
  USING (is_public = true);

-- Users can view documents they uploaded
CREATE POLICY "Users can view own documents"
  ON company_documents FOR SELECT
  USING (auth.uid() = uploaded_by);

-- HR and Admin can view all documents
CREATE POLICY "HR and Admin can view all documents"
  ON company_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('hr', 'admin')
    )
  );

-- HR and Admin can manage documents
CREATE POLICY "HR and Admin can manage documents"
  ON company_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('hr', 'admin')
    )
  );

-- ============================================================================
-- DOCUMENT NOTIFIERS TABLE POLICIES
-- ============================================================================

-- Users can view their own notifiers
CREATE POLICY "Users can view own notifiers"
  ON document_notifiers FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage their own notifiers
CREATE POLICY "Users can manage own notifiers"
  ON document_notifiers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- NOTIFICATION LOGS TABLE POLICIES
-- ============================================================================

-- HR and Admin can view all notification logs
CREATE POLICY "HR and Admin can view notification logs"
  ON notification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('hr', 'admin')
    )
  );

-- Users can view their own notification logs
CREATE POLICY "Users can view own notification logs"
  ON notification_logs FOR SELECT
  USING (
    recipient_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );
