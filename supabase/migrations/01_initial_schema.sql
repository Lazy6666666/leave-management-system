
-- Create the "departments" table
CREATE TABLE public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the "employees" table
CREATE TABLE public.employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES public.departments(id),
  role TEXT NOT NULL DEFAULT 'Employee', -- e.g., 'Employee', 'Manager', 'HR', 'Admin'
  manager_id UUID REFERENCES public.employees(id), -- Self-referencing for manager hierarchy
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the "leave_types" table
CREATE TABLE public.leave_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_allocation_days INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the "leave_requests" table
CREATE TABLE public.leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  leave_type_id INTEGER REFERENCES public.leave_types(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- e.g., 'pending', 'approved', 'rejected', 'cancelled'
  approver_id UUID REFERENCES public.employees(id),
  approval_date TIMESTAMPTZ,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the "leave_balances" table
CREATE TABLE public.leave_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  leave_type_id INTEGER REFERENCES public.leave_types(id) NOT NULL,
  total_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  used_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  remaining_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  accrued_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  carry_over_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id, leave_type_id)
);

-- Create the "documents" table
CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leave_request_id UUID REFERENCES public.leave_requests(id),
  uploaded_by UUID REFERENCES public.employees(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_employees_department_id ON public.employees(department_id);
CREATE INDEX idx_employees_manager_id ON public.employees(manager_id);
CREATE INDEX idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX idx_leave_requests_leave_type_id ON public.leave_requests(leave_type_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX idx_leave_balances_employee_id ON public.leave_balances(employee_id);
CREATE INDEX idx_leave_balances_leave_type_id ON public.leave_balances(leave_type_id);
CREATE INDEX idx_documents_leave_request_id ON public.documents(leave_request_id);
CREATE INDEX idx_documents_uploaded_by ON public.documents(uploaded_by);
