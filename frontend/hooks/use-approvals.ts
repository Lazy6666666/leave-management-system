"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBrowserClient } from '@/lib/supabase-client'
import type { LeaveWithRelations } from '@/types'

const supabase = getBrowserClient()

interface ApprovalsFilters {
  startDate?: string
  endDate?: string
  employeeId?: string
  leaveTypeId?: string
  department?: string
}

interface ApproveLeaveParams {
  leaveId: string
}

interface RejectLeaveParams {
  leaveId: string
  reason: string
}

export function useApprovals(filters?: ApprovalsFilters) {
  return useQuery({
    queryKey: ['approvals', filters],
    queryFn: async () => {
      let query = supabase
        .from('leaves')
        .select(`
          *,
          requester:employees!leaves_requester_id_fkey(id, name, department, photo_url),
          leave_type:leave_types(id, name, description),
          approver:employees!leaves_approver_id_fkey(id, name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.startDate) {
        query = query.gte('start_date', filters.startDate)
      }

      if (filters?.endDate) {
        query = query.lte('end_date', filters.endDate)
      }

      if (filters?.employeeId) {
        query = query.eq('requester_id', filters.employeeId)
      }

      if (filters?.leaveTypeId) {
        query = query.eq('leave_type_id', filters.leaveTypeId)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Filter by department on client side if needed
      let filteredData = data as LeaveWithRelations[]
      
      if (filters?.department) {
        filteredData = filteredData.filter(
          (leave) => leave.requester?.department === filters.department
        )
      }

      return filteredData
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useApproveLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leaveId }: ApproveLeaveParams) => {
      const response = await fetch(`/api/leaves/${leaveId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve leave request')
      }

      return response.json()
    },
    onMutate: async ({ leaveId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['approvals'] })

      // Snapshot previous value
      const previousApprovals = queryClient.getQueryData(['approvals'])

      // Optimistically update
      queryClient.setQueriesData<LeaveWithRelations[]>(
        { queryKey: ['approvals'] },
        (old) => {
          if (!old) return old
          return old.filter((leave) => leave.id !== leaveId)
        }
      )

      return { previousApprovals }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousApprovals) {
        queryClient.setQueryData(['approvals'], context.previousApprovals)
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
    },
  })
}

export function useRejectLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ leaveId, reason }: RejectLeaveParams) => {
      const response = await fetch(`/api/leaves/${leaveId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject leave request')
      }

      return response.json()
    },
    onMutate: async ({ leaveId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['approvals'] })

      // Snapshot previous value
      const previousApprovals = queryClient.getQueryData(['approvals'])

      // Optimistically update
      queryClient.setQueriesData<LeaveWithRelations[]>(
        { queryKey: ['approvals'] },
        (old) => {
          if (!old) return old
          return old.filter((leave) => leave.id !== leaveId)
        }
      )

      return { previousApprovals }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousApprovals) {
        queryClient.setQueryData(['approvals'], context.previousApprovals)
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
    },
  })
}
