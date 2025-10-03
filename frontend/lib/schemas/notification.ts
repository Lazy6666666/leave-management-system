import { z } from 'zod'

export const notificationQuerySchema = z.object({
  recipient_id: z
    .preprocess((value) => (typeof value === 'string' && value.length > 0 ? value : undefined), z.string().uuid().optional()),
  notification_type: z.preprocess(
    (value) => (typeof value === 'string' && value.length > 0 ? value : undefined),
    z.string().optional()
  ),
  status: z.preprocess(
    (value) => (typeof value === 'string' && value.length > 0 ? value : undefined),
    z.enum(['sent', 'failed', 'pending', 'retrying']).optional()
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

export type NotificationQueryParams = z.infer<typeof notificationQuerySchema>
