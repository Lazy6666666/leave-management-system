import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Badge } from '@/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Button } from '@/ui/button'
import { TeamCalendarEnhanced } from '@/components/features/team-calendar-enhanced'
import { NoTeamMembersEmpty, NoDataEmpty } from '@/lib/production-cleanup/empty-state-templates'

export default function TeamPage() {
  // Using empty arrays to show empty states
  const teamMembers: Array<{
    id: number
    name: string
    role: string
    department: string
    avatar: string
    status: string
    currentLeave: {
      type: string
      startDate: string
      endDate: string
    } | null
  }> = []

  const upcomingLeaves: Array<{
    id: number
    employee: string
    type: string
    startDate: string
    endDate: string
    days: number
  }> = []

  return (
    <div className="space-y-6 md:space-y-8 page-transition">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Team Calendar</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          View team availability and upcoming leave schedules
        </p>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Team Members */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg md:text-xl">Team Members</CardTitle>
            <CardDescription className="text-sm">
              Current status and availability of team members
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {teamMembers.length === 0 ? (
              <NoTeamMembersEmpty onAction={() => {
                // Invite team member functionality
              }} />
            ) : (
              <div className="space-y-2 md:space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
                      <Avatar className="h-9 w-9 md:h-10 md:w-10 shrink-0">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs md:text-sm">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm md:text-base truncate">{member.name}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          {member.role} • {member.department}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end sm:text-right gap-2 shrink-0">
                      <Badge variant={member.status === 'available' ? 'secondary' : 'destructive'} className="text-xs">
                        {member.status === 'available' ? 'Available' : 'On Leave'}
                      </Badge>
                      {member.currentLeave && (
                        <p className="text-xs text-muted-foreground">
                          Until {member.currentLeave.endDate}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar (enhanced with overlays) */}
        <TeamCalendarEnhanced />
      </div>

      {/* Upcoming Leaves */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Upcoming Leave</CardTitle>
          <CardDescription className="text-sm">
            Scheduled leave for the next two weeks
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {upcomingLeaves.length === 0 ? (
            <NoDataEmpty />
          ) : (
            <div className="grid gap-3 md:gap-4 sm:grid-cols-2">
              {upcomingLeaves.map((leave) => (
                <div key={leave.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="font-medium text-sm md:text-base truncate">{leave.employee}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="bg-primary/5 text-xs">{leave.type}</Badge>
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {leave.startDate} - {leave.endDate}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-primary">
                      {leave.days} {leave.days === 1 ? 'day' : 'days'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto sm:ml-2">
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
