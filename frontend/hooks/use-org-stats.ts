/**
 * Hook for fetching organizational statistics from Edge Function
 * Phase 2: Admin Dashboard Live Intelligence & Data Visualization
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase-client'

interface OrgStats {
  last_refreshed: string
  employee_stats: {
    total_employees: number
    total_managers: number
    total_hr: number
    total_admins: number
    total_active_users: number
    total_inactive_users: number
  }
  department_stats: Array<{
    department: string
    employee_count: number
    manager_count: number
  }> | null
  current_year_leave_stats: {
    pending_leaves: number
    approved_leaves: number
    rejected_leaves: number
    cancelled_leaves: number
    total_leaves: number
    total_approved_days: number
    avg_leave_duration: number
  }
  leave_type_stats: Array<{
    leave_type_id: string
    leave_type_name: string
    total_requests: number
    approved_requests: number
    pending_requests: number
    rejected_requests: number
    total_days_taken: number
    avg_days_per_request: number
  }> | null
  monthly_trends: Array<{
    month_num: number
    month_name: string
    total_requests: number
    approved_requests: number
    total_days: number
  }> | null
  top_requesters: Array<{
    employee_id: string
    full_name: string
    department: string
    role: string
    total_requests: number
    total_days_taken: number
  }> | null
  department_leave_stats: Array<{
    department: string
    total_requests: number
    approved_requests: number
    pending_requests: number
    total_days_taken: number
    avg_days_per_employee: number
  }> | null
  approval_metrics: {
    total_processed: number
    total_approved: number
    total_rejected: number
    avg_approval_time_hours: number
    approval_rate: number
    overdue_pending_requests: number
  }
  meta?: {
    response_time_ms: number
    user: string
  }
}

async function fetchOrgStats(): Promise<OrgStats> {
  const supabase = getBrowserClient()

  const { data, error } = await supabase.functions.invoke('get-org-stats', {
    method: 'GET'
  })

  if (error) {
    throw new Error(`Failed to fetch org stats: ${error.message}`)
  }

  if (!data) {
    throw new Error('No data returned from get-org-stats')
  }

  return data as OrgStats
}

interface UseOrgStatsOptions {
  refetchInterval?: number
  enabled?: boolean
}

export function useOrgStats(options?: UseOrgStatsOptions) {
  const queryClient = useQueryClient()
  const supabase = getBrowserClient()

  const { refetchInterval = 30000, enabled = true } = options || {}

  // Set up real-time subscriptions for data invalidation
  useEffect(() => {
    if (!supabase || !enabled) return

    const channels = [
      supabase
        .channel('org-stats-profiles')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => {
            queryClient.invalidateQueries({ queryKey: ['org-stats'] })
          }
        )
        .subscribe(),

      supabase
        .channel('org-stats-leaves')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'leaves' },
          () => {
            queryClient.invalidateQueries({ queryKey: ['org-stats'] })
          }
        )
        .subscribe()
    ]

    return () => {
      channels.forEach(channel => channel.unsubscribe())
    }
  }, [queryClient, supabase, enabled])

  const query = useQuery<OrgStats>({
    queryKey: ['org-stats'],
    queryFn: fetchOrgStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval,
    refetchOnWindowFocus: true,
    enabled,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
  })

  const refetch = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ['org-stats'] })
  }, [queryClient])

  return {
    ...query,
    refetch
  }
}
