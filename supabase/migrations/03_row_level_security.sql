-- Helper functions for RLS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.get_user_department_id()
RETURNS UUID AS $$ 
  SELECT department_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Enable RLS on all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for "employees" table
CREATE POLICY "HR can view all employees" ON public.employees FOR SELECT USING (public.get_user_role() = 'HR');
CREATE POLICY "Managers can view employees in their department" ON public.employees FOR SELECT USING (public.get_user_role() = 'Manager' AND department_id = public.get_user_department_id());
CREATE POLICY "Employees can view their own record" ON public.employees FOR SELECT USING (auth.uid() = id);

-- RLS Policies for "leave_requests" table
CREATE POLICY "HR can view all leave requests" ON public.leave_requests FOR SELECT USING (public.get_user_role() = 'HR');
CREATE POLICY "Managers can view leave requests in their department" ON public.leave_requests FOR SELECT USING (public.get_user_role() = 'Manager' AND employee_id IN (SELECT id FROM public.employees WHERE department_id = public.get_user_department_id()));
CREATE POLICY "Employees can view their own leave requests" ON public.leave_requests FOR SELECT USING (auth.uid() = employee_id);
CREATE POLICY "Employees can insert their own leave requests" ON public.leave_requests FOR INSERT WITH CHECK (auth.uid() = employee_id);
CREATE POLICY "Employees can update their own pending leave requests" ON public.leave_requests FOR UPDATE USING (auth.uid() = employee_id AND status = 'pending');

-- RLS Policies for "leave_balances" table
CREATE POLICY "HR can view all leave balances" ON public.leave_balances FOR SELECT USING (public.get_user_role() = 'HR');
CREATE POLICY "Managers can view leave balances in their department" ON public.leave_balances FOR SELECT USING (public.get_user_role() = 'Manager' AND employee_id IN (SELECT id FROM public.employees WHERE department_id = public.get_user_department_id()));
CREATE POLICY "Employees can view their own leave balances" ON public.leave_balances FOR SELECT USING (auth.uid() = employee_id);

-- RLS Policies for "leave_types" table
CREATE POLICY "All roles can view leave types" ON public.leave_types FOR SELECT USING (TRUE);
CREATE POLICY "HR and Admin can manage leave types" ON public.leave_types FOR ALL USING (public.get_user_role() IN ('HR', 'Admin'));

-- RLS Policies for "departments" table
CREATE POLICY "All roles can view departments" ON public.departments FOR SELECT USING (TRUE);
CREATE POLICY "HR and Admin can manage departments" ON public.departments FOR ALL USING (public.get_user_role() IN ('HR', 'Admin'));

-- RLS Policies for "documents" table
CREATE POLICY "HR can view all documents" ON public.documents FOR SELECT USING (public.get_user_role() = 'HR');
CREATE POLICY "Managers can view documents in their department" ON public.documents FOR SELECT USING (public.get_user_role() = 'Manager' AND uploaded_by IN (SELECT id FROM public.employees WHERE department_id = public.get_user_department_id()));
CREATE POLICY "Employees can view their own documents" ON public.documents FOR SELECT USING (auth.uid() = uploaded_by);
CREATE POLICY "Employees can insert their own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Employees can delete their own documents" ON public.documents FOR DELETE USING (auth.uid() = uploaded_by);
