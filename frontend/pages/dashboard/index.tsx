import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { subscribeToLeaveRequests, unsubscribeFromChannel } from '../../lib/realtime'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Skeleton } from '@/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { NoNotificationsEmpty } from '@/lib/production-cleanup/empty-state-templates'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge, getStatusIcon, type LeaveStatus } from '@/components/ui/status-badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/ui/dialog"
import { LeaveRequestForm, type LeaveRequestFormSubmitData } from '@/components/features/leave-request-form'
import { useLeaveTypes } from '@/hooks/use-leave-types'
import { useToast } from '@/hooks/use-toast'
import { getBrowserClient } from '@/lib/supabase-client'
import { uploadDocumentWithMetadata } from '@/lib/storage-utils'
import { useUserProfile } from '@/hooks/use-user-profile'
import {
  Calendar,
  Clock,
  FileText,
  Users,
  Plus,
  Bell,
  Settings,
  Loader2
} from 'lucide-react'

export default function DashboardPage() {
  const [currentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const [showLeaveRequestForm, setShowLeaveRequestForm] = useState(false)

  const { data: leaveTypes, isLoading: isLoadingLeaveTypes } = useLeaveTypes()

  const supabase = getBrowserClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
      }
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    if (!currentUserId) return;
    const channel = subscribeToLeaveRequests(currentUserId);
    return () => {
      unsubscribeFromChannel(channel);
    };
  }, [currentUserId]);

  const user = {
    name: 'User',
    role: 'Employee',
    department: 'Department',
    avatar: 'U'
  };

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

  const handleSubmitLeaveRequest = async (data: LeaveRequestFormSubmitData) => {
    try {
      setIsLoading(true)

      // Get current user
      const supabase = getBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      // Calculate days count
      const startDate = new Date(data.start_date)
      const endDate = new Date(data.end_date)
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

      // Create leave request
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leave_type_id: data.leave_type_id,
          start_date: data.start_date,
          end_date: data.end_date,
          reason: data.reason,
          days_count: daysCount,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to create leave request')
      }

      const result = await response.json()
      const leaveRequestId = result.leave?.id

      if (!leaveRequestId) {
        throw new Error('Failed to get leave request ID')
      }

      // Upload documents if any
      if (data.documents && data.documents.length > 0) {
        const uploadPromises = data.documents.map((doc) =>
          uploadDocumentWithMetadata(doc.file, user.id, leaveRequestId)
        )

        const uploadResults = await Promise.allSettled(uploadPromises)

        // Check for upload failures
        const failures = uploadResults.filter(
          (result) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
        )

        if (failures.length > 0) {
          console.warn(`${failures.length} document(s) failed to upload`)
          toast({
            title: 'Partial Success',
            description: `Leave request created, but ${failures.length} document(s) failed to upload`,
            variant: 'default',
          })
        }
      }

      // Show success message
      toast({
        title: 'Success',
        description: 'Leave request submitted successfully',
      })

      setShowLeaveRequestForm(false)
      // Refresh the page to show the new leave request
      router.replace(router.asPath)
    } catch (error) {
      console.error('Failed to submit leave request:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to submit leave request',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setShowLeaveRequestForm(false)
  }

  return (
    <>
      <div className="space-y-6 md:space-y-8 page-transition">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
          <div className="space-y-1.5 md:space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl" suppressHydrationWarning>
              Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 17 ? 'afternoon' : 'evening'}, {user.name.split(' ')[0]}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed" suppressHydrationWarning>
              Welcome to your leave management dashboard
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3" role="group" aria-label="Quick actions">
            <Button variant="outline" size="default" aria-label="View notifications" className="hidden sm:flex" onClick={() => router.push('/dashboard/notifications')}>
              <Bell className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="hidden md:inline">Notifications</span>
              <span className="md:hidden">Alerts</span>
            </Button>
          </div>
        </header>

        {/* New Request Card */}
        <Card role="region" aria-labelledby="new-request-title" className="mb-6 border-2 border-primary/20 shadow-lg shadow-primary/10">
          <CardHeader className="text-center space-y-2 pb-4">
            <CardTitle id="new-request-title" className="text-xl font-semibold tracking-tight">New Leave Request</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Submit a new leave request for approval
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 glass-blue"
              aria-label="Create new leave request"
              onClick={() => setShowLeaveRequestForm(true)}
            >
              <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
              Create New Request
            </Button>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <section aria-label="Leave statistics overview">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading statistics">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-2 border-primary/20 shadow-lg shadow-primary/10">
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
          <Card className="lg:col-span-2 border-2 border-primary/20 shadow-lg shadow-primary/10" role="region" aria-labelledby="recent-requests-title">
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
                    <Button onClick={() => setShowLeaveRequestForm(true)}>
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
                            <p className="text-xs md:text-sm text-muted-foreground leading-tight" suppressHydrationWarning>
                              {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground leading-tight" suppressHydrationWarning>
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
            <Card role="region" aria-labelledby="quick-actions-title" className="bg-card/50 border-primary/20 border-2 shadow-lg shadow-primary/10">
              <CardHeader className="space-y-2 pb-4">
                <CardTitle id="quick-actions-title" className="text-lg font-semibold tracking-tight flex items-center gap-2">
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-sm">
                  Frequently used features and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-3" role="status" aria-label="Loading quick actions">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3" role="grid" aria-label="Quick action buttons">
                    <Link href="/dashboard/team" className="group">
                      <Button
                        className="w-full h-auto p-4 flex-col gap-2 group-hover:bg-accent/50"
                        variant="outline"
                        size="default"
                        aria-label="View team calendar"
                      >
                        <Calendar className="h-5 w-5 text-primary group-hover:text-primary/80" aria-hidden="true" />
                        <span className="text-xs font-medium">Team Calendar</span>
                      </Button>
                    </Link>

                    <Link href="/dashboard/documents" className="group">
                      <Button
                        className="w-full h-auto p-4 flex-col gap-2 group-hover:bg-accent/50"
                        variant="outline"
                        size="default"
                        aria-label="View documents"
                      >
                        <FileText className="h-5 w-5 text-primary group-hover:text-primary/80" aria-hidden="true" />
                        <span className="text-xs font-medium">Documents</span>
                      </Button>
                    </Link>

                    <Link href="/dashboard/profile" className="group">
                      <Button
                        className="w-full h-auto p-4 flex-col gap-2 group-hover:bg-accent/50"
                        variant="outline"
                        size="default"
                        aria-label="View profile settings"
                      >
                        <Settings className="h-5 w-5 text-primary group-hover:text-primary/80" aria-hidden="true" />
                        <span className="text-xs font-medium">Settings</span>
                      </Button>
                    </Link>

                    <Link href="/dashboard/leaves" className="group">
                      <Button
                        className="w-full h-auto p-4 flex-col gap-2 group-hover:bg-accent/50"
                        variant="outline"
                        size="default"
                        aria-label="View all leave requests"
                      >
                        <Clock className="h-5 w-5 text-primary group-hover:text-primary/80" aria-hidden="true" />
                        <span className="text-xs font-medium">My Requests</span>
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Team Leaves */}
            <Card role="region" aria-labelledby="upcoming-leaves-title" className="border-2 border-primary/20 shadow-lg shadow-primary/10">
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
            <Card role="region" aria-labelledby="recent-updates-title" className="border-2 border-primary/20 shadow-lg shadow-primary/10">
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
                          } hidden`}
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
      <Dialog open={showLeaveRequestForm} onOpenChange={setShowLeaveRequestForm}>
        <DialogContent className="sm:max-w-[625px] glass-card">
          <DialogHeader>
            <DialogTitle>New Leave Request</DialogTitle>
            <DialogDescription>
              Fill in the details below to submit a new leave request.
            </DialogDescription>
          </DialogHeader>
          {isLoadingLeaveTypes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <LeaveRequestForm
              leaveTypes={leaveTypes || []}
              onSubmit={handleSubmitLeaveRequest}
              onCancel={handleCancel}
              mode="create"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
