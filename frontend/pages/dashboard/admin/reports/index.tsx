import { useState } from 'react'
import { useAdminReports } from '@/hooks/use-admin'
import { useReportData } from '@/hooks/use-reports'
import { SummaryCard } from '@/components/admin/summary-cards'
import type { 
  LeaveUsageReportItem, 
  LeaveByTypeReportItem, 
  LeaveByDepartmentReportItem, 
  LeaveTrendsReportItem, 
  EmployeeBalancesReportItem 
} from '@/lib/types'
import { StatCard } from '@/components/ui/stat-card'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Skeleton } from '@/ui/skeleton'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Label } from '@/ui/label'
import { Input } from '@/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import { Users, UserCheck, UserCog, Clock, FileWarning, Bell, BarChart3, TrendingUp, AlertCircle, Download, Filter } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Papa from 'papaparse'

const REPORT_TYPES = [
  { value: 'overview', label: 'Overview' },
  { value: 'leave-usage', label: 'Leave Usage Summary' },
  { value: 'leave-by-type', label: 'Leaves by Type' },
  { value: 'leave-by-department', label: 'Leaves by Department' },
  { value: 'leave-trends', label: 'Leave Trends' },
  { value: 'employee-balances', label: 'Employee Balances' },
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D']

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('overview')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [department, setDepartment] = useState('')
  const [leaveTypeId, setLeaveTypeId] = useState('')

  const { data, isLoading, isError, error } = useAdminReports()
  const { 
    data: reportData, 
    isLoading: isReportLoading, 
    isError: isReportError 
  } = useReportData(reportType, { startDate, endDate, department, leaveTypeId })

  const handleExportCSV = () => {
    if (!reportData?.data) return

    let csvData: Record<string, string | number>[] = []
    let filename = `report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`

    switch (reportType) {
      case 'leave-usage':
        csvData = (reportData.data as LeaveUsageReportItem[]).map((item) => ({
          'Employee': item.requester?.full_name || 'N/A',
          'Department': item.requester?.department || 'N/A',
          'Leave Type': item.leave_type?.name || 'N/A',
          'Start Date': item.start_date,
          'End Date': item.end_date,
          'Days': item.days_count,
          'Status': item.status,
        }))
        break
      case 'leave-by-type':
        csvData = (reportData.data as LeaveByTypeReportItem[]).map((item) => ({
          'Leave Type': item.leaveTypeName,
          'Total Requests': item.totalRequests,
          'Total Days': item.totalDays,
        }))
        break
      case 'leave-by-department':
        csvData = (reportData.data as LeaveByDepartmentReportItem[]).map((item) => ({
          'Department': item.department,
          'Total Requests': item.totalRequests,
          'Total Days': item.totalDays,
        }))
        break
      case 'leave-trends':
        csvData = (reportData.data as LeaveTrendsReportItem[]).map((item) => ({
          'Month': item.month,
          'Total Requests': item.totalRequests,
          'Total Days': item.totalDays,
        }))
        break
      case 'employee-balances':
        csvData = (reportData.data as EmployeeBalancesReportItem[]).map((item) => ({
          'Employee': item.employeeName,
          'Department': item.department,
          'Role': item.role,
          'Total Allocated': item.totalAllocated,
          'Total Used': item.totalUsed,
          'Total Available': item.totalAvailable,
        }))
        break
      default:
        return
    }

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleResetFilters = () => {
    setStartDate('')
    setEndDate('')
    setDepartment('')
    setLeaveTypeId('')
  }

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 md:p-8">
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
      <div className="space-y-8 p-6 md:p-8">
        <PageHeader
          title="Reports & Analytics"
          description="Comprehensive organization-wide metrics and insights"
        />
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">Failed to load reports</p>
                <p className="text-sm text-destructive/80 mt-1">
                  {error instanceof Error ? error.message : 'Failed to load reports'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const summary = data?.summary

  const organizationStats = [
    {
      title: 'Total Employees',
      value: summary?.totalEmployees ?? 0,
      description: 'Active employees',
      icon: Users
    },
    {
      title: 'Total Managers',
      value: summary?.totalManagers ?? 0,
      description: 'Active managers',
      icon: UserCheck
    },
    {
      title: 'Total HR',
      value: summary?.totalHr ?? 0,
      description: 'HR personnel',
      icon: UserCog
    },
    {
      title: 'Pending Leave Requests',
      value: summary?.pendingLeaves ?? 0,
      description: 'Awaiting approval',
      icon: Clock
    },
    {
      title: 'Documents Expiring Soon',
      value: summary?.documentsExpiringSoon ?? 0,
      description: 'Within 30 days',
      icon: FileWarning
    },
    {
      title: 'Notifications Sent',
      value: summary?.notificationsLast7Days ?? 0,
      description: 'Last 7 days',
      icon: Bell
    }
  ]

  return (
    <div className="space-y-8 p-6 md:p-8">
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive organization-wide metrics and insights"
      />

      {/* Report Type Selector and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Configuration
          </CardTitle>
          <CardDescription>Select report type and apply filters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {reportType !== 'overview' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    type="text"
                    placeholder="e.g., Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leave-type">Leave Type ID</Label>
                  <Input
                    id="leave-type"
                    type="text"
                    placeholder="Leave type UUID"
                    value={leaveTypeId}
                    onChange={(e) => setLeaveTypeId(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          {reportType !== 'overview' && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
              {reportData?.data && (
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overview Section */}
      {reportType === 'overview' && (
        <>
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">Organization Overview</h3>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {organizationStats.map((stat) => {
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
          </section>

          {/* Leave Statistics Table */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Leave Statistics</h3>
                <p className="text-sm text-muted-foreground">Detailed breakdown of leave allocation and usage</p>
              </div>
            </div>

            {Array.isArray(summary?.leaveStatistics) && summary.leaveStatistics.length > 0 ? (
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Leave Type</TableHead>
                        <TableHead className="font-semibold text-right">Allocated</TableHead>
                        <TableHead className="font-semibold text-right">Used</TableHead>
                        <TableHead className="font-semibold text-right">Pending</TableHead>
                        <TableHead className="font-semibold text-right">Available</TableHead>
                        <TableHead className="font-semibold text-right">Utilization</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(Array.isArray(summary.leaveStatistics) ? summary.leaveStatistics : []).map((stat) => {
                        const utilization = stat.utilization_percentage ?? 0
                        const isHighUtilization = utilization > 80
                        
                        return (
                          <TableRow key={stat.leave_type_id} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">{stat.leave_type_name}</TableCell>
                            <TableCell className="text-right tabular-nums">{stat.allocated_days ?? 0}</TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">{stat.used_days ?? 0}</TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">{stat.pending_days ?? 0}</TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">{stat.available_days ?? 0}</TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={isHighUtilization ? 'default' : 'secondary'}
                                className={isHighUtilization ? 'bg-warning text-warning-foreground' : ''}
                              >
                                {utilization.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No leave statistics available"
                description="Statistics will appear once leave allocations and requests are created"
              />
            )}
          </section>

          {/* Key Insights */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Key Insights</h3>
                <p className="text-sm text-muted-foreground">Important metrics at a glance</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-base font-medium">Leave Approval Rate</CardTitle>
                  <CardDescription>Average utilization across all leave types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-success tabular-nums">
                      {summary && Array.isArray(summary.leaveStatistics) && summary.leaveStatistics.length > 0
                        ? (
                            (summary.leaveStatistics.reduce((acc, s) => acc + (s.used_days ?? 0), 0) /
                              summary.leaveStatistics.reduce((acc, s) => acc + (s.allocated_days ?? 0), 0)) *
                            100
                          ).toFixed(1)
                        : '0.0'}
                      %
                    </p>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-success h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${summary && Array.isArray(summary.leaveStatistics) && summary.leaveStatistics.length > 0
                            ? Math.min(
                                (summary.leaveStatistics.reduce((acc, s) => acc + (s.used_days ?? 0), 0) /
                                  summary.leaveStatistics.reduce((acc, s) => acc + (s.allocated_days ?? 0), 0)) *
                                100,
                                100
                              )
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-base font-medium">Pending Actions</CardTitle>
                  <CardDescription>Leave requests awaiting manager approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-warning tabular-nums">{summary?.pendingLeaves ?? 0}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Requires immediate attention</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      )}

      {/* Leave Usage Report */}
      {reportType === 'leave-usage' && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Leave Usage Summary</h3>
          {isReportLoading ? (
            <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ) : isReportError ? (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-6">
                <p className="text-destructive">Failed to load report data</p>
              </CardContent>
            </Card>
          ) : reportData?.summary ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard title="Total Requests" value={reportData.summary.totalRequests} />
                <StatCard title="Total Days" value={reportData.summary.totalDays} />
                <StatCard title="Approved Days" value={reportData.summary.approvedDays} />
                <StatCard title="Pending Days" value={reportData.summary.pendingDays} />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Leave Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Leave Type</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead className="text-right">Days</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(reportData.data as LeaveUsageReportItem[])?.map((leave) => (
                          <TableRow key={leave.id}>
                            <TableCell>{leave.requester?.full_name || 'N/A'}</TableCell>
                            <TableCell>{leave.requester?.department || 'N/A'}</TableCell>
                            <TableCell>{leave.leave_type?.name || 'N/A'}</TableCell>
                            <TableCell>{new Date(leave.start_date).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(leave.end_date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">{leave.days_count}</TableCell>
                            <TableCell>
                              <Badge variant={leave.status === 'approved' ? 'default' : 'secondary'}>
                                {leave.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No data available"
              description="Try adjusting your filters"
            />
          )}
        </section>
      )}

      {/* Leave by Type Report */}
      {reportType === 'leave-by-type' && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Leaves by Type</h3>
          {isReportLoading ? (
            <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
          ) : isReportError ? (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-6">
                <p className="text-destructive">Failed to load report data</p>
              </CardContent>
            </Card>
          ) : reportData?.data && reportData.data.length > 0 ? (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Leave Requests by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reportData.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="leaveTypeName" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="totalRequests" fill="#0088FE" name="Total Requests" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Leave Days Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={reportData.data}
                          dataKey="totalDays"
                          nameKey="leaveTypeName"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {(reportData.data as LeaveByTypeReportItem[]).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Detailed Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Leave Type</TableHead>
                        <TableHead className="text-right">Total Requests</TableHead>
                        <TableHead className="text-right">Total Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(reportData.data as LeaveByTypeReportItem[]).map((item) => (
                        <TableRow key={item.leaveTypeId}>
                          <TableCell className="font-medium">{item.leaveTypeName}</TableCell>
                          <TableCell className="text-right">{item.totalRequests}</TableCell>
                          <TableCell className="text-right">{item.totalDays}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No data available"
              description="Try adjusting your filters"
            />
          )}
        </section>
      )}

      {/* Leave by Department Report */}
      {reportType === 'leave-by-department' && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Leaves by Department</h3>
          {isReportLoading ? (
            <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
          ) : isReportError ? (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-6">
                <p className="text-destructive">Failed to load report data</p>
              </CardContent>
            </Card>
          ) : reportData?.data && reportData.data.length > 0 ? (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Requests by Department</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reportData.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="department" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="totalRequests" fill="#00C49F" name="Total Requests" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Days by Department</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={reportData.data}
                          dataKey="totalDays"
                          nameKey="department"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {(reportData.data as LeaveByDepartmentReportItem[]).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Detailed Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Total Requests</TableHead>
                        <TableHead className="text-right">Total Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(reportData.data as LeaveByDepartmentReportItem[]).map((item) => (
                        <TableRow key={item.department}>
                          <TableCell className="font-medium">{item.department}</TableCell>
                          <TableCell className="text-right">{item.totalRequests}</TableCell>
                          <TableCell className="text-right">{item.totalDays}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No data available"
              description="Try adjusting your filters"
            />
          )}
        </section>
      )}

      {/* Leave Trends Report */}
      {reportType === 'leave-trends' && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Leave Trends Over Time</h3>
          {isReportLoading ? (
            <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
          ) : isReportError ? (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-6">
                <p className="text-destructive">Failed to load report data</p>
              </CardContent>
            </Card>
          ) : reportData?.data && reportData.data.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Leave Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={reportData.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="totalRequests" stroke="#8884D8" name="Total Requests" />
                      <Line type="monotone" dataKey="totalDays" stroke="#82CA9D" name="Total Days" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detailed Monthly Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Total Requests</TableHead>
                        <TableHead className="text-right">Total Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(reportData.data as LeaveTrendsReportItem[]).map((item) => (
                        <TableRow key={item.month}>
                          <TableCell className="font-medium">{item.month}</TableCell>
                          <TableCell className="text-right">{item.totalRequests}</TableCell>
                          <TableCell className="text-right">{item.totalDays}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No data available"
              description="Try adjusting your filters"
            />
          )}
        </section>
      )}

      {/* Employee Balances Report */}
      {reportType === 'employee-balances' && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Employee Leave Balances</h3>
          {isReportLoading ? (
            <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
          ) : isReportError ? (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-6">
                <p className="text-destructive">Failed to load report data</p>
              </CardContent>
            </Card>
          ) : reportData?.data && reportData.data.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Employee Leave Balance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Allocated</TableHead>
                        <TableHead className="text-right">Used</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(reportData.data as EmployeeBalancesReportItem[]).map((item) => (
                        <TableRow key={item.userId}>
                          <TableCell className="font-medium">{item.employeeName}</TableCell>
                          <TableCell>{item.department}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.role}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.totalAllocated}</TableCell>
                          <TableCell className="text-right">{item.totalUsed}</TableCell>
                          <TableCell className="text-right">
                            <span className={item.totalAvailable < 5 ? 'text-warning font-semibold' : ''}>
                              {item.totalAvailable}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={Users}
              title="No data available"
              description="Try adjusting your filters"
            />
          )}
        </section>
      )}
    </div>
  )
}
