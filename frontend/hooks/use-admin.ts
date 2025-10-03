'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { DocumentUploadPayload, DocumentQueryParams, documentQuerySchema } from '@/lib/schemas/document'
import type { UpdateUserRolePayload, UpsertLeaveTypePayload } from '@/lib/schemas/admin'

type ApiError = { error?: { code?: string; message?: string } }

async function fetcher<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError
    throw new Error(error.error?.message ?? 'Request failed')
  }

  return response.json() as Promise<T>
}

type AdminUsersResponse = {
  users: Array<{ id: string; full_name: string; email: string; role: string; department?: string | null; is_active: boolean }>
  total: number
  hasMore: boolean
}

export function useAdminUsers(filters?: { role?: string; search?: string; enabled?: boolean }) {
  const params = new URLSearchParams()
  if (filters?.role) params.set('role', filters.role)
  if (filters?.search) params.set('search', filters.search)

  return useQuery<AdminUsersResponse>({
    queryKey: ['admin-users', filters],
    queryFn: () => fetcher<AdminUsersResponse>(`/api/admin/users?${params.toString()}`),
    enabled: filters?.enabled ?? true,
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation<{ success: boolean }, Error, UpdateUserRolePayload>({
    mutationFn: (payload) =>
      fetcher('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
    },
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (userId) =>
      fetcher(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
    },
  })
}

export function useLeaveTypes(options?: { includeInactive?: boolean }) {
  const params = new URLSearchParams()
  if (options?.includeInactive) params.set('includeInactive', 'true')

  return useQuery<{ leaveTypes: any[] }>({
    queryKey: ['admin-leave-types', options],
    queryFn: () => fetcher(`/api/admin/leave-types?${params.toString()}`),
  })
}

export function useUpsertLeaveType() {
  const queryClient = useQueryClient()

  return useMutation<{ success: boolean; id: string }, Error, UpsertLeaveTypePayload>({
    mutationFn: (payload) =>
      fetcher('/api/admin/leave-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leave-types'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
    },
  })
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient()

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) =>
      fetcher(`/api/admin/leave-types?id=${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-leave-types'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
    },
  })
}

export function useAdminReports() {
  return useQuery<{ summary: any }>({
    queryKey: ['admin-reports'],
    queryFn: () => fetcher('/api/admin/reports'),
  })
}

export function useAuditLogs(filters?: { table?: string; userId?: string; enabled?: boolean }) {
  const params = new URLSearchParams()
  if (filters?.table) params.set('table', filters.table)
  if (filters?.userId) params.set('userId', filters.userId)

  return useQuery<{ logs: any[]; total: number; hasMore: boolean }>({
    queryKey: ['admin-audit-logs', filters],
    queryFn: () => fetcher(`/api/admin/audit-logs?${params.toString()}`),
    enabled: filters?.enabled ?? true,
  })
}

export function useDocumentUploads(params: DocumentQueryParams) {
  const searchParams = new URLSearchParams()
  const validatedParams = documentQuerySchema.parse(params)
  
  Object.entries(validatedParams).forEach(([key, value]) => {
    if (value === undefined) return
    if (Array.isArray(value)) {
      searchParams.set(key, JSON.stringify(value))
    } else {
      searchParams.set(key, String(value))
    }
  })

  return useQuery<{ documents: any[]; total: number; hasMore: boolean }>({
    queryKey: ['admin-documents', validatedParams],
    queryFn: () => fetcher('/api/documents?' + searchParams.toString()),
  })
}

export function useDocumentUpload() {
  const queryClient = useQueryClient()

  return useMutation<{ document: any }, Error, DocumentUploadPayload>({
    mutationFn: (payload) =>
      fetcher<{ document: any }>('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
    },
  })
}
