# Backend Architecture & API Design

**Leave Management System - Production-Ready Backend Specifications**

**Last Updated:** 2025-10-02
**Version:** 1.0.0
**Backend Stack:** Supabase (PostgreSQL, Auth, Edge Functions, Storage, Realtime)

---

## Table of Contents

1. [Database Schema](#1-database-schema)
2. [Row Level Security (RLS) Policies](#2-row-level-security-rls-policies)
3. [API Endpoints](#3-api-endpoints)
4. [Edge Functions](#4-edge-functions)
5. [Business Logic](#5-business-logic)
6. [Performance Optimization](#6-performance-optimization)
7. [Security Implementation](#7-security-implementation)
8. [External Integrations](#8-external-integrations)
9. [TypeScript Interfaces](#9-typescript-interfaces)
10. [Zod Validation Schemas](#10-zod-validation-schemas)

---

## 1. Database Schema

### 1.1 Complete SQL Migrations

```sql
-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles
CREATE TYPE user_role AS ENUM ('employee', 'manager', 'admin', 'hr');

-- Leave request status
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- Notification frequency
CREATE TYPE notification_frequency AS ENUM ('weekly', 'monthly', 'custom');

-- Notification status
CREATE TYPE notifier_status AS ENUM ('active', 'inactive');

-- Notification delivery status
CREATE TYPE notification_delivery_status AS ENUM ('sent', 'failed', 'pending', 'retrying');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    department TEXT,
    manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    photo_url TEXT,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT,
    hire_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT no_self_manager CHECK (id != manager_id)
);

-- Leave types configuration
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    code TEXT NOT NULL UNIQUE,
    default_allocation_days INTEGER NOT NULL DEFAULT 0,
    max_carryover_days INTEGER DEFAULT 0,
    requires_approval BOOLEAN NOT NULL DEFAULT true,
    accrual_rules JSONB DEFAULT '{
        "accrual_type": "annual",
        "accrual_rate": 0,
        "prorate_first_year": true
    }'::jsonb,
    color_code TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT positive_allocation CHECK (default_allocation_days >= 0),
    CONSTRAINT positive_carryover CHECK (max_carryover_days >= 0)
);

-- Leave balances per user
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    allocated_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    used_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    pending_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    carryover_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    available_days DECIMAL(5,2) GENERATED ALWAYS AS (
        allocated_days + carryover_days - used_days - pending_days
    ) STORED,
    year INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, leave_type_id, year),
    CONSTRAINT positive_days CHECK (allocated_days >= 0 AND used_days >= 0 AND pending_days >= 0 AND carryover_days >= 0),
    CONSTRAINT valid_year CHECK (year >= 2020 AND year <= 2100)
);

-- Leave requests
CREATE TABLE leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count DECIMAL(5,2) NOT NULL,
    reason TEXT,
    status leave_status NOT NULL DEFAULT 'pending',
    approver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    comments TEXT,
    rejection_reason TEXT,
    attachment_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT positive_days CHECK (days_count > 0),
    CONSTRAINT valid_status_transition CHECK (
        CASE
            WHEN status = 'approved' THEN approver_id IS NOT NULL
            WHEN status = 'rejected' THEN approver_id IS NOT NULL
            ELSE true
        END
    )
);

-- Public holidays configuration
CREATE TABLE public_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    year INTEGER NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    country_code TEXT DEFAULT 'AE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(date, country_code),
    CONSTRAINT valid_year CHECK (year >= 2020 AND year <= 2100)
);

-- Company documents
CREATE TABLE company_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    document_type TEXT NOT NULL,
    description TEXT,
    expiry_date TIMESTAMPTZ,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    parent_document_id UUID REFERENCES company_documents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT positive_file_size CHECK (file_size > 0),
    CONSTRAINT valid_storage_path CHECK (storage_path ~ '^documents/.*')
);

-- Document notifiers
CREATE TABLE document_notifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES company_documents(id) ON DELETE CASCADE,
    notification_frequency notification_frequency NOT NULL DEFAULT 'monthly',
    custom_frequency_days INTEGER,
    advance_notice_days INTEGER NOT NULL DEFAULT 30,
    last_notification_sent TIMESTAMPTZ,
    next_notification_due TIMESTAMPTZ,
    status notifier_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, document_id),
    CONSTRAINT valid_custom_frequency CHECK (
        (notification_frequency = 'custom' AND custom_frequency_days > 0) OR
        (notification_frequency != 'custom')
    ),
    CONSTRAINT positive_advance_notice CHECK (advance_notice_days > 0)
);

-- Notification logs
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notifier_id UUID REFERENCES document_notifiers(id) ON DELETE SET NULL,
    document_id UUID REFERENCES company_documents(id) ON DELETE SET NULL,
    leave_id UUID REFERENCES leaves(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status notification_delivery_status NOT NULL DEFAULT 'pending',
    delivery_attempts INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    result JSONB DEFAULT '{}'::jsonb,

    -- Constraints
    CONSTRAINT valid_notification_type CHECK (notification_type IN (
        'leave_request',
        'leave_approved',
        'leave_rejected',
        'document_expiry',
        'leave_balance_low',
        'system_notification'
    ))
);

-- Audit logs for compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT'))
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON profiles(role) WHERE is_active = true;
CREATE INDEX idx_profiles_department ON profiles(department) WHERE is_active = true;
CREATE INDEX idx_profiles_manager_id ON profiles(manager_id) WHERE manager_id IS NOT NULL;
CREATE INDEX idx_profiles_email ON profiles(email);

-- Leave balances indexes
CREATE INDEX idx_leave_balances_user_year ON leave_balances(user_id, year);
CREATE INDEX idx_leave_balances_type ON leave_balances(leave_type_id);

-- Leaves indexes
CREATE INDEX idx_leaves_requester_id ON leaves(requester_id);
CREATE INDEX idx_leaves_status ON leaves(status);
CREATE INDEX idx_leaves_date_range ON leaves(start_date, end_date);
CREATE INDEX idx_leaves_approver_id ON leaves(approver_id) WHERE approver_id IS NOT NULL;
CREATE INDEX idx_leaves_created_at ON leaves(created_at DESC);
CREATE INDEX idx_leaves_pending_approval ON leaves(status, created_at) WHERE status = 'pending';

-- Public holidays indexes
CREATE INDEX idx_public_holidays_date ON public_holidays(date);
CREATE INDEX idx_public_holidays_year ON public_holidays(year);

-- Documents indexes
CREATE INDEX idx_company_documents_type ON company_documents(document_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_company_documents_expiry ON company_documents(expiry_date) WHERE expiry_date IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_company_documents_uploaded_by ON company_documents(uploaded_by);
CREATE INDEX idx_company_documents_tags ON company_documents USING GIN(tags);

-- Document notifiers indexes
CREATE INDEX idx_document_notifiers_user ON document_notifiers(user_id) WHERE status = 'active';
CREATE INDEX idx_document_notifiers_document ON document_notifiers(document_id) WHERE status = 'active';
CREATE INDEX idx_document_notifiers_next_due ON document_notifiers(next_notification_due) WHERE status = 'active';

-- Notification logs indexes
CREATE INDEX idx_notification_logs_recipient ON notification_logs(recipient_id, sent_at DESC);
CREATE INDEX idx_notification_logs_status ON notification_logs(status, sent_at);
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type, sent_at DESC);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, created_at DESC);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate working days between dates (excluding weekends and public holidays)
CREATE OR REPLACE FUNCTION calculate_working_days(
    start_date DATE,
    end_date DATE,
    country_code TEXT DEFAULT 'AE'
)
RETURNS DECIMAL AS $$
DECLARE
    working_days DECIMAL := 0;
    current_date DATE := start_date;
    day_of_week INTEGER;
BEGIN
    WHILE current_date <= end_date LOOP
        day_of_week := EXTRACT(DOW FROM current_date);

        -- Check if it's not a weekend (0 = Sunday, 6 = Saturday)
        IF day_of_week != 0 AND day_of_week != 6 THEN
            -- Check if it's not a public holiday
            IF NOT EXISTS (
                SELECT 1 FROM public_holidays
                WHERE date = current_date
                AND public_holidays.country_code = calculate_working_days.country_code
            ) THEN
                working_days := working_days + 1;
            END IF;
        END IF;

        current_date := current_date + 1;
    END LOOP;

    RETURN working_days;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update leave balance when leave is approved/rejected
CREATE OR REPLACE FUNCTION update_leave_balance_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    balance_year INTEGER;
BEGIN
    balance_year := EXTRACT(YEAR FROM NEW.start_date);

    -- When leave is approved
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        UPDATE leave_balances
        SET
            used_days = used_days + NEW.days_count,
            pending_days = pending_days - NEW.days_count,
            updated_at = NOW()
        WHERE user_id = NEW.requester_id
          AND leave_type_id = NEW.leave_type_id
          AND year = balance_year;

    -- When leave is rejected
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        UPDATE leave_balances
        SET
            pending_days = pending_days - NEW.days_count,
            updated_at = NOW()
        WHERE user_id = NEW.requester_id
          AND leave_type_id = NEW.leave_type_id
          AND year = balance_year;

    -- When leave is cancelled
    ELSIF NEW.status = 'cancelled' THEN
        IF OLD.status = 'approved' THEN
            UPDATE leave_balances
            SET
                used_days = used_days - NEW.days_count,
                updated_at = NOW()
            WHERE user_id = NEW.requester_id
              AND leave_type_id = NEW.leave_type_id
              AND year = balance_year;
        ELSIF OLD.status = 'pending' THEN
            UPDATE leave_balances
            SET
                pending_days = pending_days - NEW.days_count,
                updated_at = NOW()
            WHERE user_id = NEW.requester_id
              AND leave_type_id = NEW.leave_type_id
              AND year = balance_year;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment pending days when leave is created
CREATE OR REPLACE FUNCTION increment_pending_days_on_leave_creation()
RETURNS TRIGGER AS $$
DECLARE
    balance_year INTEGER;
BEGIN
    balance_year := EXTRACT(YEAR FROM NEW.start_date);

    IF NEW.status = 'pending' THEN
        UPDATE leave_balances
        SET
            pending_days = pending_days + NEW.days_count,
            updated_at = NOW()
        WHERE user_id = NEW.requester_id
          AND leave_type_id = NEW.leave_type_id
          AND year = balance_year;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has sufficient leave balance
CREATE OR REPLACE FUNCTION check_leave_balance(
    p_user_id UUID,
    p_leave_type_id UUID,
    p_days_count DECIMAL,
    p_year INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    available DECIMAL;
BEGIN
    SELECT available_days INTO available
    FROM leave_balances
    WHERE user_id = p_user_id
      AND leave_type_id = p_leave_type_id
      AND year = p_year;

    RETURN available >= p_days_count;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize leave balances for new user
CREATE OR REPLACE FUNCTION initialize_user_leave_balances(p_user_id UUID, p_year INTEGER)
RETURNS VOID AS $$
BEGIN
    INSERT INTO leave_balances (user_id, leave_type_id, allocated_days, year)
    SELECT
        p_user_id,
        id,
        default_allocation_days,
        p_year
    FROM leave_types
    WHERE is_active = true
    ON CONFLICT (user_id, leave_type_id, year) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate next notification due date
CREATE OR REPLACE FUNCTION calculate_next_notification_due(
    p_document_expiry TIMESTAMPTZ,
    p_frequency notification_frequency,
    p_custom_days INTEGER,
    p_advance_notice INTEGER
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    next_due TIMESTAMPTZ;
    days_interval INTEGER;
BEGIN
    CASE p_frequency
        WHEN 'weekly' THEN days_interval := 7;
        WHEN 'monthly' THEN days_interval := 30;
        WHEN 'custom' THEN days_interval := p_custom_days;
    END CASE;

    next_due := p_document_expiry - (p_advance_notice || ' days')::INTERVAL;

    RETURN next_due;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_types_updated_at BEFORE UPDATE ON leave_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaves_updated_at BEFORE UPDATE ON leaves
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_documents_updated_at BEFORE UPDATE ON company_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_notifiers_updated_at BEFORE UPDATE ON document_notifiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for leave balance updates
CREATE TRIGGER leave_status_change_trigger
    AFTER UPDATE OF status ON leaves
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_leave_balance_on_status_change();

CREATE TRIGGER leave_creation_trigger
    AFTER INSERT ON leaves
    FOR EACH ROW
    EXECUTE FUNCTION increment_pending_days_on_leave_creation();

-- Trigger to initialize leave balances for new users
CREATE OR REPLACE FUNCTION on_profile_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM initialize_user_leave_balances(NEW.id, EXTRACT(YEAR FROM NOW())::INTEGER);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_creation_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION on_profile_created();
```

---

## 2. Row Level Security (RLS) Policies

### 2.1 Enable RLS on All Tables

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_notifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

### 2.2 Profiles Table Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        role = (SELECT role FROM profiles WHERE id = auth.uid()) -- Cannot change own role
    );

-- Managers can view their team members
CREATE POLICY "Managers can view team members"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'admin', 'hr')
        )
        OR
        manager_id = auth.uid()
    );

-- HR and Admin can view all profiles
CREATE POLICY "HR and Admin can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'hr')
        )
    );

-- Only HR and Admin can insert/update profiles (role assignment)
CREATE POLICY "HR and Admin can manage profiles"
    ON profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'hr')
        )
    );
```

### 2.3 Leave Types Policies

```sql
-- Everyone can view active leave types
CREATE POLICY "All authenticated users can view active leave types"
    ON leave_types FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = true);

