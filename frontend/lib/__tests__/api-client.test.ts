import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ApiClient, { calculateBusinessDays } from '@/lib/api-client'

describe('calculateBusinessDays', () => {
  it('should return 0 for weekend-only periods', () => {
    const result = calculateBusinessDays('2024-01-13', '2024-01-14') // Saturday to Sunday
    expect(result).toBe(0)
  })

  it('should return correct number of weekdays', () => {
    const result = calculateBusinessDays('2024-01-15', '2024-01-19') // Monday to Friday
    expect(result).toBe(5)
  })

  it('should handle single day correctly', () => {
    const result = calculateBusinessDays('2024-01-15', '2024-01-15') // Monday
    expect(result).toBe(1)
  })

  it('should handle mixed weeks correctly', () => {
    const result = calculateBusinessDays('2024-01-12', '2024-01-16') // Friday to Tuesday (3 weekdays)
    expect(result).toBe(3)
  })

  it('should handle negative date ranges', () => {
    const result = calculateBusinessDays('2024-01-19', '2024-01-15') // Friday to Monday (backward)
    expect(result).toBe(3) // Still calculates correctly
  })
})

describe('ApiClient', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    global.fetch = mockFetch
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('signUp', () => {
    it('should call signup API successfully', async () => {
      const mockResponse = {
        user: { id: 'user-123', email: 'test@example.com' },
        profile: { id: 'profile-123', full_name: 'Test User' }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await ApiClient.signUp({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        department: 'Engineering'
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User',
          department: 'Engineering'
        }),
      })

      expect(result).toEqual(mockResponse)
    })

    it('should handle signup errors', async () => {
      const errorResponse = {
        error: { message: 'Email already exists' }
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse,
      })

      await expect(ApiClient.signUp({
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Test User'
      })).rejects.toThrow('Email already exists')
    })
  })

  describe('signIn', () => {
    it('should authenticate user successfully', async () => {
      const mockResponse = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token-123',
        refresh_token: 'refresh-123'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await ApiClient.signIn({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result).toEqual(mockResponse)
    })
  })

  describe('getLeaves', () => {
    it('should fetch leaves with default parameters', async () => {
      const mockResponse = {
        leaves: [
          { id: 'leave-1', status: 'pending', days_count: 5 },
          { id: 'leave-2', status: 'approved', days_count: 3 }
        ],
        total: 2,
        hasMore: false
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await ApiClient.getLeaves()

      expect(mockFetch).toHaveBeenCalledWith('/api/leaves?')
      expect(result).toEqual(mockResponse)
    })

    it('should apply filters correctly', async () => {
      const mockResponse = {
        leaves: [{ id: 'leave-1', status: 'pending' }],
        total: 1,
        hasMore: false
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await ApiClient.getLeaves({
        status: 'pending',
        limit: 10,
        offset: 0
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/leaves?status=pending&limit=10&offset=0')
    })
  })

  describe('approveLeave', () => {
    it('should approve leave request', async () => {
      const mockResponse = {
        id: 'leave-123',
        status: 'approved',
        approver_id: 'manager-123'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await ApiClient.approveLeave('leave-123', 'Looks good to me!')

      expect(mockFetch).toHaveBeenCalledWith('/api/leaves/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'leave-123',
          action: 'approved',
          comments: 'Looks good to me!'
        }),
      })

      expect(result).toEqual(mockResponse)
    })
  })
})
