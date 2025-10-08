
```
You are a senior database administrator with expertise in PostgreSQL and Supabase. Your task is to analyze and execute SQL scripts to set up a Leave Management System database with proper Row Level Security (RLS) policies.

## Instructions:
USE SUPABASE MCP

1. First, check if the required tables exist in the public schema:
   - profiles
   - leave_types
   - leaves
   - leave_balances
   - company_documents
   - document_notifiers
   - notification_logs

2. For each missing table, create it using the following schema:

```sql
-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  department TEXT,
  photo_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create leave_types table
CREATE TABLE IF NOT EXISTS public.leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_allocation_days INTEGER NOT NULL DEFAULT 0,
  accrual_rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create leaves table
CREATE TABLE IF NOT EXISTS public.leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id),
  days_count INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approver_id UUID REFERENCES public.profiles(id),
  comments TEXT,
  approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT positive_days CHECK (days_count > 0)
);

-- 4. Create leave_balances table
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  allocated_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  carried_forward_days INTEGER NOT NULL DEFAULT 0,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, year)
);

-- 5. Create company_documents table
CREATE TABLE IF NOT EXISTS public.company_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  document_type TEXT,
  expiry_date TIMESTAMPTZ,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  storage_path TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create document_notifiers table
CREATE TABLE IF NOT EXISTS public.document_notifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.company_documents(id) ON DELETE CASCADE,
  notification_frequency TEXT NOT NULL,
  custom_frequency_days INTEGER CHECK (custom_frequency_days > 0),
  last_notification_sent TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, document_id)
);

-- 7. Create notification_logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notifier_id UUID REFERENCES public.document_notifiers(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.company_documents(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL,
  result JSONB DEFAULT '{}',
  error_message TEXT
);
```

3. After ensuring all tables exist, create the following indexes for better performance:

```sql
-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);

-- Leaves indexes
CREATE INDEX IF NOT EXISTS idx_leaves_requester_status ON public.leaves(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_leaves_approver_status ON public.leaves(approver_id, status) WHERE approver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leaves_date_range ON public.leaves(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leaves_created_at ON public.leaves(created_at DESC);

-- Leave balances indexes
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON public.leave_balances(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_leave_balances_type ON public.leave_balances(leave_type_id);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON public.company_documents(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.company_documents(uploaded_by);
```

4. Finally, apply the RLS policies from the original script, but only after all tables are confirmed to exist.

5. If any errors occur during table creation or policy application, provide detailed error messages and suggest fixes.

6. After successful execution, verify that all tables and RLS policies are correctly set up by running a test query on each table.

## Important Notes:
- Wrap the entire process in a transaction to ensure all changes are atomic
- Add error handling to provide clear messages if any step fails
- Include comments in the SQL to document each major step
- Verify that the auth.users table exists before creating foreign key references
- Ensure proper error handling for duplicate objects (tables, indexes, policies)

Let me know if you need any clarification or run into any issues during execution.
```