-- Only HR and Admin can manage leave types
CREATE POLICY "HR and Admin can manage leave types"
    ON leave_types FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'hr')
        )
    );
```

### 2.4 Leave Balances Policies

```sql
-- Users can view their own balances
CREATE POLICY "Users can view own balances"
    ON leave_balances FOR SELECT
    USING (auth.uid() = user_id);

-- Managers can view team balances
CREATE POLICY "Managers can view team balances"
    ON leave_balances FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = leave_balances.user_id
            AND manager_id = auth.uid()
        )
    );

-- HR and Admin can view all balances
CREATE POLICY "HR and Admin can view all balances"
    ON leave_balances FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'hr')
        )
    );

-- Only system (service role) can update balances
-- Balances are managed through triggers and Edge Functions
```

### 2.5 Leaves Policies

```sql
-- Users can view their own leave requests
CREATE POLICY "Users can view own leaves"
    ON leaves FOR SELECT
    USING (auth.uid() = requester_id);

-- Users can create their own leave requests
CREATE POLICY "Users can create own leaves"
    ON leaves FOR INSERT
    WITH CHECK (auth.uid() = requester_id AND status = 'pending');

-- Users can update their own pending leaves
CREATE POLICY "Users can update own pending leaves"
    ON leaves FOR UPDATE
    USING (auth.uid() = requester_id AND status = 'pending')
    WITH CHECK (auth.uid() = requester_id AND status IN ('pending', 'cancelled'));

