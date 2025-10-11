-- ============================================================================
-- MIGRATION: 20251010_create_employees_table_complete.sql
-- Description: Complete the employees table migration (missing from previous attempt)
-- Created: 2025-10-10
-- ============================================================================

-- Ensure uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create employees table (this was missing!)
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role user_role NOT NULL DEFAULT 'employee',
  department TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_supabase_id ON public.employees(supabase_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON public.employees(is_active);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Migrate existing data from profiles to employees
INSERT INTO public.employees (supabase_id, email, name, first_name, last_name, role, department, photo_url, metadata, created_at)
SELECT
  p.id AS supabase_id,
  COALESCE(u.email, 'unknown@example.com') AS email,
  p.full_name AS name,
  SPLIT_PART(p.full_name, ' ', 1) AS first_name,
  CASE
    WHEN array_length(string_to_array(p.full_name, ' '), 1) > 1
    THEN array_to_string((string_to_array(p.full_name, ' '))[2:], ' ')
    ELSE NULL
  END AS last_name,
  p.role,
  p.department,
  p.photo_url,
  p.metadata,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
ON CONFLICT (supabase_id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  photo_url = EXCLUDED.photo_url,
  metadata = EXCLUDED.metadata;

-- Add trigger for updated_at (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'update_employees_updated_at'
      AND event_object_table = 'employees'
  ) THEN
    CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE public.employees IS 'Employee profiles with authentication linkage';
COMMENT ON COLUMN public.employees.supabase_id IS 'Foreign key to auth.users.id';
COMMENT ON COLUMN public.employees.is_active IS 'Soft delete flag for employee records';

-- Grant permissions (if needed)
-- GRANT SELECT, INSERT, UPDATE ON public.employees TO authenticated;
-- GRANT SELECT ON public.employees TO anon;
