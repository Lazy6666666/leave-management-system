import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Skeleton } from '@/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { NoNotificationsEmpty } from '@/lib/production-cleanup/empty-state-templates'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge, getStatusIcon, type LeaveStatus } from '@/components/ui/status-badge'
import { 
  Calendar, 
  Clock, 
  FileText, 
  Users, 
  Plus,
  CalendarDays,
  Bell,
  Settings
} from 'lucide-react'

export default function DashboardPage() {
  const [currentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)

  const user = {
    name: 'User',
    role: 'Employee',
    department: 'Department',
    avatar: 'U'
  }

  const stats = {
    pendingRequests: 0,
    approvedThisMonth: 0,
    remainingDays: 0,
    totalAllocation: 0,
    teamMembers: 0,
    upcomingLeaves: 0
  }

  const recentRequests: Array<{
    id: number
    type: string
    startDate: string
    endDate: string
    status: LeaveStatus
    days: number
    submittedAt: string
  }> = []

  const upcomingLeaves: Array<{
    name: string
    type: string
    dates: string
    avatar: string
  }> = []

  const notifications: Array<{
    id: number
    message: string
    type: string
    time: string
  }> = []



  return (
    <div className="space-y-6 md:space-y-8 page-transition">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div className="space-y-1.5 md:space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 17 ? 'afternoon' : 'evening'}, {user.name.split(' ')[0]}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {user.role} • {user.department} • {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3" role="group" aria-label="Quick actions">
          <Button variant="outline" size="default" aria-label="View notifications" className="hidden sm:flex">
            <Bell className="h-4 w-4 mr-2" aria-hidden="true" />
            <span className="hidden md:inline">Notifications</span>
            <span className="md:hidden">Alerts</span>
          </Button>
          <Link href="/dashboard/leaves/new">
            <Button aria-label="Create new leave request" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">New Request</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <section aria-label="Leave statistics overview">
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading statistics">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" role="list" aria-label="Leave statistics">
          <StatCard
            title="Pending Requests"
            value={stats.pendingRequests}
            icon={Clock}
          />

          <StatCard
            title="Days Used"
            value={stats.approvedThisMonth}
            icon={Calendar}
          />

          <StatCard
            title="Remaining Balance"
            value={stats.remainingDays}
            icon={FileText}
          />

          <StatCard
            title="Team Status"
            value={stats.teamMembers - stats.upcomingLeaves}
            icon={Users}
          />
        </div>
      )}
      </section>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Recent Requests */}
        <Card className="lg:col-span-2" role="region" aria-labelledby="recent-requests-title">
          <CardHeader className="space-y-2 pb-4 md:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <CardTitle id="recent-requests-title" className="text-xl md:text-2xl font-semibold tracking-tight">Recent Leave Requests</CardTitle>
                <CardDescription className="text-sm md:text-base leading-relaxed">
                  Track your latest submissions and their status
                </CardDescription>
              </div>
              <Link href="/dashboard/leaves" className="sm:shrink-0">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3" role="status" aria-label="Loading leave requests">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4 flex-1">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="h-6 w-20 ml-auto" />
                      <Skeleton className="h-3 w-16 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentRequests.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No leave requests yet"
                description="You haven't submitted any leave requests. Click the button below to create your first request."
                action={
                  <Button onClick={() => window.location.href = '/dashboard/leaves/new'}>
                    Request Leave
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2 md:space-y-3" role="list" aria-label="Recent leave requests">
                {recentRequests.map((request) => {
                  const StatusIcon = getStatusIcon(request.status)
                  return (
                    <div key={request.id} role="listitem" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 rounded-lg border hover:border-primary/50 transition-colors duration-200">
                      <div className="flex items-start sm:items-center gap-3 md:gap-4 min-w-0 flex-1">
                        <StatusIcon className="h-4 w-4 flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
                        <div className="space-y-1 min-w-0 flex-1">
                          <p className="font-medium text-sm md:text-base leading-tight truncate">{request.type}</p>
                          <p className="text-xs md:text-sm text-muted-foreground leading-tight">
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground leading-tight">
                            Submitted {new Date(request.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1 sm:text-right shrink-0">
                        <StatusBadge status={request.status} showIcon={false} className="text-xs" />
                        <p className="text-xs md:text-sm text-muted-foreground leading-tight">{request.days} day{request.days > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <aside className="space-y-6" aria-label="Dashboard sidebar">
          {/* Quick Actions */}
          <Card role="region" aria-labelledby="quick-actions-title">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle id="quick-actions-title" className="text-xl font-semibold tracking-tight">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3" role="status" aria-label="Loading quick actions">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <nav className="space-y-3" aria-label="Quick action links">
                  <Link href="/dashboard/leaves/new">
                    <Button className="w-full justify-start" size="default" aria-label="Request new leave">
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                      Request Leave
                    </Button>
                  </Link>
                  <Link href="/dashboard/team">
                    <Button className="w-full justify-start" variant="outline" size="default" aria-label="View team calendar">
                      <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
                      Team Calendar
                    </Button>
                  </Link>
                  <Link href="/dashboard/documents">
                    <Button className="w-full justify-start" variant="outline" size="default" aria-label="View documents">
                      <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                      Documents
                    </Button>
                  </Link>
                  <Link href="/dashboard/profile">
                    <Button className="w-full justify-start" variant="outline" size="default" aria-label="View profile settings">
                      <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                      Settings
                    </Button>
                  </Link>
                </nav>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Team Leaves */}
          <Card role="region" aria-labelledby="upcoming-leaves-title">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle id="upcoming-leaves-title" className="text-xl font-semibold tracking-tight">Upcoming Team Leaves</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                  <Skeleton className="h-9 w-full mt-4" />
                </div>
              ) : (
                <div className="space-y-4" role="list" aria-label="Upcoming team member leaves">
                  {upcomingLeaves.map((leave, index) => (
                    <div key={index} role="listitem" className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {leave.avatar}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium truncate leading-tight">{leave.name}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{leave.type} • {leave.dates}</p>
                      </div>
                    </div>
                  ))}
                  <Link href="/dashboard/team">
                    <Button variant="outline" size="sm" className="w-full mt-4" aria-label="View full team calendar">
                      View Full Calendar
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card role="region" aria-labelledby="recent-updates-title">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle id="recent-updates-title" className="text-xl font-semibold tracking-tight">Recent Updates</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <NoNotificationsEmpty />
              ) : (
                <div className="space-y-4">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="flex gap-3">
                      <div 
                        className={`flex h-2 w-2 mt-2 rounded-full flex-shrink-0 ${
                          notification.type === 'warning' ? 'bg-warning' : 'bg-info'
                        }`}
                        role="img"
                        aria-label={notification.type === 'warning' ? 'Warning' : 'Information'}
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm leading-relaxed">{notification.message}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