-- Managers can view team leaves
CREATE POLICY "Managers can view team leaves"
    ON leaves FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = leaves.requester_id
            AND manager_id = auth.uid()
        )
    );

-- Managers can approve/reject team leaves
CREATE POLICY "Managers can approve team leaves"
    ON leaves FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = leaves.requester_id
            AND p.manager_id = auth.uid()
            AND auth.uid() IN (
                SELECT id FROM profiles WHERE role IN ('manager', 'admin', 'hr')
            )
        )
        AND status = 'pending'
    )
    WITH CHECK (status IN ('approved', 'rejected'));

-- HR and Admin can view all leaves
CREATE POLICY "HR and Admin can view all leaves"
    ON leaves FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'hr')
        )
    );

-- HR and Admin can manage all leaves
CREATE POLICY "HR and Admin can manage all leaves"
    ON leaves FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'hr')
        )
    );
```

### 2.6 Public Holidays Policies

```sql
-- Everyone can view public holidays
CREATE POLICY "All authenticated users can view holidays"
    ON public_holidays FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only HR and Admin can manage holidays
CREATE POLICY "HR and Admin can manage holidays"
    ON public_holidays FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'hr')
        )
    );
```

### 2.7 Company Documents Policies

```sql
-- Users can view public documents
CREATE POLICY "Users can view public documents"
    ON company_documents FOR SELECT
    USING (
        auth.role() = 'authenticated'
        AND is_public = true
        AND deleted_at IS NULL
    );

-- Users can view their own uploaded documents
CREATE POLICY "Users can view own documents"
    ON company_documents FOR SELECT
    USING (
        auth.uid() = uploaded_by
        AND deleted_at IS NULL
    );

-- Users can upload documents
CREATE POLICY "Users can upload documents"
    ON company_documents FOR INSERT
    WITH CHECK (auth.uid() = uploaded_by);

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
    ON company_documents FOR UPDATE
    USING (auth.uid() = uploaded_by AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = uploaded_by);

-- Users can soft delete their own documents
CREATE POLICY "Users can delete own documents"
    ON company_documents FOR UPDATE
    USING (auth.uid() = uploaded_by)
    WITH CHECK (deleted_at IS NOT NULL);

-- HR and Admin can view all documents
CREATE POLICY "HR and Admin can view all documents"
    ON company_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'hr')
        )
        AND deleted_at IS NULL
    );

-- HR and Admin can manage all documents
CREATE POLICY "HR and Admin can manage all documents"
    ON company_documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'hr')
        )
    );
```

### 2.8 Document Notifiers Policies

```sql
-- Users can manage their own notifiers
CREATE POLICY "Users can manage own notifiers"
    ON document_notifiers FOR ALL
    USING (auth.uid() = user_id);

-- HR and Admin can manage all notifiers
CREATE POLICY "HR and Admin can manage all notifiers"
    ON document_notifiers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'hr')
        )
    );
```

### 2.9 Notification Logs Policies

```sql
-- Users can view their own notification logs
CREATE POLICY "Users can view own notification logs"
    ON notification_logs FOR SELECT
    USING (auth.uid() = recipient_id);

-- HR and Admin can view all notification logs
CREATE POLICY "HR and Admin can view all logs"
    ON notification_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'hr')
        )
    );
```

### 2.10 Audit Logs Policies

```sql
-- Only Admin can view audit logs
CREATE POLICY "Admin can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );
```

---

## 3. API Endpoints

### 3.1 Authentication Endpoints

#### POST /auth/v1/signup
Register a new user account.

**Request:**
```typescript
{
  email: string;
  password: string;
  full_name: string;
  department?: string;
}
```

**Response:**
```typescript
{
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}
```

**Business Logic:**
- Validates email format and uniqueness
- Enforces password complexity (min 8 chars, uppercase, lowercase, number)
- Creates profile automatically
- Initializes leave balances for current year
- Sends verification email

#### POST /auth/v1/token
Login with email and password.

**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
    role: string;
  };
}
```

#### PATCH /rest/v1/rpc/update_user_role
Update user role (Admin/HR only).

**Request:**
```typescript
{
  user_id: string;
  new_role: 'employee' | 'manager' | 'admin' | 'hr';
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Security:**
- Requires admin or HR role
- Prevents self-role modification
- Logs role changes in audit_logs

### 3.2 Leave Management Endpoints

#### POST /rest/v1/leaves
Create a leave request.

**Request:**
```typescript
{
  leave_type_id: string;
  start_date: string; // ISO date
  end_date: string;   // ISO date
  reason?: string;
  attachment_urls?: string[];
}
```

**Response:**
```typescript
{
  id: string;
  requester_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days_count: number;
  status: 'pending';
  created_at: string;
}
```

**Business Logic:**
- Validates date range (end >= start)
- Calculates working days excluding weekends/holidays
- Checks sufficient leave balance
- Updates pending_days in leave_balances
- Sends notification to manager

#### GET /rest/v1/leaves
List leave requests with filters.

**Query Parameters:**
```typescript
{
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  user_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}
```

**Response:**
```typescript
{
  data: Array<{
    id: string;
    requester: {
      id: string;
      full_name: string;
      department: string;
    };
    leave_type: {
      id: string;
      name: string;
      color_code: string;
    };
    start_date: string;
    end_date: string;
    days_count: number;
    status: string;
    approver?: {
      id: string;
      full_name: string;
    };
    created_at: string;
  }>;
  count: number;
}
```

#### PATCH /rest/v1/leaves/:id
Update leave request (user: pending only, manager: approve/reject).

**Request:**
```typescript
{
  status?: 'cancelled' | 'approved' | 'rejected';
  comments?: string;
  rejection_reason?: string;
}
```

**Response:**
```typescript
{
  id: string;
  status: string;
  approver_id?: string;
  approved_at?: string;
  comments?: string;
}
```

**Business Logic:**
- Employee: Can only cancel pending requests
- Manager: Can approve/reject team requests
- Triggers balance updates via database triggers
- Sends notification to requester

#### GET /rest/v1/leave_balances
Get user leave balances.

**Query Parameters:**
```typescript
{
  user_id?: string;
  year?: number;
}
```

**Response:**
```typescript
{
  data: Array<{
    leave_type: {
      name: string;
      code: string;
      color_code: string;
    };
    allocated_days: number;
    used_days: number;
    pending_days: number;
    carryover_days: number;
    available_days: number;
  }>;
}
```

### 3.3 Document Management Endpoints

#### POST /rest/v1/company_documents
Upload a company document.

**Request (multipart/form-data):**
```typescript
{
  file: File;
  name: string;
  document_type: string;
  description?: string;
  expiry_date?: string;
  is_public: boolean;
  tags?: string[];
}
```

**Response:**
```typescript
{
  id: string;
  name: string;
  storage_path: string;
  public_url?: string;
  created_at: string;
}
```

**Business Logic:**
- Validates file type and size (max 10MB)
- Uploads to Supabase Storage: `documents/{user_id}/{uuid}_{filename}`
- Creates database record
- Scans for malware (future enhancement)

#### GET /rest/v1/company_documents
List documents with filters.

**Query Parameters:**
```typescript
{
  document_type?: string;
  is_public?: boolean;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}
