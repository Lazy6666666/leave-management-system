import { useQuery } from '@tanstack/react-query'

interface ReportFilters {
  startDate?: string
  endDate?: string
  department?: string
  leaveTypeId?: string
}

async function fetchReportData(reportType: string, filters: ReportFilters) {
  if (reportType === 'overview') {
    return null
  }

  const params = new URLSearchParams()
  
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)
  if (filters.department) params.append('department', filters.department)
  if (filters.leaveTypeId) params.append('leaveTypeId', filters.leaveTypeId)

  const response = await fetch(`/api/admin/reports/${reportType}?${params.toString()}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to fetch report data')
  }

  return response.json()
}

export function useReportData(reportType: string, filters: ReportFilters) {
  return useQuery({
    queryKey: ['admin-report', reportType, filters],
    queryFn: () => fetchReportData(reportType, filters),
    enabled: reportType !== 'overview',
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  })
}
