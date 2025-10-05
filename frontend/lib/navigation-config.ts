import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Settings,
  Shield,
  UserCog,
  ClipboardList,
  FolderOpen,
  BarChart3,
  ListChecks,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type UserRole = 'employee' | 'manager' | 'admin'

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
  description?: string
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

/**
 * Main navigation items for all users
 */
export const mainNavigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['employee', 'manager', 'admin'],
    description: 'Overview and quick actions',
  },
  {
    name: 'Leave Requests',
    href: '/dashboard/leaves',
    icon: Calendar,
    roles: ['employee', 'manager', 'admin'],
    description: 'View and manage your leave requests',
  },
  {
    name: 'Approvals',
    href: '/dashboard/approvals',
    icon: ClipboardList,
    roles: ['manager', 'admin'],
    description: 'Review and approve team leave requests',
  },
  {
    name: 'Documents',
    href: '/dashboard/documents',
    icon: FolderOpen,
    roles: ['employee', 'manager', 'admin'],
    description: 'View uploaded leave documents',
  },
  {
    name: 'Team Calendar',
    href: '/dashboard/team',
    icon: Users,
    roles: ['employee', 'manager', 'admin'],
    description: 'View team leave schedule',
  },
  {
    name: 'Profile',
    href: '/dashboard/profile',
    icon: Settings,
    roles: ['employee', 'manager', 'admin'],
    description: 'Manage your profile settings',
  },
]

/**
 * Admin navigation items
 */
export const adminNavigation: NavItem[] = [
  {
    name: 'Admin Dashboard',
    href: '/dashboard/admin',
    icon: Shield,
    roles: ['admin'],
    description: 'Administrative overview',
  },
  {
    name: 'User Management',
    href: '/dashboard/admin/users',
    icon: UserCog,
    roles: ['admin'],
    description: 'Manage users and roles',
  },
  {
    name: 'Reports',
    href: '/dashboard/admin/reports',
    icon: BarChart3,
    roles: ['admin'],
    description: 'View analytics and reports',
  },
  {
    name: 'Leave Types',
    href: '/dashboard/leave-types',
    icon: ListChecks,
    roles: ['admin'],
    description: 'Manage leave type configurations',
  },
]

/**
 * Filter navigation items based on user role
 */
export function filterNavigationByRole(
  items: NavItem[],
  userRole: UserRole
): NavItem[] {
  return items.filter((item) => item.roles.includes(userRole))
}

/**
 * Get all navigation sections for a user role
 */
export function getNavigationSections(userRole: UserRole): NavSection[] {
  const sections: NavSection[] = [
    {
      items: filterNavigationByRole(mainNavigation, userRole),
    },
  ]

  // Add admin section if user is admin
  const adminItems = filterNavigationByRole(adminNavigation, userRole)
  if (adminItems.length > 0) {
    sections.push({
      title: 'Administration',
      items: adminItems,
    })
  }

  return sections
}

/**
 * Check if a path is active based on current pathname
 */
export function isNavItemActive(itemHref: string, currentPath: string): boolean {
  // Exact match for dashboard home
  if (itemHref === '/dashboard' && currentPath === '/dashboard') {
    return true
  }

  // For other routes, check if current path starts with item href
  // but not if we're on dashboard home
  if (itemHref !== '/dashboard' && currentPath.startsWith(itemHref)) {
    return true
  }

  return false
}
