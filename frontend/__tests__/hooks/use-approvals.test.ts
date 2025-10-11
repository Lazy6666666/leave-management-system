/**
 * Unit Tests for useApprovals Hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useApprovals, useApproveLeave, useRejectLeave } from '@/hooks/use-approvals'
import type { ReactNode } from 'react'

const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()
const mockOrder = vi.fn()

vi.mock('@/lib/supabase-client', () => ({
  getBrowserClient: () => ({
    from: mockFrom,
  }),
}))

global.fetch = vi.fn()

describe('useApprovals', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    vi.clearAllMocks()

    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ order: mockOrder, gte: mockGte, lte: mockLte })
    mockGte.mockReturnValue({ lte: mockLte, eq: mockEq })
    mockLte.mockReturnValue({ eq: mockEq })
    mockOrder.mockResolvedValue({ data: [], error: null })
  })

  afterEach(() => {
    queryClient.clear()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const mockLeave = {
    id: '1',
    status: 'pending',
    requester: { id: '1', full_name: 'John Doe', department: 'Engineering' },
    leave_type: { id: '1', name: 'Annual Leave' },
  }

  it('should fetch pending approvals', async () => {
    mockOrder.mockResolvedValue({ data: [mockLeave], error: null })

    const { result } = renderHook(() => useApprovals(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockLeave])
  })

  it('should filter by date range', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })

    renderHook(() => useApprovals({ startDate: '2025-01-01', endDate: '2025-12-31' }), { wrapper })

    await waitFor(() => expect(mockGte).toHaveBeenCalledWith('start_date', '2025-01-01'))
  })

  it('should filter by department on client side', async () => {
    const leaves = [
      { ...mockLeave, requester: { ...mockLeave.requester, department: 'Engineering' } },
      { ...mockLeave, id: '2', requester: { ...mockLeave.requester, department: 'Sales' } },
    ]
    mockOrder.mockResolvedValue({ data: leaves, error: null })

    const { result } = renderHook(() => useApprovals({ department: 'Engineering' }), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].requester?.department).toBe('Engineering')
  })
})

describe('useApproveLeave', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should approve leave request', async () => {
    const { result } = renderHook(() => useApproveLeave(), { wrapper })

    result.current.mutate({ leaveId: '1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(global.fetch).toHaveBeenCalledWith('/api/leaves/1/approve', expect.any(Object))
  })

  it('should handle approval error', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Approval failed' }),
    })

    const { result } = renderHook(() => useApproveLeave(), { wrapper })

    result.current.mutate({ leaveId: '1' })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useRejectLeave', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should reject leave request with reason', async () => {
    const { result } = renderHook(() => useRejectLeave(), { wrapper })

    result.current.mutate({ leaveId: '1', reason: 'Insufficient staffing' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/leaves/1/reject',
      expect.objectContaining({
        body: JSON.stringify({ reason: 'Insufficient staffing' }),
      })
    )
  })
})