```

**Response:**
```typescript
{
  data: Array<{
    id: string;
    name: string;
    document_type: string;
    expiry_date?: string;
    storage_path: string;
    public_url?: string;
    uploaded_by: {
      id: string;
      full_name: string;
    };
    tags: string[];
    created_at: string;
  }>;
  count: number;
}
```

#### DELETE /rest/v1/company_documents/:id
Soft delete a document.

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Business Logic:**
- Soft delete (sets deleted_at timestamp)
- Maintains storage file for audit
- Requires uploader or admin role

#### POST /rest/v1/document_notifiers
Create document expiry notifier.

**Request:**
```typescript
{
  document_id: string;
  notification_frequency: 'weekly' | 'monthly' | 'custom';
  custom_frequency_days?: number;
  advance_notice_days: number;
}
```

**Response:**
```typescript
{
  id: string;
  next_notification_due: string;
  status: 'active';
  created_at: string;
}
```

### 3.4 Notification Endpoints

#### GET /rest/v1/notification_logs
Get notification history.

**Query Parameters:**
```typescript
{
  recipient_id?: string;
  notification_type?: string;
  status?: 'sent' | 'failed' | 'pending';
  limit?: number;
  offset?: number;
}
```

**Response:**
```typescript
{
  data: Array<{
    id: string;
    subject: string;
    notification_type: string;
    sent_at: string;
    status: string;
    delivery_attempts: number;
    error_message?: string;
  }>;
  count: number;
}
```

---

## 4. Edge Functions

### 4.1 documentExpiryCheck (Scheduled)

**Trigger:** Cron job (daily at 9:00 AM UTC)

**Purpose:** Check for documents nearing expiry and send notifications.

**Implementation:**
```typescript
// supabase/functions/document-expiry-check/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find active notifiers due for notification
    const { data: notifiers, error } = await supabase
      .from('document_notifiers')
      .select(`
        id,
        user_id,
        document_id,
        notification_frequency,
        custom_frequency_days,
        advance_notice_days,
        last_notification_sent,
        profiles!user_id (
          email,
          full_name
        ),
        company_documents!document_id (
          name,
          expiry_date,
          document_type
        )
      `)
      .eq('status', 'active')
      .lte('next_notification_due', new Date().toISOString());

    if (error) throw error;

    // Send notifications
    for (const notifier of notifiers || []) {
      const document = notifier.company_documents;
      const user = notifier.profiles;

      // Send email notification
      await fetch(
        `${supabaseUrl}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            to: user.email,
            subject: `Document Expiry Alert: ${document.name}`,
            template: 'document-expiry',
            data: {
              recipientName: user.full_name,
              documentName: document.name,
              documentType: document.document_type,
              expiryDate: new Date(document.expiry_date).toLocaleDateString(),
              daysRemaining: Math.ceil(
                (new Date(document.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              ),
            },
          }),
        }
      );

      // Calculate next notification due date
      const nextDue = calculateNextNotificationDue(
        notifier.notification_frequency,
        notifier.custom_frequency_days,
        document.expiry_date
      );

      // Update notifier
      await supabase
        .from('document_notifiers')
        .update({
          last_notification_sent: new Date().toISOString(),
          next_notification_due: nextDue,
        })
        .eq('id', notifier.id);

      // Log notification
      await supabase.from('notification_logs').insert({
        notifier_id: notifier.id,
        document_id: notifier.document_id,
        recipient_email: user.email,
        recipient_id: notifier.user_id,
        subject: `Document Expiry Alert: ${document.name}`,
        notification_type: 'document_expiry',
        status: 'sent',
        delivery_attempts: 1,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: notifiers?.length || 0
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function calculateNextNotificationDue(
  frequency: string,
  customDays: number | null,
  expiryDate: string
): string {
  const expiry = new Date(expiryDate);
  const now = new Date();

  let intervalDays: number;
  switch (frequency) {
    case 'weekly':
      intervalDays = 7;
      break;
    case 'monthly':
      intervalDays = 30;
      break;
    case 'custom':
      intervalDays = customDays || 30;
      break;
    default:
      intervalDays = 30;
  }

  const nextDue = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  return nextDue < expiry ? nextDue.toISOString() : expiry.toISOString();
}
```

### 4.2 sendEmail

**Purpose:** Send emails via SendGrid/Mailgun with template support.

**Implementation:**
```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface EmailRequest {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, any>;
  cc?: string[];
  bcc?: string[];
}

serve(async (req) => {
  try {
    const { to, subject, template, data, cc, bcc }: EmailRequest = await req.json();

    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')!;
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@leavems.com';
    const fromName = Deno.env.get('FROM_NAME') || 'Leave Management System';

    // Load email template
    const templateContent = await loadTemplate(template, data);

    // Send via SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sendgridApiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
            cc: cc?.map(email => ({ email })),
            bcc: bcc?.map(email => ({ email })),
            subject,
          },
        ],
        from: { email: fromEmail, name: fromName },
        content: [
          {
            type: 'text/html',
            value: templateContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.statusText}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Email send error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function loadTemplate(templateName: string, data: Record<string, any>): Promise<string> {
  // Email templates with variable substitution
  const templates: Record<string, string> = {
    'document-expiry': `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .alert { background: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Document Expiry Alert</h1>
          </div>
          <div class="content">
            <p>Dear ${data.recipientName},</p>
            <div class="alert">
              <p><strong>Document:</strong> ${data.documentName}</p>
              <p><strong>Type:</strong> ${data.documentType}</p>
              <p><strong>Expiry Date:</strong> ${data.expiryDate}</p>
              <p><strong>Days Remaining:</strong> ${data.daysRemaining} days</p>
            </div>
            <p>Please take necessary action to renew or update this document before it expires.</p>
            <a href="${Deno.env.get('APP_URL')}/documents" class="button">View Documents</a>
          </div>
        </div>
      </body>
      </html>
    `,
    'leave-request': `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .info-box { background: white; border: 1px solid #E5E7EB; padding: 15px; margin: 20px 0; border-radius: 6px; }
          .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .button.reject { background: #EF4444; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Leave Request</h1>
          </div>
          <div class="content">
            <p>Dear ${data.managerName},</p>
            <p>${data.employeeName} has submitted a leave request that requires your approval.</p>
            <div class="info-box">
              <p><strong>Leave Type:</strong> ${data.leaveType}</p>
              <p><strong>Start Date:</strong> ${data.startDate}</p>
              <p><strong>End Date:</strong> ${data.endDate}</p>
              <p><strong>Duration:</strong> ${data.daysCount} days</p>
              <p><strong>Reason:</strong> ${data.reason || 'Not specified'}</p>
            </div>
            <div style="text-align: center;">
              <a href="${Deno.env.get('APP_URL')}/leaves/pending" class="button">Review Request</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    'leave-approved': `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .success { background: #ECFDF5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Leave Request Approved</h1>
          </div>
          <div class="content">
            <p>Dear ${data.employeeName},</p>
            <div class="success">
              <p>Your leave request has been approved by ${data.approverName}.</p>
            </div>
            <p><strong>Leave Type:</strong> ${data.leaveType}</p>
            <p><strong>Period:</strong> ${data.startDate} to ${data.endDate}</p>
            <p><strong>Duration:</strong> ${data.daysCount} days</p>
            ${data.comments ? `<p><strong>Comments:</strong> ${data.comments}</p>` : ''}
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return templates[templateName] || templates['document-expiry'];
}
```

### 4.3 calculateLeaveBalance

**Purpose:** Calculate and update leave balances (called by triggers or manually).

**Implementation:**
```typescript
// supabase/functions/calculate-leave-balance/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface BalanceRequest {
  user_id: string;
  year: number;
  leave_type_id?: string;
}

serve(async (req) => {
  try {
    const { user_id, year, leave_type_id }: BalanceRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user hire date
    const { data: profile } = await supabase
      .from('profiles')
      .select('hire_date')
      .eq('id', user_id)
      .single();

    // Get leave types
    const leaveTypesQuery = supabase
      .from('leave_types')
      .select('*')
      .eq('is_active', true);

    if (leave_type_id) {
      leaveTypesQuery.eq('id', leave_type_id);
    }

    const { data: leaveTypes } = await leaveTypesQuery;

    const balances = [];

    for (const leaveType of leaveTypes || []) {
      // Calculate allocated days based on accrual rules
      let allocatedDays = leaveType.default_allocation_days;

      const accrualRules = leaveType.accrual_rules as any;
      if (accrualRules.prorate_first_year && profile?.hire_date) {
        const hireDate = new Date(profile.hire_date);
        const hireYear = hireDate.getFullYear();

        if (hireYear === year) {
          // Prorate based on months worked
          const monthsWorked = 12 - hireDate.getMonth();
          allocatedDays = Math.floor((allocatedDays / 12) * monthsWorked);
        }
      }

      // Get current balance
      const { data: currentBalance } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', user_id)
        .eq('leave_type_id', leaveType.id)
        .eq('year', year)
        .single();

      if (currentBalance) {
        // Update existing balance
        await supabase
          .from('leave_balances')
          .update({ allocated_days: allocatedDays })
          .eq('id', currentBalance.id);
      } else {
        // Create new balance
        await supabase.from('leave_balances').insert({
          user_id,
          leave_type_id: leaveType.id,
          allocated_days: allocatedDays,
          year,
        });
      }

      balances.push({
        leave_type_id: leaveType.id,
        allocated_days: allocatedDays,
      });
    }

    return new Response(
      JSON.stringify({ success: true, balances }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### 4.4 validateLeaveRequest

**Purpose:** Validate leave request before creation (business rules).

**Implementation:**
```typescript
// supabase/functions/validate-leave-request/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ValidationRequest {
  user_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
}

serve(async (req) => {
  try {
    const { user_id, leave_type_id, start_date, end_date }: ValidationRequest =
      await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate date range
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (endDate < startDate) {
      errors.push('End date must be after start date');
    }

    // 2. Check for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      errors.push('Cannot request leave for past dates');
    }

    // 3. Calculate working days
    const { data: workingDaysData } = await supabase.rpc('calculate_working_days', {
      start_date,
      end_date,
      country_code: 'AE',
    });

    const daysCount = workingDaysData || 0;

    if (daysCount === 0) {
      errors.push('Leave period contains no working days');
    }

    // 4. Check leave balance
    const year = startDate.getFullYear();
    const { data: balance } = await supabase
      .from('leave_balances')
      .select('available_days')
      .eq('user_id', user_id)
      .eq('leave_type_id', leave_type_id)
      .eq('year', year)
      .single();

    if (!balance || balance.available_days < daysCount) {
      errors.push(
        `Insufficient leave balance. Available: ${balance?.available_days || 0} days, Requested: ${daysCount} days`
      );
    }

    // 5. Check for overlapping leave requests
    const { data: overlapping } = await supabase
      .from('leaves')
      .select('id, start_date, end_date, status')
      .eq('requester_id', user_id)
      .in('status', ['pending', 'approved'])
      .or(`start_date.lte.${end_date},end_date.gte.${start_date}`);

    if (overlapping && overlapping.length > 0) {
      errors.push('You have overlapping leave requests for this period');
    }

    // 6. Check blackout periods (if configured)
    // This would check against a blackout_periods table
    // For now, we'll skip this

    // 7. Warnings for advance notice
    const daysDifference = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDifference < 7) {
      warnings.push('Less than 7 days advance notice. Approval may be delayed.');
    }

    return new Response(
      JSON.stringify({
        valid: errors.length === 0,
        errors,
        warnings,
        days_count: daysCount,
        available_balance: balance?.available_days || 0,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 5. Business Logic

### 5.1 Leave Balance Calculation

**Accrual Types:**
- **Annual:** Full allocation at year start
- **Monthly:** Pro-rated monthly accrual
- **Per-Pay-Period:** Accrual per pay period

**Carryover Rules:**
- Maximum carryover days per leave type
- Expiry of unused carryover (e.g., by end of Q1)
- Automatic carryover calculation on year rollover

**Implementation:**
```typescript
export interface AccrualRules {
  accrual_type: 'annual' | 'monthly' | 'per_pay_period';
  accrual_rate: number; // Days per period
  prorate_first_year: boolean;
  max_accrual_cap?: number; // Maximum accumulated balance
}

export function calculateAccruedDays(
  rules: AccrualRules,
  hireDate: Date,
  currentDate: Date,
  defaultAllocation: number
): number {
  const hireYear = hireDate.getFullYear();
  const currentYear = currentDate.getFullYear();

  if (rules.accrual_type === 'annual') {
    if (currentYear === hireYear && rules.prorate_first_year) {
      const monthsWorked = 12 - hireDate.getMonth();
      return Math.floor((defaultAllocation / 12) * monthsWorked);
    }
    return defaultAllocation;
  }

  if (rules.accrual_type === 'monthly') {
    const monthsWorked =
      (currentYear - hireYear) * 12 +
      (currentDate.getMonth() - hireDate.getMonth());

    const accrued = monthsWorked * rules.accrual_rate;
    return Math.min(accrued, rules.max_accrual_cap || Infinity);
  }

  // Add per_pay_period logic as needed
  return defaultAllocation;
}

export function calculateCarryover(
  currentBalance: number,
  maxCarryover: number
): number {
  return Math.min(currentBalance, maxCarryover);
}
```

### 5.2 Leave Request Validation

**Validation Rules:**
1. Date range validation (end >= start)
2. Working days calculation (excludes weekends + public holidays)
3. Sufficient balance check
4. No overlapping requests
5. Advance notice requirements
6. Blackout period restrictions
7. Manager availability check

**Implementation:**
```typescript
export interface LeaveValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  days_count: number;
  available_balance: number;
}

export async function validateLeaveRequest(
  userId: string,
  leaveTypeId: string,
  startDate: Date,
  endDate: Date,
  supabase: SupabaseClient
): Promise<LeaveValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Call Edge Function for comprehensive validation
  const { data, error } = await supabase.functions.invoke('validate-leave-request', {
    body: {
      user_id: userId,
      leave_type_id: leaveTypeId,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    },
  });

  if (error) {
    errors.push('Validation service unavailable');
    return {
      valid: false,
      errors,
      warnings,
      days_count: 0,
      available_balance: 0,
    };
  }

  return data;
}
```

### 5.3 Document Expiry Logic

**Notification Schedule:**
- Calculate next notification based on frequency
- Advance notice period (e.g., 30 days before expiry)
- Stop notifications after expiry date
- Retry failed notifications with exponential backoff

**Implementation:**
```typescript
export interface NotificationSchedule {
  next_due: Date;
  should_send: boolean;
  days_until_expiry: number;
}

export function calculateNotificationSchedule(
  expiryDate: Date,
  frequency: 'weekly' | 'monthly' | 'custom',
  customDays: number | null,
  advanceNoticeDays: number,
  lastSent: Date | null
): NotificationSchedule {
  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Don't send if already expired
  if (daysUntilExpiry < 0) {
    return {
      next_due: expiryDate,
      should_send: false,
      days_until_expiry: daysUntilExpiry,
    };
  }

  // Determine interval in days
  let intervalDays: number;
  switch (frequency) {
    case 'weekly':
      intervalDays = 7;
      break;
    case 'monthly':
      intervalDays = 30;
      break;
    case 'custom':
      intervalDays = customDays || 30;
      break;
  }

  // Calculate next due date
  const nextDue = lastSent
    ? new Date(lastSent.getTime() + intervalDays * 24 * 60 * 60 * 1000)
    : new Date(expiryDate.getTime() - advanceNoticeDays * 24 * 60 * 60 * 1000);

  return {
    next_due: nextDue,
    should_send: now >= nextDue && daysUntilExpiry > 0,
    days_until_expiry: daysUntilExpiry,
  };
}
```

### 5.4 Role-Based Access Control

**Role Hierarchy:**
- **employee:** Basic user, can manage own leaves
- **manager:** Can approve team leaves, view team data
- **hr:** Can manage all leaves, configure system
- **admin:** Full system access, user management

**Access Matrix:**
```typescript
export type UserRole = 'employee' | 'manager' | 'admin' | 'hr';

export interface PermissionMatrix {
  [resource: string]: {
    [action: string]: UserRole[];
  };
}

export const PERMISSIONS: PermissionMatrix = {
  leaves: {
    create: ['employee', 'manager', 'admin', 'hr'],
    view_own: ['employee', 'manager', 'admin', 'hr'],
    view_team: ['manager', 'admin', 'hr'],
    view_all: ['admin', 'hr'],
    approve: ['manager', 'admin', 'hr'],
    reject: ['manager', 'admin', 'hr'],
    delete: ['admin', 'hr'],
  },
  documents: {
    upload: ['employee', 'manager', 'admin', 'hr'],
    view_public: ['employee', 'manager', 'admin', 'hr'],
    view_private: ['admin', 'hr'],
    delete_own: ['employee', 'manager', 'admin', 'hr'],
    delete_any: ['admin', 'hr'],
  },
  users: {
    view_own: ['employee', 'manager', 'admin', 'hr'],
    view_all: ['admin', 'hr'],
    update_own: ['employee', 'manager', 'admin', 'hr'],
    update_role: ['admin', 'hr'],
    deactivate: ['admin'],
  },
  leave_types: {
    view: ['employee', 'manager', 'admin', 'hr'],
    manage: ['admin', 'hr'],
  },
};

export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: string
): boolean {
  const resourcePermissions = PERMISSIONS[resource];
  if (!resourcePermissions) return false;

  const actionRoles = resourcePermissions[action];
  if (!actionRoles) return false;

  return actionRoles.includes(userRole);
}
```

---

## 6. Performance Optimization

### 6.1 Database Indexes Strategy

**Primary Indexes:**
- `idx_leaves_requester_id` - Fast user leave lookups
- `idx_leaves_pending_approval` - Manager dashboard queries
- `idx_leave_balances_user_year` - Balance calculations
- `idx_company_documents_expiry` - Document expiry checks
- `idx_document_notifiers_next_due` - Notification scheduling

**Composite Indexes:**
```sql
CREATE INDEX idx_leaves_status_created ON leaves(status, created_at DESC);
CREATE INDEX idx_leaves_date_status ON leaves(start_date, end_date, status);
```

### 6.2 Query Optimization

**Use Materialized Views for Complex Queries:**
```sql
-- Materialized view for manager dashboard
CREATE MATERIALIZED VIEW mv_team_leave_summary AS
SELECT
    p.manager_id,
    COUNT(*) FILTER (WHERE l.status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE l.status = 'approved' AND l.start_date <= CURRENT_DATE AND l.end_date >= CURRENT_DATE) as on_leave_count,
    COUNT(DISTINCT l.requester_id) as team_size
FROM leaves l
JOIN profiles p ON l.requester_id = p.id
WHERE p.manager_id IS NOT NULL
GROUP BY p.manager_id;

CREATE UNIQUE INDEX ON mv_team_leave_summary(manager_id);

-- Refresh daily
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_team_leave_summary;
```

**Pagination:**
```typescript
// Cursor-based pagination for large datasets
export async function getLeavesPaginated(
  supabase: SupabaseClient,
  cursor?: string,
  limit: number = 50
) {
  let query = supabase
    .from('leaves')
    .select('*, requester:profiles!requester_id(*), leave_type:leave_types(*)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  return {
    data,
    next_cursor: data && data.length === limit ? data[data.length - 1].created_at : null,
  };
}
```

### 6.3 Caching Strategy

**Redis Caching:**
```typescript
import { createClient } from 'redis';

const redis = createClient({
  url: Deno.env.get('REDIS_URL'),
});

export async function getCachedLeaveBalance(
  userId: string,
  year: number
): Promise<LeaveBalance[] | null> {
  const cacheKey = `leave_balance:${userId}:${year}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  return null;
}

export async function setCachedLeaveBalance(
  userId: string,
  year: number,
  balances: LeaveBalance[]
): Promise<void> {
  const cacheKey = `leave_balance:${userId}:${year}`;
  await redis.setEx(
    cacheKey,
    3600, // 1 hour TTL
    JSON.stringify(balances)
  );
}

// Invalidate cache on balance update
export async function invalidateLeaveBalanceCache(
  userId: string,
  year: number
): Promise<void> {
  const cacheKey = `leave_balance:${userId}:${year}`;
  await redis.del(cacheKey);
}
```

### 6.4 Rate Limiting

**Implement rate limiting for API endpoints:**
```typescript
import { Ratelimit } from 'https://esm.sh/@upstash/ratelimit@0.4.3';
import { Redis } from 'https://esm.sh/@upstash/redis@1.20.1';

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
});

// Different rate limits for different operations
const ratelimiters = {
  // 10 requests per 10 seconds for leave creation
  leaveCreation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
  }),
  // 100 requests per minute for read operations
  readOperations: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
  }),
  // 50 requests per hour for document uploads
  documentUpload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 h'),
  }),
};

