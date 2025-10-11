'use client'

import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getBrowserClient } from '@/lib/supabase-client'

import { DocumentUploadPayload, DocumentQueryParams, documentQuerySchema } from '@/lib/schemas/document'
import type { UpdateUserRolePayload, UpsertLeaveTypePayload } from '@/lib/schemas/admin'
import { LeaveType, CompanyDocument, AuditLog, LeaveTypeStat, AdminSummary } from '@/lib/types'

type ApiError = { error?: { code?: string; message?: string } }

async function fetcher<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError
    throw new Error(error.error?.message ?? 'Request failed')
  }

  return response.json() as Promise<T>
}

export type AdminUsersResponse = {
  users: Array<{ id: string; supabase_id: string; name: string; email: string; role: 'employee' | 'manager' | 'admin' | 'hr'; department?: string | null; is_active: boolean }>
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

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (userId) =>
      fetcher(`/api/admin/users/delete?id=${userId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] })
    },
  })
}

export type CreateUserPayload = {
  email: string;
  password?: string;
  full_name: string;
  role: 'employee' | 'manager' | 'admin' | 'hr';
  department?: string;
  is_active: boolean;
};

export function useAddUser() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; user_id: string }, Error, CreateUserPayload>({
    mutationFn: (payload) =>
      fetcher('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
  });
}

export function useLeaveTypes(options?: { includeInactive?: boolean }) {
  const params = new URLSearchParams()
  if (options?.includeInactive) params.set('includeInactive', 'true')

  return useQuery<{ leaveTypes: LeaveType[] }>({
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

export function useAdminReports(role?: string) {
  const queryClient = useQueryClient()
  const supabase = getBrowserClient()

  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('public:profiles')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [queryClient, supabase])

  const params = new URLSearchParams()
  if (role) params.set('role', role)

  return useQuery<{ summary: AdminSummary }>({
    queryKey: ['admin-reports', role],
    queryFn: async () => {
      try {
        const result = await fetcher<{ summary: AdminSummary }>(`/api/admin/reports?${params.toString()}`)
        console.log('DEBUG - Admin reports loaded successfully:', result)
        return result
      } catch (error) {
        console.error('DEBUG - Admin reports fetch failed:', error)
        throw error
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  })
}

export function useAuditLogs(filters?: { table?: string; userId?: string; enabled?: boolean }) {
  const params = new URLSearchParams()
  if (filters?.table) params.set('table', filters.table)
  if (filters?.userId) params.set('userId', filters.userId)

  return useQuery<{ logs: AuditLog[]; total: number; hasMore: boolean }>({
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

  return useQuery<{ documents: CompanyDocument[]; total: number; hasMore: boolean }>({
    queryKey: ['admin-documents', validatedParams],
    queryFn: () => fetcher('/api/documents?' + searchParams.toString()),
  })
}

export function useDocumentUpload() {
  const queryClient = useQueryClient()

  return useMutation<{ document: CompanyDocument }, Error, DocumentUploadPayload>({
    mutationFn: (payload) =>
      fetcher<{ document: CompanyDocument }>('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] })
    },
  })
}
