'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getBrowserClient } from '@/lib/supabase-client'
import type { Leave } from '@/types'

const supabase = getBrowserClient()

interface UpdateLeavePayload {
  id: string
  start_date: string
  end_date: string
  leave_type_id: string
  reason?: string
  days_count: number
}

interface UpdateLeaveResponse {
  leave: Leave
}

interface MutationContext {
  previousLeaves: unknown
  previousLeave: unknown
}

/**
 * Hook to update a leave request with optimistic updates
 * Only allows editing pending leave requests
 */
export function useLeaveEdit() {
  const queryClient = useQueryClient()

  return useMutation<UpdateLeaveResponse, Error, UpdateLeavePayload, MutationContext>({
    mutationFn: async (payload) => {
      const { id, ...updateData } = payload

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Verify the leave request exists and is pending
      const { data: existingLeave, error: fetchError } = await supabase
        .from('leaves')
        .select('id, status, requester_id')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch leave request: ${fetchError.message}`)
      }

      if (!existingLeave) {
        throw new Error('Leave request not found')
      }

      // Check if user owns the leave request
      if (existingLeave.requester_id !== user.id) {
        throw new Error('You can only edit your own leave requests')
      }

      // Check if leave is still pending
      if (existingLeave.status !== 'pending') {
        throw new Error('Only pending leave requests can be edited')
      }

      // Update the leave request with audit trail
      const { data: updatedLeave, error: updateError } = await supabase
        .from('leaves')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update leave request: ${updateError.message}`)
      }

      return { leave: updatedLeave }
    },
    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['leaves'] })
      await queryClient.cancelQueries({ queryKey: ['leave-with-documents', payload.id] })

      // Snapshot previous values
      const previousLeaves = queryClient.getQueryData(['leaves'])
      const previousLeave = queryClient.getQueryData(['leave-with-documents', payload.id])

      // Optimistically update the cache
      queryClient.setQueryData(['leave-with-documents', payload.id], (old: Leave | undefined) => {
        if (!old) return old
        return {
          ...old,
          ...payload,
          updated_at: new Date().toISOString(),
        }
      })

      // Return context with previous values
      return { previousLeaves, previousLeave }
    },
    onError: (error, payload, context) => {
      // Rollback on error
      if (context?.previousLeaves) {
        queryClient.setQueryData(['leaves'], context.previousLeaves)
      }
      if (context?.previousLeave) {
        queryClient.setQueryData(['leave-with-documents', payload.id], context.previousLeave)
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['leave-with-documents', data.leave.id] })
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] })
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

interface CancelLeavePayload {
  id: string
}

/**
 * Hook to cancel a leave request
 * Only allows canceling pending or approved leave requests
 */
export function useCancelLeave() {
  const queryClient = useQueryClient()

  return useMutation<UpdateLeaveResponse, Error, CancelLeavePayload, MutationContext>({
    mutationFn: async ({ id }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Verify the leave request exists
      const { data: existingLeave, error: fetchError } = await supabase
        .from('leaves')
        .select('id, status, requester_id, start_date')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch leave request: ${fetchError.message}`)
      }

      if (!existingLeave) {
        throw new Error('Leave request not found')
      }

      // Check if user owns the leave request
      if (existingLeave.requester_id !== user.id) {
        throw new Error('You can only cancel your own leave requests')
      }

      // Check if leave can be cancelled
      if (existingLeave.status === 'cancelled' || existingLeave.status === 'rejected') {
        throw new Error('This leave request cannot be cancelled')
      }

      // Check if leave has already started
      const startDate = new Date(existingLeave.start_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (startDate < today) {
        throw new Error('Cannot cancel a leave request that has already started')
      }

      // Update status to cancelled
      const { data: updatedLeave, error: updateError } = await supabase
        .from('leaves')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to cancel leave request: ${updateError.message}`)
      }

      return { leave: updatedLeave }
    },
    onMutate: async ({ id }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['leaves'] })
      await queryClient.cancelQueries({ queryKey: ['leave-with-documents', id] })

      // Snapshot previous values
      const previousLeaves = queryClient.getQueryData(['leaves'])
      const previousLeave = queryClient.getQueryData(['leave-with-documents', id])

      // Optimistically update the cache
      queryClient.setQueryData(['leave-with-documents', id], (old: Leave | undefined) => {
        if (!old) return old
        return {
          ...old,
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        }
      })

      // Return context with previous values
      return { previousLeaves, previousLeave }
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousLeaves) {
        queryClient.setQueryData(['leaves'], context.previousLeaves)
      }
      if (context?.previousLeave) {
        queryClient.setQueryData(['leave-with-documents', id], context.previousLeave)
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['leave-with-documents', data.leave.id] })
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] })
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })
}

/**
 * Hook to validate if a leave request can be edited
 */
export function useCanEditLeave(leaveId: string) {
  return useMutation<boolean, Error, void>({
    mutationFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return false
      }

      // Fetch leave request
      const { data: leave, error } = await supabase
        .from('leaves')
        .select('status, requester_id')
        .eq('id', leaveId)
        .single()

      if (error || !leave) {
        return false
      }

      // Can edit if: owns the request AND status is pending
      return leave.requester_id === user.id && leave.status === 'pending'
    },
  })
}
