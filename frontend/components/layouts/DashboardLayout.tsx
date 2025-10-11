import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  LogOut,
  Menu,
  Bell,
  Calendar,
} from 'lucide-react'
import { Button } from '@/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { SkipLink } from '@/components/ui/skip-link'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/ui/sheet'
import {
  mainNavigation,
  adminNavigation,
  isNavItemActive,
  type NavItem,
} from '@/lib/navigation-config'
import { useAuth, useLogout } from '@/hooks/use-auth'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/tooltip'
import { useUserProfile } from '@/hooks/use-user-profile'
import { useRealtimeProfile } from '@/hooks/use-realtime-profile'
import { UserBadge, RoleBadge } from '@/components/features/identity'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()
  const pathname = router.pathname
  const { user } = useAuth()
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile(user?.id)
  const logout = useLogout()

  // Enable real-time profile updates
  useRealtimeProfile(user?.id)

  // Check if user is on admin page
  const isAdmin = pathname.startsWith('/dashboard/admin')

  const handleSignOut = async () => {
    try {
      await logout.mutateAsync()
      router.push('/login')
    } catch (e) {
      console.error('Sign out failed', e)
    }
  }

  // Navigation item component for reusability
  const NavItemComponent = ({ item, onClick, collapsed = false }: { item: NavItem, onClick?: () => void, collapsed?: boolean }) => {
    const isActive = isNavItemActive(item.href, pathname)
    return (
      <Link
        href={item.href}
        className={`
          flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg 
          transition-all duration-200 group
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          active:scale-98
          ${collapsed ? 'justify-center' : ''}
          ${isActive
            ? 'font-semibold text-black dark:text-white hover:text-primary'
            : 'text-muted-foreground hover:bg-primary/10 hover:text-primary hover:shadow-primary/20 hover:translate-x-0.5'
          }
        `}
        onClick={onClick}
        title={item.description || item.name}
        aria-current={isActive ? 'page' : undefined}
        suppressHydrationWarning
      >
        <item.icon suppressHydrationWarning className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${!isActive && 'group-hover:scale-110 group-hover:rotate-3'}`} />
        <span suppressHydrationWarning className={`transition-all duration-300 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>{item.name}</span>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Links for Keyboard Navigation */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>
      
      {/* Desktop Sidebar - Using new spacing system with smooth transitions */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:bg-card lg:border-r transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-60'}`}>
        <div className="flex h-full flex-col">
          {/* Logo - Consistent height: 64px */}
          <div className="flex h-16 items-center px-6 border-b" suppressHydrationWarning>
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
                            suppressHydrationWarning
                          >
                            <Calendar className="h-6 w-6 text-primary flex-shrink-0" suppressHydrationWarning />
                            <h1 suppressHydrationWarning className={`text-xl font-bold transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Leave Portal</h1>
                          </Link>          </div>

          {/* Navigation - Using 8-point spacing system */}
          <nav id="navigation" className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Main navigation">
            {/* Main Navigation */}
            <div className="space-y-1">
              {mainNavigation.map((item) => (
                <NavItemComponent key={item.name} item={item} collapsed={sidebarCollapsed} />
              ))}
            </div>

            {/* Admin Navigation - Using 16px top padding and margin */}
            <div className="pt-4 mt-4 border-t">
              <p className={`px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 h-0 mb-0' : 'opacity-100'}`}>
                Administration
              </p>
              <div className="space-y-1">
                {adminNavigation.map((item) => (
                  <NavItemComponent key={item.name} item={item} collapsed={sidebarCollapsed} />
                ))}
              </div>
            </div>
          </nav>

          {/* User section - Using 16px padding */}
          <div className="border-t p-4 space-y-3">
            <a
              href="/dashboard/profile"
              className={`block group ${sidebarCollapsed ? 'flex justify-center' : ''}`}
              title="View Profile"
              aria-label="View your profile"
            >
              <UserBadge
                profile={userProfile}
                email={user?.email}
                isLoading={isProfileLoading}
                collapsed={sidebarCollapsed}
              />
            </a>

            <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              {userProfile?.role && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex-shrink-0">
                        <RoleBadge
                          role={userProfile.role}
                          collapsed={sidebarCollapsed}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-medium">{userProfile.role.toUpperCase()}</p>
                      {userProfile.department && (
                        <p className="text-xs text-muted-foreground">{userProfile.department}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {!sidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  title="Sign Out"
                  aria-label="Sign out"
                  className="flex-shrink-0 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive active:scale-95 ml-auto"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>

            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title="Sign Out"
                aria-label="Sign out"
                className="w-full flex-shrink-0 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive active:scale-95"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0" id="mobile-navigation" aria-label="Mobile navigation menu">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <SheetHeader className="border-b p-6">
              <SheetTitle className="flex items-center gap-2 text-left">
                <Calendar className="h-6 w-6 text-primary flex-shrink-0" suppressHydrationWarning />
                <span className="text-2xl font-bold text-primary">Leave Portal</span>
              </SheetTitle>
            </SheetHeader>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto" id="navigation" aria-label="Mobile navigation">
              {/* Main Navigation */}
              <div className="space-y-1">
                {mainNavigation.map((item) => (
                  <NavItemComponent 
                    key={item.name} 
                    item={item} 
                    onClick={() => setSidebarOpen(false)}
                  />
                ))}
              </div>

              {/* Admin Navigation */}
              <div className="pt-4 mt-4 border-t">
                <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administration
                </p>
                <div className="space-y-1">
                  {adminNavigation.map((item) => (
                    <NavItemComponent 
                      key={item.name} 
                      item={item} 
                      onClick={() => setSidebarOpen(false)}
                    />
                  ))}
                </div>
              </div>
            </nav>

            {/* User section */}
            <div className="border-t p-4 space-y-3">
              <a
                href="/dashboard/profile"
                className="block group"
                title="View Profile"
                aria-label="View your profile"
              >
                <UserBadge
                  profile={userProfile}
                  email={user?.email}
                  isLoading={isProfileLoading}
                />
              </a>

              <div className="flex items-center gap-2">
                {userProfile?.role && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-shrink-0">
                          <RoleBadge role={userProfile.role} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{userProfile.role.toUpperCase()}</p>
                        {userProfile.department && (
                          <p className="text-xs text-muted-foreground">{userProfile.department}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  title="Sign Out"
                  aria-label="Sign out"
                  className="flex-shrink-0 ml-auto transition-all duration-200 hover:bg-destructive/10 hover:text-destructive active:scale-95"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content - Responsive padding left based on sidebar width */}
      <div className="transition-all duration-300 ease-in-out">
        {/* Top bar - Consistent height: 80px, responsive padding */}
        <div className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-card px-4 md:px-6 text-foreground" suppressHydrationWarning>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-navigation"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open navigation menu</span>
          </Button>

          <div className="flex flex-1 gap-4 self-stretch lg:gap-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-3 lg:gap-4" role="toolbar" aria-label="User actions">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard/notifications')}
                aria-label="View notifications"
                title="View notifications"
              >
                <Bell className="h-6 w-6" />
                <span className="sr-only">View notifications</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Page content - Using responsive padding from spacing system */}
        <main id="main-content" className={`py-4 md:py-6 lg:py-8 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-60'}`} role="main" aria-label="Main content">
          <div className="px-4 md:px-6 lg:px-8 max-w-[1280px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
