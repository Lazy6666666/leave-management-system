-- ============================================================================
-- MIGRATION: 20251008040421_add_is_active_to_employees.sql
-- Description: Add is_active column to the public.employees table
-- Created: 2025-10-08
-- ============================================================================

ALTER TABLE public.employees
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