export async function checkRateLimit(
  operation: keyof typeof ratelimiters,
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  const { success, remaining } = await ratelimiters[operation].limit(identifier);
  return { success, remaining };
}
```

---

## 7. Security Implementation

### 7.1 Input Sanitization

**Zod Schemas for Validation:**
```typescript
import { z } from 'zod';

export const createLeaveRequestSchema = z.object({
  leave_type_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(500).optional(),
  attachment_urls: z.array(z.string().url()).max(5).optional(),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: 'End date must be after start date' }
);

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100),
  department: z.string().max(100).optional(),
  phone_number: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
}).strict(); // Prevent extra fields

export const documentUploadSchema = z.object({
  name: z.string().min(1).max(255),
  document_type: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  expiry_date: z.string().datetime().optional(),
  is_public: z.boolean(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});
```

### 7.2 File Upload Security

**Secure File Upload Implementation:**
```typescript
export interface FileUploadConfig {
  maxFileSize: number; // bytes
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

export const DOCUMENT_UPLOAD_CONFIG: FileUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.xlsx'],
};

export async function validateFileUpload(
  file: File,
  config: FileUploadConfig = DOCUMENT_UPLOAD_CONFIG
): Promise<{ valid: boolean; error?: string }> {
  // Check file size
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${config.maxFileSize / 1024 / 1024}MB)`,
    };
  }

  // Check MIME type
  if (!config.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!config.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} is not allowed`,
    };
  }

  // Additional: Verify file content matches MIME type
  // This would require reading file headers

  return { valid: true };
}

