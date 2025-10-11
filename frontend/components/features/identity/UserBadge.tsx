import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Skeleton } from '@/ui/skeleton'
import { User } from 'lucide-react'

interface UserProfile {
  id?: string
  full_name?: string | null
  email?: string | null
  role?: 'employee' | 'manager' | 'admin' | 'hr'
  department?: string | null
  photo_url?: string | null
}

interface UserBadgeProps {
  profile?: UserProfile | null
  email?: string | null
  isLoading?: boolean
  collapsed?: boolean
  className?: string
}

export function UserBadge({
  profile,
  email,
  isLoading = false,
  collapsed = false,
  className = ''
}: UserBadgeProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''} ${className}`}>
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        {!collapsed && (
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        )}
      </div>
    )
  }

  // Extract first and last name from full_name
  const getInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.trim().split(' ')
      if (names.length >= 2) {
        return `${names[0]?.[0] || ''}${names[names.length - 1]?.[0] || ''}`.toUpperCase()
      }
      return profile.full_name.substring(0, 2).toUpperCase()
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  const displayName = profile?.full_name || email || 'User'

  return (
    <motion.div
      className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''} ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Avatar with hover animation */}
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-transparent hover:ring-primary/20 transition-all duration-200">
          <AvatarImage
            src={profile?.photo_url || undefined}
            alt={displayName}
          />
          <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-semibold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      {/* User info with smooth transition */}
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            key="user-info"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex-1 min-w-0"
          >
            <motion.p
              className="text-sm font-medium truncate text-foreground"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              {displayName}
            </motion.p>
            {profile?.department && (
              <motion.p
                className="text-xs text-muted-foreground truncate"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.2 }}
              >
                {profile.department}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
