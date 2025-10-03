import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import { NextApiRequest, NextApiResponse } from 'next'

// Mock Supabase client properly typed
const mockSupabaseClient = {
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
}

// Mock auth utilities
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase-server', () => ({
  createClient: () => mockSupabaseClient,
}))

vi.mock('@/lib/auth', () => ({
  getUser: mockGetUser,
}))

describe('Authentication API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/signup', () => {
    it('should create user successfully', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' }
        },
        error: null
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: 'profile-123', full_name: 'Test User' },
              error: null
            })
          }))
        })),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
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

      // Import handlers dynamically to avoid module resolution issues in tests
      const { POST: signupHandler } = await import('@/app/api/auth/signup/route')
      await signupHandler(req as any)

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  describe('POST /api/auth/login', () => {
    it('should authenticate user successfully', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
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

      const { POST: loginHandler } = await import('@/app/api/auth/login/route')
      await loginHandler(req as any)

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(res._getStatusCode()).toBe(200)
      const responseData = JSON.parse(res._getData())
      expect(responseData.user.id).toBe('user-123')
      expect(responseData.access_token).toBe('token-123')
    })
  })
})

describe('Leave Management API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/leaves', () => {
    it('should create leave request for authenticated user', async () => {
      const mockUser = { id: 'user-123', role: 'employee' }
      mockGetUser.mockResolvedValue(mockUser)

      mockSupabaseClient.from.mockReturnValue({
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

      const { POST: createLeaveHandler } = await import('@/app/api/leaves/route')
      await createLeaveHandler(req as any)

      expect(mockGetUser).toHaveBeenCalledWith(req)
    })

    it('should reject unauthenticated requests', async () => {
      mockGetUser.mockResolvedValue(null)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          leave_type_id: 'annual',
          start_date: '2024-01-15',
          end_date: '2024-01-19'
        }
      })

      const { POST: createLeaveHandler } = await import('@/app/api/leaves/route')
      await createLeaveHandler(req as any)

      expect(res._getStatusCode()).toBe(401)
      const responseData = JSON.parse(res._getData())
      expect(responseData.error.code).toBe('AUTH_UNAUTHORIZED')
    })
  })
})
