import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { NextApiRequest, NextApiResponse } from 'next'
import { POST as signupHandler } from '@/app/api/auth/signup/route'
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { POST as createLeaveHandler } from '@/app/api/leaves/route'

// Mock Supabase client
type MockSupabaseClient = {
  auth: {
    signUp: ReturnType<typeof vi.fn>
    signInWithPassword: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
}

vi.mock('@/lib/supabase-server', () => ({
  createClient: (): MockSupabaseClient => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  }),
}))

// Mock auth utilities
vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
}))

describe('Authentication API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/signup', () => {
    it('should create user successfully', async () => {
      const { createClient } = await import('@/lib/supabase-server')
      const mockSupabase = createClient as any

      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' }
        },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: 'profile-123', full_name: 'Test User' },
              error: null
            })
          }))
        }))
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User',
          department: 'Engineering'
        }
      })

      await signupHandler(req as any)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should handle signup errors', async () => {
      const { createClient } = await import('@/lib/supabase-server')
      const mockSupabase = createClient as any

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' }
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          email: 'existing@example.com',
          password: 'password123',
          fullName: 'Test User'
        }
      })

      await signupHandler(req as any)

      expect(res._getStatusCode()).toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData.error.code).toBe('AUTH_SIGNUP_FAILED')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should authenticate user successfully', async () => {
      const { createClient } = await import('@/lib/supabase-server')
      const mockSupabase = createClient as any

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: {
            access_token: 'token-123',
            refresh_token: 'refresh-123'
          }
        },
        error: null
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      })

      await loginHandler(req as any)

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(res._getStatusCode()).toBe(200)
      const responseData = JSON.parse(res._getData())
      expect(responseData.user.id).toBe('user-123')
      expect(responseData.access_token).toBe('token-123')
    })

    it('should handle invalid credentials', async () => {
      const { createClient } = await import('@/lib/supabase-server')
      const mockSupabase = createClient as any

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          email: 'wrong@example.com',
          password: 'wrongpassword'
        }
      })

      await loginHandler(req as any)

      expect(res._getStatusCode()).toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData.error.code).toBe('AUTH_INVALID_CREDENTIALS')
    })
  })
})

describe('Leave Management API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/leaves', () => {
    it('should create leave request for authenticated user', async () => {
      const { getUser } = await import('@/lib/auth')
      const { createClient } = await import('@/lib/supabase-server')

      const mockUser = { id: 'user-123', role: 'employee' }
      ;(getUser as any).mockResolvedValue(mockUser)

      const mockSupabase = createClient as any
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { default_allocation_days: 25 },
              error: null
            })
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'leave-123',
                requester_id: 'user-123',
                status: 'pending',
                days_count: 5
              },
              error: null
            })
          }))
        }))
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          leave_type_id: 'annual',
          start_date: '2024-01-15',
          end_date: '2024-01-19',
          reason: 'Vacation'
        }
      })

      await createLeaveHandler(req as any)

      expect(getUser).toHaveBeenCalledWith(req)
    })

    it('should reject unauthenticated requests', async () => {
      const { getUser } = await import('@/lib/auth')
      ;(getUser as any).mockResolvedValue(null)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          leave_type_id: 'annual',
          start_date: '2024-01-15',
          end_date: '2024-01-19'
        }
      })

      await createLeaveHandler(req as any)

      expect(res._getStatusCode()).toBe(401)
      const responseData = JSON.parse(res._getData())
      expect(responseData.error.code).toBe('AUTH_UNAUTHORIZED')
    })

    it('should validate leave balance', async () => {
      const { getUser } = await import('@/lib/auth')
      const { createClient } = await import('@/lib/supabase-server')

      const mockUser = { id: 'user-123', role: 'employee' }
      ;(getUser as any).mockResolvedValue(mockUser)

      const mockSupabase = createClient as any

      // Mock leave type with only 2 days remaining
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'leave_types') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { default_allocation_days: 25 },
                  error: null
                })
              }))
            }))
          }
        }

        if (table === 'leaves') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  reduce: vi.fn().mockReturnValue(23) // Used 23 days, 2 remaining
                }))
              })),
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'leave-123' },
                    error: null
                  })
                }))
              }))
            }))
          }
        }

        return {}
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          leave_type_id: 'annual',
          start_date: '2024-01-15',
          end_date: '2024-01-19', // 5 business days
          reason: 'Vacation'
        }
      })

      await createLeaveHandler(req as any)

      expect(res._getStatusCode()).toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData.error.code).toBe('INSUFFICIENT_BALANCE')
    })
  })
})