export function generateSecureFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomUUID().split('-')[0];
  const extension = originalName.split('.').pop();
  const sanitizedName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50);

  return `${userId}/${timestamp}_${randomString}_${sanitizedName}`;
}
```

### 7.3 JWT Validation

**Custom JWT Claims for Role-Based Access:**
```typescript
export interface CustomJWTClaims {
  sub: string; // user_id
  email: string;
  role: UserRole;
  department?: string;
  manager_id?: string;
}

export async function validateJWTAndGetClaims(
  authHeader: string
): Promise<CustomJWTClaims | null> {
  const token = authHeader.replace('Bearer ', '');

  // Supabase automatically validates JWTs
  // Additional custom validation if needed

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    // Fetch role from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, department, manager_id')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    return {
      sub: user.id,
      email: user.email!,
      role: profile.role,
      department: profile.department,
      manager_id: profile.manager_id,
    };
  } catch {
    return null;
  }
}
```

### 7.4 SQL Injection Prevention

**Use Parameterized Queries:**
```typescript
// GOOD: Parameterized query via Supabase client
const { data, error } = await supabase
  .from('leaves')
  .select('*')
  .eq('requester_id', userId)
  .eq('status', status);

// BAD: Never use string concatenation
// const query = `SELECT * FROM leaves WHERE requester_id = '${userId}'`;
```

### 7.5 OWASP Security Checklist

**A01:2021 – Broken Access Control**
- ✅ RLS policies enforce row-level security
- ✅ Role-based authorization on all endpoints
- ✅ Prevent privilege escalation

**A02:2021 – Cryptographic Failures**
- ✅ TLS 1.3 for all data in transit
- ✅ Supabase encrypts data at rest
- ✅ No sensitive data in logs

**A03:2021 – Injection**
- ✅ Parameterized queries via Supabase client
- ✅ Input validation with Zod schemas
- ✅ Content Security Policy headers

**A05:2021 – Security Misconfiguration**
- ✅ Minimal service role key usage
- ✅ Environment variables for secrets
- ✅ CORS properly configured

**A07:2021 – Identification and Authentication Failures**
- ✅ Strong password policy
- ✅ Account lockout after failed attempts
- ✅ Session timeout (30 minutes)
- ✅ JWT with proper expiry

**A08:2021 – Software and Data Integrity Failures**
- ✅ Dependency vulnerability scanning
- ✅ Audit logs for critical operations
- ✅ File upload validation

**A09:2021 – Security Logging and Monitoring Failures**
- ✅ Comprehensive audit logging
- ✅ Sentry for error tracking
- ✅ Anomaly detection (future)

---

## 8. External Integrations

### 8.1 Supabase Client Configuration

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Server-side client with service role
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
```

