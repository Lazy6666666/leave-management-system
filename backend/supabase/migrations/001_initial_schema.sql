-- ============================================================================
-- MIGRATION: 001_initial_schema.sql
-- Description: Initial database schema for Leave Management System
-- Created: 2025-10-02
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles
CREATE TYPE user_role AS ENUM ('employee', 'manager', 'admin', 'hr');

-- Leave request status
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- Notification frequency
CREATE TYPE notification_frequency AS ENUM ('weekly', 'monthly', 'custom');

-- Notifier status
CREATE TYPE notifier_status AS ENUM ('active', 'inactive');

-- Notification delivery status
CREATE TYPE notification_delivery_status AS ENUM ('sent', 'failed', 'pending', 'retrying');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  department TEXT,
  photo_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave Types table
CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_allocation_days INTEGER NOT NULL DEFAULT 0,
  accrual_rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaves table
CREATE TABLE leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  days_count INTEGER NOT NULL,
  reason TEXT,
  status leave_status NOT NULL DEFAULT 'pending',
  approver_id UUID REFERENCES profiles(id),
  comments TEXT,
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT positive_days CHECK (days_count > 0)
);

-- Leave Balance table
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  allocated_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  carried_forward_days INTEGER NOT NULL DEFAULT 0,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(employee_id, leave_type_id, year)
);

-- Company Documents table
CREATE TABLE company_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  document_type TEXT,
  expiry_date TIMESTAMPTZ,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  storage_path TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Notifiers table
CREATE TABLE document_notifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES company_documents(id) ON DELETE CASCADE,
  notification_frequency notification_frequency NOT NULL,
  custom_frequency_days INTEGER CHECK (custom_frequency_days > 0),
  last_notification_sent TIMESTAMPTZ,
  status notifier_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, document_id)
);

-- Notification Logs table
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notifier_id UUID REFERENCES document_notifiers(id) ON DELETE SET NULL,
  document_id UUID REFERENCES company_documents(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status notification_delivery_status NOT NULL,
  result JSONB DEFAULT '{}',
  error_message TEXT
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_department ON profiles(department);

-- Leaves indexes
CREATE INDEX idx_leaves_requester_status ON leaves(requester_id, status);
CREATE INDEX idx_leaves_approver_status ON leaves(approver_id, status) WHERE approver_id IS NOT NULL;
CREATE INDEX idx_leaves_date_range ON leaves(start_date, end_date);
CREATE INDEX idx_leaves_status ON leaves(status);
CREATE INDEX idx_leaves_created_at ON leaves(created_at DESC);

-- Leave balances indexes
CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id, year);
CREATE INDEX idx_leave_balances_type ON leave_balances(leave_type_id);

-- Documents indexes
CREATE INDEX idx_documents_expiry ON company_documents(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_documents_type ON company_documents(document_type);
CREATE INDEX idx_documents_uploaded_by ON company_documents(uploaded_by);
CREATE INDEX idx_documents_is_public ON company_documents(is_public);

-- Notifiers indexes
CREATE INDEX idx_notifiers_next_check ON document_notifiers(last_notification_sent, status);
CREATE INDEX idx_notifiers_user ON document_notifiers(user_id);
CREATE INDEX idx_notifiers_document ON document_notifiers(document_id);

-- Notification logs indexes
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at DESC);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_types_updated_at BEFORE UPDATE ON leave_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaves_updated_at BEFORE UPDATE ON leaves
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_documents_updated_at BEFORE UPDATE ON company_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'employee');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to calculate available leave days
CREATE OR REPLACE FUNCTION get_available_leave_days(
  p_employee_id UUID,
  p_leave_type_id UUID,
  p_year INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_allocated INTEGER;
  v_used INTEGER;
  v_carried_forward INTEGER;
BEGIN
  SELECT 
    COALESCE(allocated_days, 0),
    COALESCE(used_days, 0),
    COALESCE(carried_forward_days, 0)
  INTO v_allocated, v_used, v_carried_forward
  FROM leave_balances
  WHERE employee_id = p_employee_id
    AND leave_type_id = p_leave_type_id
    AND year = p_year;

  RETURN COALESCE(v_allocated + v_carried_forward - v_used, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default leave types
INSERT INTO leave_types (name, description, default_allocation_days, accrual_rules) VALUES
  ('Annual Leave', 'Regular annual leave for employees', 25, '{"accrual_rate": "monthly", "max_carryover": 5}'::jsonb),
  ('Sick Leave', 'Leave for medical reasons', 10, '{"accrual_rate": "monthly", "requires_certificate": true}'::jsonb),
  ('Personal Leave', 'Personal time off', 5, '{"accrual_rate": "quarterly"}'::jsonb),
  ('Maternity Leave', 'Maternity leave for new mothers', 90, '{"accrual_rate": "once", "requires_certificate": true}'::jsonb),
  ('Paternity Leave', 'Paternity leave for new fathers', 14, '{"accrual_rate": "once"}'::jsonb),
  ('Bereavement Leave', 'Leave for family bereavement', 5, '{"accrual_rate": "as_needed"}'::jsonb);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE leaves IS 'Leave requests with approval workflow';
COMMENT ON TABLE leave_types IS 'Configurable leave types and allocation rules';
COMMENT ON TABLE leave_balances IS 'Employee leave balance tracking by year';
COMMENT ON TABLE company_documents IS 'Company documents with expiry tracking';
COMMENT ON TABLE document_notifiers IS 'Automated notification scheduling for document expiry';
COMMENT ON TABLE notification_logs IS 'Audit log for all notifications sent';
