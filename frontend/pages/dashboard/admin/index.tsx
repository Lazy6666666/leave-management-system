import { useAdminReports } from '@/hooks/use-admin'
import { SummaryCard } from '@/components/admin/summary-cards'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Users, UserCheck, UserCog, Clock, FileWarning, Bell, TrendingUp, BarChart3, Loader2 } from 'lucide-react'

export default function AdminOverviewPage() {
  const { data, isLoading, isError, error } = useAdminReports()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading organization data...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
        <p className="text-destructive">{error instanceof Error ? error.message : 'Failed to load summary'}</p>
      </div>
    )
  }

  const summary = data?.summary

  const stats = [
    {
      title: 'Employees',
      value: summary?.totalEmployees ?? 0,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Managers',
      value: summary?.totalManagers ?? 0,
      icon: UserCheck,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'HR',
      value: summary?.totalHr ?? 0,
      icon: UserCog,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pending Leaves',
      value: summary?.pendingLeaves ?? 0,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Documents Expiring',
      value: summary?.documentsExpiringSoon ?? 0,
      icon: FileWarning,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Notifications (7d)',
      value: summary?.notificationsLast7Days ?? 0,
      icon: Bell,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Organization Overview</h2>
        <p className="text-muted-foreground mt-1">Latest snapshot of employee counts and pending actions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.textColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Active count
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>Leave Statistics</CardTitle>
          </div>
          <CardDescription>Overview of leave allocation and usage across the organization</CardDescription>
        </CardHeader>
        <CardContent>
          {summary?.leaveStatistics?.by_leave_type && summary.leaveStatistics.by_leave_type.length > 0 ? (
            <div className="space-y-4">
              {summary.leaveStatistics.by_leave_type.map((stat: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{stat.leave_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {stat.total_requests} request{stat.total_requests !== 1 ? 's' : ''} • {stat.total_days} day{stat.total_days !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{stat.total_days}</p>
                      <p className="text-xs text-muted-foreground">days</p>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((stat.total_days / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{summary.leaveStatistics.total_employees || 0}</p>
                    <p className="text-sm text-muted-foreground">Employees</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.leaveStatistics.total_leaves_pending || 0}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.leaveStatistics.total_leaves_approved || 0}</p>
                    <p className="text-sm text-muted-foreground">Approved</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.leaveStatistics.total_days_taken || 0}</p>
                    <p className="text-sm text-muted-foreground">Days Taken</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No leave statistics available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
