import { z } from 'zod'

export const updateUserRoleSchema = z.object({
  user_id: z.string().uuid('Invalid user id'),
  new_role: z.enum(['employee', 'manager', 'admin', 'hr']),
})

export type UpdateUserRolePayload = z.infer<typeof updateUserRoleSchema>

export const upsertLeaveTypeSchema = z.object({
  id: z.string().uuid('Invalid leave type id').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase alphanumeric with dashes or underscores'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  default_allocation_days: z.number().int().min(0).max(365),
  max_carryover_days: z.number().int().min(0).max(365),
  requires_approval: z.boolean().optional().default(true),
  accrual_rules: z
    .object({
      accrual_type: z.enum(['annual', 'monthly', 'per_pay_period']),
      accrual_rate: z.number().min(0),
      prorate_first_year: z.boolean().optional().default(true),
      max_accrual_cap: z.number().min(0).optional(),
    })
    .optional(),
  color_code: z
    .string()
    .regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Color code must be a valid hex value')
    .optional(),
  is_active: z.boolean().optional().default(true),
})

export type UpsertLeaveTypePayload = z.infer<typeof upsertLeaveTypeSchema>

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['employee', 'manager', 'admin', 'hr']),
  department: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type CreateUserPayload = z.infer<typeof createUserSchema>;
