/**
 * Unit Tests for useOrgStats Hook
 *
 * Tests for organizational statistics hook with real-time subscriptions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOrgStats } from '@/hooks/use-org-stats'
import type { ReactNode } from 'react'

// Mock Supabase client
const mockInvoke = vi.fn()
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
  unsubscribe: vi.fn(),
}

vi.mock('@/lib/supabase-client', () => ({
  getBrowserClient: () => ({
    functions: {
      invoke: mockInvoke,
    },
    channel: vi.fn(() => mockChannel),
  }),
}))

describe('useOrgStats', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const mockOrgStats = {
    last_refreshed: '2025-10-10T12:00:00Z',
    employee_stats: {
      total_employees: 50,
      total_managers: 5,
      total_hr: 2,
      total_admins: 1,
      total_active_users: 48,
      total_inactive_users: 2,
    },
    department_stats: [
      { department: 'Engineering', employee_count: 20, manager_count: 2 },
      { department: 'Sales', employee_count: 15, manager_count: 2 },
    ],
    current_year_leave_stats: {
      pending_leaves: 10,
      approved_leaves: 100,
      rejected_leaves: 5,
      cancelled_leaves: 3,
      total_leaves: 118,
      total_approved_days: 500,
      avg_leave_duration: 5,
    },
    leave_type_stats: [
      {
        leave_type_id: '1',
        leave_type_name: 'Annual Leave',
        total_requests: 80,
        approved_requests: 75,
        pending_requests: 5,
        rejected_requests: 0,
        total_days_taken: 400,
        avg_days_per_request: 5,
      },
    ],
    monthly_trends: [
      {
        month_num: 1,
        month_name: 'January',
        total_requests: 10,
        approved_requests: 9,
        total_days: 45,
      },
    ],
    top_requesters: [
      {
        employee_id: '1',
        full_name: 'John Doe',
        department: 'Engineering',
        role: 'employee',
        total_requests: 5,
        total_days_taken: 25,
      },
    ],
    department_leave_stats: [
      {
        department: 'Engineering',
        total_requests: 40,
        approved_requests: 38,
        pending_requests: 2,
        total_days_taken: 200,
        avg_days_per_employee: 10,
      },
    ],
    approval_metrics: {
      total_processed: 105,
      total_approved: 100,
      total_rejected: 5,
      avg_approval_time_hours: 24,
      approval_rate: 0.95,
      overdue_pending_requests: 2,
    },
  }

  it('should fetch org stats successfully', async () => {
    mockInvoke.mockResolvedValue({ data: mockOrgStats, error: null })

    const { result } = renderHook(() => useOrgStats(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockOrgStats)
    expect(mockInvoke).toHaveBeenCalledWith('get-org-stats', { method: 'GET' })
  })

  it('should handle error when fetching fails', async () => {
    const errorMessage = 'Failed to fetch org stats'
    mockInvoke.mockResolvedValue({ data: null, error: { message: errorMessage } })

    const { result } = renderHook(() => useOrgStats(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error?.message).toContain(errorMessage)
  })

  it('should handle empty data response', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null })

    const { result } = renderHook(() => useOrgStats(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toContain('No data returned')
  })

  it('should respect enabled option', async () => {
    const { result } = renderHook(() => useOrgStats({ enabled: false }), { wrapper })

    expect(result.current.isLoading).toBe(false)
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('should set up real-time subscriptions', async () => {
    mockInvoke.mockResolvedValue({ data: mockOrgStats, error: null })

    const { unmount } = renderHook(() => useOrgStats(), { wrapper })

    await waitFor(() => {
      expect(mockChannel.on).toHaveBeenCalledTimes(2) // profiles and leaves
      expect(mockChannel.subscribe).toHaveBeenCalledTimes(2)
    })

    unmount()

    expect(mockChannel.unsubscribe).toHaveBeenCalledTimes(2)
  })

  it('should not set up subscriptions when disabled', () => {
    renderHook(() => useOrgStats({ enabled: false }), { wrapper })

    expect(mockChannel.on).not.toHaveBeenCalled()
    expect(mockChannel.subscribe).not.toHaveBeenCalled()
  })

  it('should invalidate queries on real-time updates', async () => {
    mockInvoke.mockResolvedValue({ data: mockOrgStats, error: null })

    let realtimeCallback: (() => void) | null = null
    mockChannel.on.mockImplementation((event: string, filter: any, callback: () => void) => {
      realtimeCallback = callback
      return mockChannel
    })

    const { result } = renderHook(() => useOrgStats(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Trigger real-time update
    if (realtimeCallback) {
      realtimeCallback()
    }

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledTimes(2) // Initial + refetch
    })
  })

  it('should use custom refetch interval', async () => {
    mockInvoke.mockResolvedValue({ data: mockOrgStats, error: null })

    const customInterval = 10000 // 10 seconds
    renderHook(() => useOrgStats({ refetchInterval: customInterval }), { wrapper })

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalled()
    })

    // Note: Testing actual refetch interval would require advancing timers
    // which is complex with React Query. This test verifies the option is accepted.
  })

  it('should provide refetch function', async () => {
    mockInvoke.mockResolvedValue({ data: mockOrgStats, error: null })

    const { result } = renderHook(() => useOrgStats(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.refetch).toBeDefined()
    expect(typeof result.current.refetch).toBe('function')

    // Trigger manual refetch
    await result.current.refetch()

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledTimes(2) // Initial + manual refetch
    })
  })

  it('should retry failed requests with exponential backoff', async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: null, error: { message: 'Network error' } })
      .mockResolvedValueOnce({ data: null, error: { message: 'Network error' } })
      .mockResolvedValueOnce({ data: mockOrgStats, error: null })

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: 2 },
      },
    })

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useOrgStats(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockInvoke).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })

  it('should have correct stale time', async () => {
    mockInvoke.mockResolvedValue({ data: mockOrgStats, error: null })

    const { result } = renderHook(() => useOrgStats(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Data should be fresh for 5 minutes (staleTime: 5 * 60 * 1000)
    expect(result.current.isStale).toBe(false)
  })

  it('should expose all query properties', async () => {
    mockInvoke.mockResolvedValue({ data: mockOrgStats, error: null })

    const { result } = renderHook(() => useOrgStats(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current).toHaveProperty('data')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('isError')
    expect(result.current).toHaveProperty('error')
    expect(result.current).toHaveProperty('refetch')
    expect(result.current).toHaveProperty('isSuccess')
  })
})
