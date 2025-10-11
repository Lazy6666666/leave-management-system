import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'
import { useAdminReports } from '@/hooks/use-admin'
import { useOrgStats } from '@/hooks/use-org-stats'
import { StatCard } from '@/components/ui/stat-card'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Skeleton } from '@/ui/skeleton'
import { Users, UserCheck, UserCog, Clock, FileWarning, Bell, BarChart3 } from 'lucide-react'
import { LeaveTypeStat } from '@/lib/types'
import { OrgChart } from '@/components/features/admin/OrgChart'
import { useMemo } from 'react'

export default function AdminOverviewPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentRole = searchParams.get('role') || 'all'

  const { data, isLoading, isError, error } = useAdminReports(currentRole === 'all' ? undefined : currentRole)
  const { data: orgStats, isLoading: isOrgStatsLoading, isError: isOrgStatsError } = useOrgStats()

  const handleRoleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('role')
    } else {
      params.set('role', value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  // Transform org stats data for OrgChart component
  const chartData = useMemo(() => {
    if (!orgStats) {
      return {
        leaveTypeData: [],
        departmentData: [],
        trendData: []
      }
    }

    // Transform leave_type_stats to leaveTypeData
    const leaveTypeData = orgStats.leave_type_stats?.map(stat => ({
      name: stat.leave_type_name,
      value: stat.total_days_taken,
      percentage: stat.total_requests > 0
        ? Math.round((stat.approved_requests / stat.total_requests) * 100)
        : 0
    })) || []

    // Transform department_leave_stats to departmentData
    const departmentData = orgStats.department_leave_stats?.map(dept => ({
      department: dept.department || 'Unassigned',
      employees: Math.round(dept.avg_days_per_employee) || 0,
      pending: dept.pending_requests,
      approved: dept.approved_requests
    })) || []

    // Transform monthly_trends to trendData
    const trendData = orgStats.monthly_trends?.map(trend => ({
      month: trend.month_name,
      leaves: trend.total_requests,
      approved: trend.approved_requests
    })) || []

    return {
      leaveTypeData,
      departmentData,
      trendData
    }
  }, [orgStats])

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 md:p-8 page-transition">
        <div className="space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    console.error('Admin dashboard error:', error)

    return (
      <div className="space-y-8 p-6 md:p-8 page-transition">
        <PageHeader
          title="Organization Overview"
          description="Latest snapshot of employee counts and pending actions"
        />
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <FileWarning className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-destructive">Failed to load admin dashboard data</p>
                <p className="text-sm text-destructive/80 mt-1">
                  {error instanceof Error ? error.message : 'An unexpected error occurred while fetching summary data'}
                </p>
                <details className="mt-3 text-xs text-destructive/70">
                  <summary className="cursor-pointer hover:text-destructive">Technical details</summary>
                  <pre className="mt-2 p-2 bg-destructive/5 rounded border border-destructive/20 overflow-auto">
                    {error instanceof Error ? error.stack || error.message : JSON.stringify(error, null, 2)}
                  </pre>
                </details>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 text-sm"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const summary = data?.summary

  const stats = [
    {
      title: 'Employees',
      value: summary?.totalEmployees ?? 0,
      description: 'Active employees',
      icon: Users
    },
    {
      title: 'Managers',
      value: summary?.totalManagers ?? 0,
      description: 'Active managers',
      icon: UserCheck
    },
    {
      title: 'HR',
      value: summary?.totalHr ?? 0,
      description: 'HR personnel',
      icon: UserCog
    },
    {
      title: 'Pending Leaves',
      value: summary?.pendingLeaves ?? 0,
      description: 'Awaiting approval',
      icon: Clock
    },
    {
      title: 'Documents Expiring',
      value: summary?.documentsExpiringSoon ?? 0,
      description: 'Expiring soon',
      icon: FileWarning
    },
    {
      title: 'Notifications (7d)',
      value: summary?.notificationsLast7Days ?? 0,
      description: 'Last 7 days',
      icon: Bell
    }
  ]

  return (
    <div className="space-y-6 md:space-y-8 page-transition">
      <PageHeader
        title="Organization Overview"
        description="Latest snapshot of employee counts and pending actions"
      />

      <div className="flex justify-end mb-4">
        <Select value={currentRole} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid with improved spacing */}
      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={Icon}
            />
          )
        })}
      </div>

      {/* Leave Statistics Card with enhanced layout */}
      <Card>
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl">Leave Statistics</CardTitle>
              <CardDescription className="text-sm">
                Overview of leave allocation and usage across the organization
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {summary?.leaveStatistics && 'by_leave_type' in summary.leaveStatistics && summary.leaveStatistics.by_leave_type?.length > 0 ? (
            <>
              {/* Leave Type Breakdown */}
              <div className="space-y-6">
                {summary.leaveStatistics.by_leave_type.map((stat: LeaveTypeStat, index: number) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-semibold text-base truncate">{stat.leave_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {stat.total_requests ?? stat.count} request{(stat.total_requests ?? stat.count) !== 1 ? 's' : ''} • {stat.total_days} day{stat.total_days !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold tabular-nums">{stat.total_days}</p>
                        <p className="text-xs text-muted-foreground">days</p>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.min((stat.total_days / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats Grid */}
              <div className="rounded-lg border bg-muted/50 p-4 md:p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  <div className="text-center space-y-2">
                    <p className="text-3xl font-bold tabular-nums">{('by_leave_type' in summary.leaveStatistics && summary.leaveStatistics.total_employees) || 0}</p>
                    <p className="text-sm text-muted-foreground font-medium">Employees</p>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-3xl font-bold text-warning tabular-nums">{('by_leave_type' in summary.leaveStatistics && summary.leaveStatistics.total_leaves_pending) || 0}</p>
                    <p className="text-sm text-muted-foreground font-medium">Pending</p>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-3xl font-bold text-success tabular-nums">{('by_leave_type' in summary.leaveStatistics && summary.leaveStatistics.total_leaves_approved) || 0}</p>
                    <p className="text-sm text-muted-foreground font-medium">Approved</p>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-3xl font-bold tabular-nums">{('by_leave_type' in summary.leaveStatistics && summary.leaveStatistics.total_days_taken) || 0}</p>
                    <p className="text-sm text-muted-foreground font-medium">Days Taken</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="rounded-full bg-muted/50 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">No leave statistics available</p>
              <p className="text-xs text-muted-foreground mt-1">Statistics will appear once leave requests are submitted</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Organization Analytics Charts */}
      {!isOrgStatsLoading && !isOrgStatsError && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Organization Analytics</h2>
              <p className="text-sm text-muted-foreground">Visual insights into leave patterns and trends</p>
            </div>
            {orgStats?.last_refreshed && (
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(orgStats.last_refreshed).toLocaleString()}
              </p>
            )}
          </div>
          <OrgChart
            leaveTypeData={chartData.leaveTypeData}
            departmentData={chartData.departmentData}
            trendData={chartData.trendData}
          />
        </div>
      )}

      {/* OrgStats Loading State */}
      {isOrgStatsLoading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[300px] w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OrgStats Error State */}
      {isOrgStatsError && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-warning/10 p-2">
                <BarChart3 className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-warning">Unable to load organization analytics</p>
                <p className="text-sm text-warning/80 mt-1">
                  The analytics charts are temporarily unavailable. Other dashboard features are still functional.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