### 8.2 Email Service Integration (SendGrid)

```typescript
// lib/integrations/sendgrid.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const msg = {
    to: options.to,
    from: {
      email: process.env.FROM_EMAIL || 'noreply@leavems.com',
      name: process.env.FROM_NAME || 'Leave Management System',
    },
    subject: options.subject,
    html: options.html,
    cc: options.cc,
    bcc: options.bcc,
    attachments: options.attachments,
  };

  try {
    await sgMail.send(msg);
  } catch (error: any) {
    console.error('SendGrid error:', error.response?.body || error);
    throw new Error('Failed to send email');
  }
}

// Webhook handler for email events
export async function handleSendGridWebhook(events: any[]): Promise<void> {
  for (const event of events) {
    // Update notification_logs based on event type
    const status = event.event === 'delivered' ? 'sent' : 'failed';

    await supabaseAdmin
      .from('notification_logs')
      .update({
        status,
        result: event,
      })
      .eq('recipient_email', event.email);
  }
}
```

### 8.3 Supabase Storage Integration

```typescript
// lib/integrations/storage.ts
import { supabase } from '@/lib/supabase/client';

const DOCUMENTS_BUCKET = 'documents';

export async function uploadDocument(
  file: File,
  userId: string
): Promise<{ path: string; url: string }> {
  const fileName = generateSecureFileName(file.name, userId);
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(DOCUMENTS_BUCKET)
    .getPublicUrl(filePath);

  return {
    path: filePath,
    url: urlData.publicUrl,
  };
}

export async function deleteDocument(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .remove([path]);

  if (error) throw error;
}

export async function getDocumentUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;

  return data.signedUrl;
}
```

### 8.4 Supabase Realtime Integration

```typescript
// lib/integrations/realtime.ts
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function subscribeToLeaveUpdates(
  userId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  return supabase
    .channel('leave-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leaves',
        filter: `requester_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

