-- ============================================================================
-- MIGRATION: 20251008040605_update_employees_role_check.sql
-- Description: Update employees_role_check constraint to include 'admin' role
-- Created: 2025-10-08
-- ============================================================================

-- Drop the existing check constraint
ALTER TABLE public.employees
DROP CONSTRAINT employees_role_check;

-- Add the new check constraint including 'admin' role
ALTER TABLE public.employees
ADD CONSTRAINT employees_role_check
CHECK (role::text = ANY (ARRAY['employee'::character varying, 'manager'::character varying, 'hr'::character varying, 'admin'::character varying]::text[]));
