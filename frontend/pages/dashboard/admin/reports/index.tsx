import { useAdminReports } from '@/hooks/use-admin'
import { SummaryCard } from '@/components/admin/summary-cards'
import { Card } from '@/ui/card'

export default function AdminReportsPage() {
  const { data, isLoading, isError, error } = useAdminReports()

  if (isLoading) {
    return <p>Loading reports...</p>
  }

  if (isError) {
    return <p className="text-destructive">{error instanceof Error ? error.message : 'Failed to load reports'}</p>
  }

  const summary = data?.summary

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Reports & Analytics</h2>
        <p className="text-sm text-muted-foreground">Comprehensive organization-wide metrics and insights.</p>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Organization Overview</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SummaryCard title="Total Employees" value={summary?.totalEmployees ?? 0} />
          <SummaryCard title="Total Managers" value={summary?.totalManagers ?? 0} />
          <SummaryCard title="Total HR" value={summary?.totalHr ?? 0} />
          <SummaryCard title="Pending Leave Requests" value={summary?.pendingLeaves ?? 0} description="Awaiting approval" />
          <SummaryCard
            title="Documents Expiring Soon"
            value={summary?.documentsExpiringSoon ?? 0}
            description="Within 30 days"
          />
          <SummaryCard
            title="Notifications Sent"
            value={summary?.notificationsLast7Days ?? 0}
            description="Last 7 days"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Leave Statistics</h3>
        {Array.isArray(summary?.leaveStatistics) && summary.leaveStatistics.length > 0 ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Leave Type</th>
                    <th className="px-4 py-3 text-left font-medium">Total Allocated</th>
                    <th className="px-4 py-3 text-left font-medium">Total Used</th>
                    <th className="px-4 py-3 text-left font-medium">Pending</th>
                    <th className="px-4 py-3 text-left font-medium">Available</th>
                    <th className="px-4 py-3 text-left font-medium">Utilization %</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.leaveStatistics.map((stat: any) => (
                    <tr key={stat.leave_type_id} className="border-b">
                      <td className="px-4 py-3 font-medium">{stat.leave_type_name}</td>
                      <td className="px-4 py-3">{stat.allocated_days ?? 0}</td>
                      <td className="px-4 py-3">{stat.used_days ?? 0}</td>
                      <td className="px-4 py-3">{stat.pending_days ?? 0}</td>
                      <td className="px-4 py-3">{stat.available_days ?? 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            (stat.utilization_percentage ?? 0) > 80
                              ? 'font-semibold text-orange-600'
                              : 'text-muted-foreground'
                          }
                        >
                          {stat.utilization_percentage?.toFixed?.(1) ?? '0.0'}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <p className="text-center text-sm text-muted-foreground">No leave statistics available.</p>
          </Card>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-lg font-semibold">Key Insights</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <h4 className="mb-2 font-medium">Leave Approval Rate</h4>
            <p className="text-2xl font-bold text-green-600">
              {summary?.leaveStatistics?.length > 0
                ? (
                    (summary.leaveStatistics.reduce((acc: number, s: any) => acc + (s.used_days ?? 0), 0) /
                      summary.leaveStatistics.reduce((acc: number, s: any) => acc + (s.allocated_days ?? 0), 0)) *
                    100
                  ).toFixed(1)
                : '0.0'}
              %
            </p>
            <p className="text-xs text-muted-foreground">Average utilization across all leave types</p>
          </Card>

          <Card className="p-4">
            <h4 className="mb-2 font-medium">Pending Actions</h4>
            <p className="text-2xl font-bold text-orange-600">{summary?.pendingLeaves ?? 0}</p>
            <p className="text-xs text-muted-foreground">Leave requests awaiting manager approval</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
