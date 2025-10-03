import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Badge } from '@/ui/badge'
import { Plus, Calendar, Clock } from 'lucide-react'

export default function LeavesPage() {
  // Mock data - in real app this would come from API
  const leaveRequests = [
    {
      id: 1,
      type: 'Annual Leave',
      startDate: '2024-01-15',
      endDate: '2024-01-19',
      status: 'pending',
      days: 5,
      reason: 'Family vacation',
      submittedAt: '2024-01-10'
    },
    {
      id: 2,
      type: 'Sick Leave',
      startDate: '2024-01-10',
      endDate: '2024-01-10',
      status: 'approved',
      days: 1,
      reason: 'Medical appointment',
      submittedAt: '2024-01-09'
    },
    {
      id: 3,
      type: 'Personal Leave',
      startDate: '2024-01-05',
      endDate: '2024-01-05',
      status: 'rejected',
      days: 1,
      reason: 'Personal matter',
      submittedAt: '2024-01-04'
    }
  ]

  const leaveBalance = {
    annual: { used: 7, total: 25, remaining: 18 },
    sick: { used: 2, total: 10, remaining: 8 },
    personal: { used: 1, total: 5, remaining: 4 }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-muted-foreground">
            Manage your leave requests and view your balance
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Annual Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaveBalance.annual.remaining} / {leaveBalance.annual.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {leaveBalance.annual.used} days used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sick Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaveBalance.sick.remaining} / {leaveBalance.sick.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {leaveBalance.sick.used} days used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Personal Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaveBalance.personal.remaining} / {leaveBalance.personal.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {leaveBalance.personal.used} days used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Leave Requests</CardTitle>
          <CardDescription>
            View and manage all your leave requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaveRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{request.type}</h3>
                    <Badge variant={
                      request.status === 'pending' ? 'default' :
                      request.status === 'approved' ? 'secondary' : 'destructive'
                    }>
                      {request.status}
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
