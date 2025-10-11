'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { getBrowserClient } from '@/lib/supabase-client'
import { useAuth } from '@/hooks/use-auth'

export interface EmployeeSearchFilters {
  query?: string
  department?: string
  role?: string
  page?: number
  limit?: number
}

export interface EmployeeLeaveBalance {
  leave_type: string
  allocated: number
  used: number
  remaining: number
}

export interface EmployeeResult {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: string
  department: string
  leave_balance: EmployeeLeaveBalance[]
  created_at: string
}

export interface PaginationMeta {
  current_page: number
  total_pages: number
  total_count: number
  per_page: number
}

export interface SearchResponse {
  employees: EmployeeResult[]
  pagination: PaginationMeta
}

export function useEmployeeSearch(filters: EmployeeSearchFilters) {
  const supabase = getBrowserClient()
  const { user } = useAuth()

  return useQuery({
    queryKey: ['employee-search', filters],
    queryFn: async (): Promise<SearchResponse> => {
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase.functions.invoke('search-employees', {
        body: filters
      })

      if (error) {
        throw new Error(error.message || 'Failed to search employees')
      }

      return data
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useEmployeeExport() {
  const supabase = getBrowserClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (filters?: EmployeeSearchFilters) => {
      if (!user) {
        throw new Error('User not authenticated')
      }

      const response = await supabase.functions.invoke('export-employees', {
        body: filters || {}
      })

      if (response.error) {
        throw new Error(response.error.message || 'Failed to export employees')
      }

      // Handle the blob response for download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `employee-report-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return response
    }
  })
}

export function useDepartments() {
  const supabase = getBrowserClient()

  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name')

      if (error) {
        throw new Error(error.message || 'Failed to load departments')
      }

      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
