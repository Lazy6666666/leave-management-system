import { Buffer } from 'buffer'
import { z } from 'zod'

export const documentUploadSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name must be less than 120 characters'),
  document_type: z
    .string()
    .min(2, 'Document type must be at least 2 characters')
    .max(60, 'Document type must be less than 60 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  expiry_date: z
    .string()
    .optional(),
  is_public: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
  file_name: z.string().min(1, 'File name is required'),
  file_type: z.string().min(1, 'File type is required'),
  file_size: z
    .number()
    .min(1, 'File size must be greater than zero')
    .max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  file_base64: z
    .string()
    .refine((value) => {
      try {
        return Buffer.from(value, 'base64').length > 0
      } catch {
        return false
      }
    }, 'File data must be valid base64'),
})

export const documentQuerySchema = z.object({
  document_type: z.preprocess(
    (value) => (typeof value === 'string' && value.length > 0 ? value : undefined),
    z.string().optional()
  ),
  is_public: z.preprocess(
    (value) => {
      if (value === undefined) return undefined
      if (typeof value === 'string') {
        if (value === 'true') return true
        if (value === 'false') return false
      }
      if (typeof value === 'boolean') return value
      return undefined
    },
    z.boolean().optional()
  ),
  tags: z.preprocess(
    (value) => {
      if (typeof value !== 'string' || value.length === 0) {
        return undefined
      }
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          return parsed.map((tag) => String(tag).trim()).filter(Boolean)
        }
      } catch {
        // ignore JSON parse error and fallback to comma-separated list
      }
      return value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    },
    z.array(z.string()).optional()
  ),
  search: z.preprocess(
    (value) => (typeof value === 'string' && value.length > 0 ? value : undefined),
    z.string().optional()
  ),
  limit: z.preprocess(
    (value) => {
      if (value === undefined) return undefined
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : undefined
    },
    z
      .number()
      .int()
      .min(1, 'Limit must be between 1 and 100')
      .max(100, 'Limit must be between 1 and 100')
      .optional()
  ),
  offset: z.preprocess(
    (value) => {
      if (value === undefined) return undefined
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : undefined
    },
    z.number().int().min(0, 'Offset must be greater than or equal to 0').optional()
  ),
})

export type DocumentUploadPayload = z.infer<typeof documentUploadSchema>
export type DocumentQueryParams = z.infer<typeof documentQuerySchema>

export const documentNotifierSchema = z.object({
  document_id: z.string().uuid('Invalid document ID'),
  notification_frequency: z.enum(['weekly', 'monthly', 'custom']),
  custom_frequency_days: z
    .number()
    .int()
    .min(1, 'Custom frequency must be greater than 0')
    .nullable()
    .optional(),
  advance_notice_days: z
    .number()
    .int()
    .min(1, 'Advance notice days must be at least 1')
    .max(180, 'Advance notice days must be less than or equal to 180')
    .default(30),
})

export type DocumentNotifierPayload = z.infer<typeof documentNotifierSchema>
