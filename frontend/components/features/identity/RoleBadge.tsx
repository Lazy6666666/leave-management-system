import { motion } from 'framer-motion'
import { Badge } from '@/ui/badge'
import { Shield, User, Users, UserCog } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type UserRole = Database['public']['Enums']['user_role']

interface RoleBadgeProps {
  role: UserRole
  collapsed?: boolean
  className?: string
  showIcon?: boolean
}

const roleConfig: Record<UserRole, {
  label: string
  icon: typeof Shield
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  gradient: string
  iconColor: string
  description: string
}> = {
  admin: {
    label: 'Admin',
    icon: Shield,
    variant: 'destructive',
    gradient: 'from-red-500/20 to-orange-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
    description: 'Full system access'
  },
  hr: {
    label: 'HR',
    icon: UserCog,
    variant: 'outline',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    description: 'Human Resources'
  },
  manager: {
    label: 'Manager',
    icon: Users,
    variant: 'secondary',
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    description: 'Team management'
  },
  employee: {
    label: 'Employee',
    icon: User,
    variant: 'default',
    gradient: 'from-gray-500/20 to-slate-500/20',
    iconColor: 'text-gray-600 dark:text-gray-400',
    description: 'Standard access'
  }
}

export function RoleBadge({
  role,
  collapsed = false,
  className = '',
  showIcon = true
}: RoleBadgeProps) {
  const config = roleConfig[role]
  const Icon = config.icon

  if (collapsed) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        title={`${config.label} - ${config.description}`}
      >
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className={`flex items-center justify-center p-2 rounded-lg bg-gradient-to-br ${config.gradient} ${className}`}
        >
          <Icon className={`h-4 w-4 ${config.iconColor}`} />
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <Badge
          variant={config.variant}
          className={`
            flex items-center gap-1.5
            bg-gradient-to-br ${config.gradient}
            transition-all duration-200
            hover:shadow-md hover:shadow-primary/20
          `}
        >
          {showIcon && (
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
            </motion.div>
          )}
          <motion.span
            initial={{ x: -5, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className="font-medium"
          >
            {config.label}
          </motion.span>
        </Badge>
      </motion.div>
    </motion.div>
  )
}

export function getRoleConfig(role: UserRole) {
  return roleConfig[role]
}
