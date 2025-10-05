'use client'

import { useQuery } from '@tanstack/react-query'
import { getBrowserClient } from '@/lib/supabase-client'
import type { Profile } from '@/types'

const supabase = getBrowserClient()

export interface CalendarLeave {
  date: string
  employees: {
    id: string
    name: string
    leaveType: string
    status: 'pending' | 'approved'
  }[]
}

interface UseTeamCalendarOptions {
  currentMonth: Date
  enabled?: boolean
}

/**
 * Hook to fetch team calendar data for current and adjacent months
 * Uses React Query with 5-minute stale time caching
 */
export function useTeamCalendar(options: UseTeamCalendarOptions) {
  const { currentMonth, enabled = true } = options

  return useQuery<CalendarLeave[], Error>({
    queryKey: ['team-calendar', currentMonth.getFullYear(), currentMonth.getMonth()],
    queryFn: async () => {
      // Calculate date range: previous month, current month, next month
      const startOfPrevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      const endOfNextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0)

      // Format dates for Supabase query
      const startDate = startOfPrevMonth.toISOString().split('T')[0]
      const endDate = endOfNextMonth.toISOString().split('T')[0]

      // Fetch leave requests with relations
      const { data, error } = await supabase
        .from('leaves')
        .select(`
          id,
          start_date,
          end_date,
          status,
          requester:profiles!requester_id(id, full_name),
          leave_type:leave_types(id, name)
        `)
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)
        .in('status', ['pending', 'approved'])
        .order('start_date', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      // Transform data into calendar format
      const calendarData: Map<string, CalendarLeave> = new Map()

      data?.forEach((leave: { 
        start_date: string
        end_date: string
        requester?: { full_name: string }
        leave_type?: { name: string }
        status: string
      }) => {
        const startDate = new Date(leave.start_date)
        const endDate = new Date(leave.end_date)

        // Iterate through each day of the leave
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateKey = d?.toISOString().split('T')[0]
          if (!dateKey) return

          if (!calendarData.has(dateKey)) {
            calendarData.set(dateKey, {
              date: dateKey,
              employees: [],
            })
          }

          calendarData.get(dateKey)!.employees.push({
            id: (leave.requester as Profile)?.id || '',
            name: leave.requester?.full_name || 'Unknown',
            leaveType: leave.leave_type?.name || 'Unknown',
            status: leave.status as 'pending' | 'approved',
          })
        }
      })

      return Array.from(calendarData.values())
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
