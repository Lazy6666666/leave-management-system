/**
 * API Route Tests for Admin Users Endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/admin/users/index'

// Mock Supabase
const mockSelect = vi.fn()
const mockFrom = vi.fn()
const mockAuth = vi.fn()

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockAuth,
    },
    from: mockFrom,
  }),
}))

describe('/api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({ select: mockSelect })
  })

  describe('GET', () => {
    it('should return 401 if not authenticated', async () => {
      mockAuth.mockResolvedValue({ data: { user: null }, error: null })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(401)
    })

    it('should return 403 if not admin or hr', async () => {
      mockAuth.mockResolvedValue({
        data: { user: { id: '1', email: 'user@test.com' } },
        error: null,
      })

      mockSelect.mockResolvedValue({
        data: [{ role: 'employee' }],
        error: null,
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(403)
    })

    it('should return users for admin', async () => {
      mockAuth.mockResolvedValue({
        data: { user: { id: '1', email: 'admin@test.com' } },
        error: null,
      })

      mockSelect
        .mockResolvedValueOnce({
          data: [{ role: 'admin' }],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [
            { id: '1', name: 'User 1', email: 'user1@test.com', role: 'employee' },
            { id: '2', name: 'User 2', email: 'user2@test.com', role: 'manager' },
          ],
          error: null,
          count: 2,
        })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.users).toHaveLength(2)
    })

    it('should filter users by role', async () => {
      mockAuth.mockResolvedValue({
        data: { user: { id: '1', email: 'admin@test.com' } },
        error: null,
      })

      mockSelect
        .mockResolvedValueOnce({
          data: [{ role: 'admin' }],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [{ id: '1', name: 'Manager 1', role: 'manager' }],
          error: null,
          count: 1,
        })

      const { req, res } = createMocks({
        method: 'GET',
        query: { role: 'manager' },
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('PATCH', () => {
    it('should update user role', async () => {
      mockAuth.mockResolvedValue({
        data: { user: { id: '1', email: 'admin@test.com' } },
        error: null,
      })

      mockSelect.mockResolvedValue({
        data: [{ role: 'admin' }],
        error: null,
      })

      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: { id: '2', role: 'manager' },
            error: null,
          }),
        }),
      })

      const { req, res } = createMocks({
        method: 'PATCH',
        body: { userId: '2', role: 'manager' },
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('DELETE', () => {
    it('should deactivate user', async () => {
      mockAuth.mockResolvedValue({
        data: { user: { id: '1', email: 'admin@test.com' } },
        error: null,
      })

      mockSelect.mockResolvedValue({
        data: [{ role: 'admin' }],
        error: null,
      })

      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: { id: '2', is_active: false },
            error: null,
          }),
        }),
      })

      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: '2' },
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Invalid methods', () => {
    it('should return 405 for unsupported methods', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(405)
    })
  })
})
