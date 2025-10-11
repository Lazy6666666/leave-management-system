import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Bell } from 'lucide-react'

export default function NotificationsPage() {
  // Placeholder for future notification system
  const notifications: Array<{
    id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'success' | 'error'
    time: string
    read: boolean
  }> = []

  return (
    <div className="space-y-6 md:space-y-8 page-transition">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight" suppressHydrationWarning>
          Notifications
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Stay updated with your leave requests and system alerts
        </p>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">All Notifications</CardTitle>
          <CardDescription className="text-sm">
            View all your recent notifications and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You don't have any notifications at the moment. We'll notify you when there are updates."
            />
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.read
                      ? 'bg-background'
                      : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-2 w-2 mt-2 rounded-full flex-shrink-0 ${
                        notification.type === 'warning'
                          ? 'bg-warning'
                          : notification.type === 'error'
                          ? 'bg-destructive'
                          : notification.type === 'success'
                          ? 'bg-green-500'
                          : 'bg-info'
                      }`}
                      role="img"
                      aria-label={notification.type}
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium leading-tight">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
