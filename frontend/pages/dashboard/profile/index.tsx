import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Badge } from '@/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'
import { Separator } from '@/ui/separator'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export default function ProfilePage() {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: ''
  })

  const user = {
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'Software Engineer',
    department: 'Engineering',
    joinDate: 'January 2024',
    avatar: '',
    leaveBalance: {
      annual: { used: 5, total: 25, remaining: 20 },
      sick: { used: 2, total: 10, remaining: 8 },
      personal: { used: 1, total: 5, remaining: 4 }
    }
  }

  const handleSaveChanges = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    })
    setIsEditing(false)
  }

  const handleChangePhoto = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Photo upload functionality will be available soon.",
    })
  }

  const handleChangePassword = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Password change functionality will be available soon.",
    })
  }

  const handleNotificationSettings = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Notification settings will be available soon.",
    })
  }

  const handlePrivacySettings = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Privacy settings will be available soon.",
    })
  }

  return (
    <div className="space-y-8 page-transition">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar || "/placeholder-avatar.svg"} />
                  <AvatarFallback className="text-lg">
                    {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'JD'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" onClick={handleChangePhoto}>Change Photo</Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, GIF or PNG. Max size 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={user.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={user.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" defaultValue={user.role} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select defaultValue={user.department.toLowerCase()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveChanges}>Save Changes</Button>
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            </CardContent>
          </Card>

          {/* Leave Balance */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Balance</CardTitle>
              <CardDescription>
                Your current leave allocation and usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Annual Leave</span>
                    <Badge variant="outline">
                      {user.leaveBalance.annual.remaining} / {user.leaveBalance.annual.total}
                    </Badge>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(user.leaveBalance.annual.used / user.leaveBalance.annual.total) * 100}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user.leaveBalance.annual.used} days used
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sick Leave</span>
                    <Badge variant="outline">
                      {user.leaveBalance.sick.remaining} / {user.leaveBalance.sick.total}
                    </Badge>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(user.leaveBalance.sick.used / user.leaveBalance.sick.total) * 100}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user.leaveBalance.sick.used} days used
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Personal Leave</span>
                    <Badge variant="outline">
                      {user.leaveBalance.personal.remaining} / {user.leaveBalance.personal.total}
                    </Badge>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(user.leaveBalance.personal.used / user.leaveBalance.personal.total) * 100}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user.leaveBalance.personal.used} days used
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Member since</span>
                  <span>{user.joinDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Department</span>
                  <span>{user.department}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Role</span>
                  <span>{user.role}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline" onClick={handleChangePassword}>
                Change Password
              </Button>
              <Button className="w-full" variant="outline" onClick={handleNotificationSettings}>
                Notification Settings
              </Button>
              <Button className="w-full" variant="outline" onClick={handlePrivacySettings}>
                Privacy Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