export function subscribeToNotifications(
  userId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  return supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notification_logs',
        filter: `recipient_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

export function unsubscribeChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
```

### 8.5 Sentry Integration

```typescript
// lib/integrations/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.['authorization'];
    }
    return event;
  },
});

export function logError(error: Error, context?: Record<string, any>): void {
  Sentry.captureException(error, {
    extra: context,
  });
}

export function setUserContext(user: { id: string; email: string; role: string }): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}
```

---

## 9. TypeScript Interfaces

```typescript
// types/database.types.ts

export type UserRole = 'employee' | 'manager' | 'admin' | 'hr';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type NotificationFrequency = 'weekly' | 'monthly' | 'custom';
export type NotifierStatus = 'active' | 'inactive';
export type NotificationDeliveryStatus = 'sent' | 'failed' | 'pending' | 'retrying';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  manager_id: string | null;
  photo_url: string | null;
  email: string;
  phone_number: string | null;
  hire_date: string | null;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LeaveType {
  id: string;
  name: string;
  description: string | null;
  code: string;
  default_allocation_days: number;
  max_carryover_days: number;
  requires_approval: boolean;
  accrual_rules: {
    accrual_type: 'annual' | 'monthly' | 'per_pay_period';
    accrual_rate: number;
    prorate_first_year: boolean;
    max_accrual_cap?: number;
  };
  color_code: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: string;
  user_id: string;
  leave_type_id: string;
  allocated_days: number;
  used_days: number;
  pending_days: number;
  carryover_days: number;
  available_days: number; // computed
  year: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  leave_type?: LeaveType;
}

export interface Leave {
  id: string;
  requester_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  status: LeaveStatus;
  approver_id: string | null;
  approved_at: string | null;
  comments: string | null;
  rejection_reason: string | null;
  attachment_urls: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  requester?: Profile;
  approver?: Profile;
  leave_type?: LeaveType;
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  year: number;
  is_recurring: boolean;
  country_code: string;
  created_at: string;
}

export interface CompanyDocument {
  id: string;
  name: string;
  document_type: string;
  description: string | null;
  expiry_date: string | null;
  uploaded_by: string;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  is_public: boolean;
  tags: string[];
  metadata: Record<string, any>;
  version: number;
  parent_document_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  uploader?: Profile;
}

export interface DocumentNotifier {
  id: string;
  user_id: string;
  document_id: string;
  notification_frequency: NotificationFrequency;
  custom_frequency_days: number | null;
  advance_notice_days: number;
  last_notification_sent: string | null;
  next_notification_due: string | null;
  status: NotifierStatus;
  created_at: string;
  updated_at: string;
  user?: Profile;
  document?: CompanyDocument;
}

export interface NotificationLog {
  id: string;
  notifier_id: string | null;
  document_id: string | null;
  leave_id: string | null;
  recipient_email: string;
  recipient_id: string | null;
  subject: string;
  notification_type: 'leave_request' | 'leave_approved' | 'leave_rejected' |
                     'document_expiry' | 'leave_balance_low' | 'system_notification';
  sent_at: string;
  status: NotificationDeliveryStatus;
  delivery_attempts: number;
  error_message: string | null;
  result: Record<string, any>;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  table_name: string;
  record_id: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Database schema type
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      leave_types: {
        Row: LeaveType;
        Insert: Omit<LeaveType, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LeaveType, 'id' | 'created_at'>>;
      };
      leave_balances: {
        Row: LeaveBalance;
        Insert: Omit<LeaveBalance, 'id' | 'available_days' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LeaveBalance, 'id' | 'available_days' | 'created_at'>>;
      };
      leaves: {
        Row: Leave;
        Insert: Omit<Leave, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Leave, 'id' | 'created_at'>>;
      };
      public_holidays: {
        Row: PublicHoliday;
        Insert: Omit<PublicHoliday, 'id' | 'created_at'>;
        Update: Partial<Omit<PublicHoliday, 'id' | 'created_at'>>;
      };
      company_documents: {
        Row: CompanyDocument;
        Insert: Omit<CompanyDocument, 'id' | 'version' | 'created_at' | 'updated_at' | 'deleted_at'>;
        Update: Partial<Omit<CompanyDocument, 'id' | 'created_at'>>;
      };
      document_notifiers: {
        Row: DocumentNotifier;
        Insert: Omit<DocumentNotifier, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DocumentNotifier, 'id' | 'created_at'>>;
      };
      notification_logs: {
        Row: NotificationLog;
        Insert: Omit<NotificationLog, 'id'>;
        Update: Partial<Omit<NotificationLog, 'id'>>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'>;
        Update: never;
      };
    };
    Functions: {
      calculate_working_days: {
        Args: { start_date: string; end_date: string; country_code?: string };
        Returns: number;
      };
      check_leave_balance: {
        Args: {
          p_user_id: string;
          p_leave_type_id: string;
          p_days_count: number;
          p_year: number;
        };
        Returns: boolean;
      };
      initialize_user_leave_balances: {
        Args: { p_user_id: string; p_year: number };
        Returns: void;
      };
    };
  };
}
```

---

## 10. Zod Validation Schemas

```typescript
// lib/validations/schemas.ts
import { z } from 'zod';

// Auth schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  department: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Profile schemas
export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  department: z.string().max(100).optional(),
  phone_number: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional(),
  photo_url: z.string().url().optional(),
}).strict();

export const updateRoleSchema = z.object({
  user_id: z.string().uuid(),
  new_role: z.enum(['employee', 'manager', 'admin', 'hr']),
});

// Leave schemas
export const createLeaveRequestSchema = z.object({
  leave_type_id: z.string().uuid('Invalid leave type'),
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  reason: z.string().max(500, 'Reason too long').optional(),
  attachment_urls: z.array(z.string().url()).max(5).optional(),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: 'End date must be after or equal to start date', path: ['end_date'] }
);

export const updateLeaveRequestSchema = z.object({
  status: z.enum(['cancelled', 'approved', 'rejected']).optional(),
  comments: z.string().max(500).optional(),
  rejection_reason: z.string().max(500).optional(),
}).refine(
  (data) => {
    if (data.status === 'rejected') {
      return !!data.rejection_reason;
    }
    return true;
  },
  { message: 'Rejection reason is required when rejecting leave', path: ['rejection_reason'] }
);

export const leaveQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  user_id: z.string().uuid().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// Leave type schemas
export const createLeaveTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  code: z.string().min(2).max(20).regex(/^[A-Z_]+$/),
  default_allocation_days: z.number().int().min(0).max(365),
  max_carryover_days: z.number().int().min(0).max(365),
  requires_approval: z.boolean().default(true),
  accrual_rules: z.object({
    accrual_type: z.enum(['annual', 'monthly', 'per_pay_period']),
    accrual_rate: z.number().min(0),
    prorate_first_year: z.boolean(),
    max_accrual_cap: z.number().int().positive().optional(),
  }),
  color_code: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
  sort_order: z.number().int().min(0).default(0),
});

// Document schemas
export const documentUploadSchema = z.object({
  name: z.string().min(1, 'Document name is required').max(255),
  document_type: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  expiry_date: z.string().datetime().optional(),
  is_public: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const createDocumentNotifierSchema = z.object({
  document_id: z.string().uuid(),
  notification_frequency: z.enum(['weekly', 'monthly', 'custom']),
  custom_frequency_days: z.number().int().positive().optional(),
  advance_notice_days: z.number().int().positive().default(30),
}).refine(
  (data) => {
    if (data.notification_frequency === 'custom') {
      return !!data.custom_frequency_days;
    }
    return true;
  },
  {
    message: 'Custom frequency days required for custom frequency',
    path: ['custom_frequency_days']
  }
);

// Notification schemas
export const notificationQuerySchema = z.object({
  recipient_id: z.string().uuid().optional(),
  notification_type: z.enum([
    'leave_request',
    'leave_approved',
    'leave_rejected',
    'document_expiry',
    'leave_balance_low',
    'system_notification',
  ]).optional(),
  status: z.enum(['sent', 'failed', 'pending', 'retrying']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// Validation helper
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`
  );

  return { success: false, errors };
}
```

---

## Deployment Checklist

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@leavems.com
FROM_NAME=Leave Management System

# Redis/Upstash
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn

# App
NEXT_PUBLIC_APP_URL=https://leavems.com
NODE_ENV=production
```

### Database Migrations Checklist

- [ ] Run all SQL migrations in order
- [ ] Verify all indexes created
- [ ] Test all database functions
- [ ] Verify all triggers active
- [ ] Enable RLS on all tables
- [ ] Test RLS policies with different roles
- [ ] Seed initial data (leave types, public holidays)
- [ ] Create test users for each role

### Edge Functions Deployment

- [ ] Deploy `document-expiry-check` function
- [ ] Deploy `send-email` function
- [ ] Deploy `calculate-leave-balance` function
- [ ] Deploy `validate-leave-request` function
- [ ] Configure cron schedules
- [ ] Test webhook endpoints
- [ ] Verify environment variables

### Security Verification

- [ ] All RLS policies tested
- [ ] Service role key secured
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] File upload restrictions enforced
- [ ] Input validation on all endpoints
- [ ] Audit logging functional

### Performance Verification

- [ ] Database indexes optimized
- [ ] Query performance tested
- [ ] Caching strategy implemented
- [ ] CDN configured for static assets
- [ ] Realtime subscriptions tested
- [ ] Load testing completed (1000+ concurrent users)

---

**End of Backend Architecture & API Design Document**

This comprehensive document provides production-ready specifications for the Leave Management System backend. All code examples are TypeScript-based, security-focused, and optimized for Supabase integration.
