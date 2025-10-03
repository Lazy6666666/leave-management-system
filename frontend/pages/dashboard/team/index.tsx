import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Badge } from '@/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Calendar } from '@/ui/calendar'
import { Button } from '@/ui/button'

export default function TeamPage() {
  // Mock data - in real app this would come from API
  const teamMembers = [
    {
      id: 1,
      name: 'Alice Johnson',
      role: 'Senior Developer',
      department: 'Engineering',
      avatar: '/placeholder-avatar.jpg',
      status: 'available',
      currentLeave: null
    },
    {
      id: 2,
      name: 'Bob Smith',
      role: 'Marketing Manager',
      department: 'Marketing',
      avatar: '/placeholder-avatar.jpg',
      status: 'on_leave',
      currentLeave: {
        type: 'Annual Leave',
        startDate: '2024-01-20',
        endDate: '2024-01-24'
      }
    },
    {
      id: 3,
      name: 'Carol Davis',
      role: 'HR Specialist',
      department: 'Human Resources',
      avatar: '/placeholder-avatar.jpg',
      status: 'available',
      currentLeave: null
    }
  ]

  const upcomingLeaves = [
    {
      id: 1,
      employee: 'Bob Smith',
      type: 'Annual Leave',
      startDate: '2024-01-20',
      endDate: '2024-01-24',
      days: 5
    },
    {
      id: 2,
      employee: 'Diana Prince',
      type: 'Sick Leave',
      startDate: '2024-01-25',
      endDate: '2024-01-26',
      days: 2
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Calendar</h1>
        <p className="text-muted-foreground">
          View team availability and upcoming leave schedules
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Current status and availability of team members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {member.role} • {member.department}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant={member.status === 'available' ? 'secondary' : 'destructive'}>
                    {member.status === 'available' ? 'Available' : 'On Leave'}
                  </Badge>
                  {member.currentLeave && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Until {member.currentLeave.endDate}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Team Calendar</CardTitle>
            <CardDescription>
              View team leave dates at a glance
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-4">
            <div className="w-full max-w-sm">
              <Calendar
                mode="single"
                className="rounded-md border-0"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Leaves */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Leave</CardTitle>
          <CardDescription>
            Scheduled leave for the next two weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingLeaves.map((leave) => (
              <div key={leave.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="space-y-1 flex-1">
                  <h3 className="font-medium">{leave.employee}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-primary/5">{leave.type}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {leave.startDate} - {leave.endDate}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-primary">
                    {leave.days} {leave.days === 1 ? 'day' : 'days'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="ml-2">
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
