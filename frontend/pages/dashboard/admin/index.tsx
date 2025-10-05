import { useAdminReports } from '@/hooks/use-admin'
import { StatCard } from '@/components/ui/stat-card'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Skeleton } from '@/ui/skeleton'
import { Users, UserCheck, UserCog, Clock, FileWarning, Bell, BarChart3 } from 'lucide-react'
import { LeaveTypeStat } from '@/lib/types'

export default function AdminOverviewPage() {
  const { data, isLoading, isError, error } = useAdminReports()

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
              <div>
                <p className="font-medium text-destructive">Failed to load data</p>
                <p className="text-sm text-destructive/80 mt-1">
                  {error instanceof Error ? error.message : 'Failed to load summary'}
                </p>
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
    </div>
  )
}
