import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Badge } from '@/ui/badge'
import { 
  Calendar, 
  Clock, 
  FileText, 
  Users, 
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CalendarDays,
  BarChart3,
  Bell,
  Settings
} from 'lucide-react'

export default function DashboardPage() {
  const [currentTime] = useState(new Date())

  // Mock data - in real app this would come from API
  const user = {
    name: 'Sarah Johnson',
    role: 'Senior Developer',
    department: 'Engineering',
    avatar: 'SJ'
  }

  const stats = {
    pendingRequests: 2,
    approvedThisMonth: 8,
    remainingDays: 18,
    totalAllocation: 25,
    teamMembers: 12,
    upcomingLeaves: 3
  }

  const recentRequests = [
    {
      id: 1,
      type: 'Annual Leave',
      startDate: '2024-02-15',
      endDate: '2024-02-19',
      status: 'pending',
      days: 5,
      submittedAt: '2024-01-28'
    },
    {
      id: 2,
      type: 'Sick Leave',
      startDate: '2024-01-22',
      endDate: '2024-01-22',
      status: 'approved',
      days: 1,
      submittedAt: '2024-01-22'
    },
    {
      id: 3,
      type: 'Personal Leave',
      startDate: '2024-01-08',
      endDate: '2024-01-09',
      status: 'approved',
      days: 2,
      submittedAt: '2024-01-05'
    }
  ]

  const upcomingLeaves = [
    { name: 'Mike Chen', type: 'Annual', dates: 'Feb 12-16', avatar: 'MC' },
    { name: 'Lisa Park', type: 'Maternity', dates: 'Feb 20-May 20', avatar: 'LP' },
    { name: 'John Smith', type: 'Annual', dates: 'Feb 26-28', avatar: 'JS' }
  ]

  const notifications = [
    { id: 1, message: 'Your leave request for Feb 15-19 is pending approval', type: 'info', time: '2 hours ago' },
    { id: 2, message: 'Document "Company Handbook 2024" expires in 30 days', type: 'warning', time: '1 day ago' },
    { id: 3, message: 'Team calendar updated with new holidays', type: 'info', time: '3 days ago' }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 17 ? 'afternoon' : 'evening'}, {user.name.split(' ')[0]}
          </h1>
          <p className="text-slate-600 mt-1">
            {user.role} • {user.department} • {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Link href="/dashboard/leaves/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Requests</CardTitle>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.pendingRequests}</div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Days Used</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.approvedThisMonth}</div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <span>This year so far</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Remaining Balance</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.remainingDays}</div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <span>of {stats.totalAllocation} total days</span>
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${(stats.remainingDays / stats.totalAllocation) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Team Status</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.teamMembers - stats.upcomingLeaves}</div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <span>of {stats.teamMembers} available</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Requests */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Recent Leave Requests</CardTitle>
                <CardDescription className="text-slate-600">
                  Track your latest submissions and their status
                </CardDescription>
              </div>
              <Link href="/dashboard/leaves">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(request.status)}
                  <div>
                    <p className="font-medium text-slate-900">{request.type}</p>
                    <p className="text-sm text-slate-600">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      Submitted {new Date(request.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`${getStatusColor(request.status)} border`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                  <p className="text-sm text-slate-600 mt-1">{request.days} day{request.days > 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/leaves/new">
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Request Leave
                </Button>
              </Link>
              <Link href="/dashboard/team">
                <Button className="w-full justify-start" variant="outline">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Team Calendar
                </Button>
              </Link>
              <Link href="/dashboard/documents">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Documents
                </Button>
              </Link>
              <Link href="/dashboard/profile">
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Team Leaves */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Upcoming Team Leaves</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingLeaves.map((leave, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                    {leave.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{leave.name}</p>
                    <p className="text-xs text-slate-500">{leave.type} • {leave.dates}</p>
                  </div>
                </div>
              ))}
              <Link href="/dashboard/team">
                <Button variant="outline" size="sm" className="w-full mt-3">
                  View Full Calendar
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Recent Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.slice(0, 3).map((notification) => (
                <div key={notification.id} className="flex space-x-3">
                  <div className={`flex h-2 w-2 mt-2 rounded-full ${
                    notification.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">{notification.message}</p>
                    <p className="text-xs text-slate-500">{notification.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
