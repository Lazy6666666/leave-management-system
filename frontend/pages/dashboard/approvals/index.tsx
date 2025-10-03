import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Badge } from '@/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Check, X, Calendar, Clock, User } from 'lucide-react'

export default function ApprovalsPage() {
  // Mock data - in real app this would come from API
  const pendingApprovals = [
    {
      id: 1,
      employee: {
        name: 'Alice Johnson',
        department: 'Engineering',
        avatar: '/placeholder-avatar.jpg'
      },
      type: 'Annual Leave',
      startDate: '2024-01-20',
      endDate: '2024-01-24',
      days: 5,
      reason: 'Family vacation to Europe',
      submittedAt: '2024-01-15',
      urgency: 'normal'
    },
    {
      id: 2,
      employee: {
        name: 'Bob Smith',
        department: 'Marketing',
        avatar: '/placeholder-avatar.jpg'
      },
      type: 'Sick Leave',
      startDate: '2024-01-18',
      endDate: '2024-01-18',
      days: 1,
      reason: 'Medical appointment',
      submittedAt: '2024-01-17',
      urgency: 'high'
    }
  ]

  const teamStats = {
    totalMembers: 12,
    pendingRequests: 5,
    approvedThisMonth: 23,
    rejectedThisMonth: 2
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leave Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve leave requests from your team
        </p>
      </div>

      {/* Team Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.totalMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.pendingRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.approvedThisMonth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.rejectedThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            Leave requests awaiting your review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {pendingApprovals.map((request) => (
            <div key={request.id} className="border rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <Avatar>
                    <AvatarImage src={request.employee.avatar} />
                    <AvatarFallback>
                      {request.employee.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-medium">{request.employee.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {request.employee.department}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{request.type}</Badge>
                        <Badge variant={request.urgency === 'high' ? 'destructive' : 'default'}>
                          {request.urgency} priority
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {request.startDate} - {request.endDate}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {request.days} days
                        </div>
                      </div>
                      <p className="text-sm">{request.reason}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive">
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
