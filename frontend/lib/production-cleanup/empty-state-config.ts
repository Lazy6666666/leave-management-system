import { z } from 'zod'
import type { LucideIcon } from 'lucide-react'

/**
 * Configuration system for empty states with TypeScript interfaces
 * Provides type-safe configuration for shadcn/ui Empty components
 */

// Zod schema for empty state configuration validation
export const EmptyStateConfigSchema = z.object({
  id: z.string(),
  component: z.string(),
  header: z.object({
    media: z.object({
      variant: z.enum(['default', 'icon']),
      icon: z.string().optional(),
      customElement: z.string().optional(),
    }),
    title: z.string(),
    description: z.string(),
  }),
  content: z.object({
    actions: z.array(z.object({
      label: z.string(),
      variant: z.enum(['default', 'outline', 'link']),
      size: z.enum(['sm', 'default', 'lg']).optional(),
      href: z.string().optional(),
      onClick: z.string().optional(),
    })),
  }).optional(),
  learnMore: z.object({
    text: z.string(),
    href: z.string(),
    external: z.boolean().optional(),
  }).optional(),
  className: z.string().optional(),
})

// TypeScript interfaces for empty state configuration
export interface EmptyStateMediaConfig {
  variant: 'default' | 'icon'
  icon?: string
  iconComponent?: LucideIcon
  customElement?: React.ReactNode
}

export interface EmptyStateActionConfig {
  label: string
  variant: 'default' | 'outline' | 'link'
  size?: 'sm' | 'default' | 'lg'
  href?: string
  onClick?: () => void
}

export interface EmptyStateHeaderConfig {
  media: EmptyStateMediaConfig
  title: string
  description: string
}

export interface EmptyStateContentConfig {
  actions: EmptyStateActionConfig[]
}

export interface EmptyStateLearnMoreConfig {
  text: string
  href: string
  external?: boolean
}

export interface EmptyStateConfig {
  id: string
  component: string
  header: EmptyStateHeaderConfig
  content?: EmptyStateContentConfig
  learnMore?: EmptyStateLearnMoreConfig
  className?: string
}

// Predefined empty state configurations for common scenarios
export const predefinedEmptyStates: Record<string, EmptyStateConfig> = {
  noLeaveRequests: {
    id: 'no-leave-requests',
    component: 'LeaveRequestsList',
    header: {
      media: {
        variant: 'icon',
        icon: 'Calendar',
      },
      title: 'No Leave Requests Yet',
      description: 'You haven\'t submitted any leave requests yet. Get started by creating your first request.',
    },
    content: {
      actions: [
        {
          label: 'Create Leave Request',
          variant: 'default',
        },
      ],
    },
  },
  noTeamMembers: {
    id: 'no-team-members',
    component: 'TeamMembersList',
    header: {
      media: {
        variant: 'icon',
        icon: 'Users',
      },
      title: 'No Team Members',
      description: 'No team members have been added yet. Invite team members to get started.',
    },
    content: {
      actions: [
        {
          label: 'Invite Team Member',
          variant: 'default',
        },
      ],
    },
  },
  noNotifications: {
    id: 'no-notifications',
    component: 'NotificationsList',
    header: {
      media: {
        variant: 'icon',
        icon: 'Bell',
      },
      title: 'No Notifications',
      description: 'You\'re all caught up! No new notifications at this time.',
    },
  },
  noDocuments: {
    id: 'no-documents',
    component: 'DocumentsList',
    header: {
      media: {
        variant: 'icon',
        icon: 'FileText',
      },
      title: 'No Documents',
      description: 'No documents have been uploaded yet. Upload your first document to get started.',
    },
    content: {
      actions: [
        {
          label: 'Upload Document',
          variant: 'default',
        },
      ],
    },
  },
  accessDenied: {
    id: 'access-denied',
    component: 'AccessDenied',
    header: {
      media: {
        variant: 'icon',
        icon: 'Shield',
      },
      title: 'Access Denied',
      description: 'You don\'t have permission to view this content. Contact your administrator if you believe this is an error.',
    },
    learnMore: {
      text: 'Learn about permissions',
      href: '/help/permissions',
    },
  },
  networkError: {
    id: 'network-error',
    component: 'NetworkError',
    header: {
      media: {
        variant: 'icon',
        icon: 'Wifi',
      },
      title: 'Connection Error',
      description: 'Unable to connect to the server. Please check your internet connection and try again.',
    },
    content: {
      actions: [
        {
          label: 'Try Again',
          variant: 'outline',
        },
      ],
    },
  },
  generalError: {
    id: 'general-error',
    component: 'GeneralError',
    header: {
      media: {
        variant: 'icon',
        icon: 'AlertCircle',
      },
      title: 'Something Went Wrong',
      description: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    },
    content: {
      actions: [
        {
          label: 'Try Again',
          variant: 'outline',
        },
        {
          label: 'Contact Support',
          variant: 'link',
        },
      ],
    },
  },
}

// Configuration builder for creating custom empty states
export class EmptyStateConfigBuilder {
  private config: Partial<EmptyStateConfig> = {}

  static create(id: string, component: string): EmptyStateConfigBuilder {
    const builder = new EmptyStateConfigBuilder()
    builder.config.id = id
    builder.config.component = component
    return builder
  }

  withHeader(title: string, description: string, media: EmptyStateMediaConfig): EmptyStateConfigBuilder {
    this.config.header = { title, description, media }
    return this
  }

  withActions(actions: EmptyStateActionConfig[]): EmptyStateConfigBuilder {
    this.config.content = { actions }
    return this
  }

  withLearnMore(text: string, href: string, external = false): EmptyStateConfigBuilder {
    this.config.learnMore = { text, href, external }
    return this
  }

  withClassName(className: string): EmptyStateConfigBuilder {
    this.config.className = className
    return this
  }

  build(): EmptyStateConfig {
    if (!this.config.id || !this.config.component || !this.config.header) {
      throw new Error('EmptyStateConfig requires id, component, and header')
    }
    return this.config as EmptyStateConfig
  }
}

// Utility functions for working with empty state configurations
export const EmptyStateConfigUtils = {
  /**
   * Validate empty state configuration
   */
  validate(config: unknown): EmptyStateConfig {
    return EmptyStateConfigSchema.parse(config) as EmptyStateConfig
  },

  /**
   * Get predefined configuration by ID
   */
  getPredefined(id: string): EmptyStateConfig | undefined {
    return predefinedEmptyStates[id]
  },

  /**
   * Get all predefined configurations
   */
  getAllPredefined(): Record<string, EmptyStateConfig> {
    return predefinedEmptyStates
  },

  /**
   * Create configuration for component
   */
  createForComponent(componentName: string): EmptyStateConfig {
    const lowerName = componentName.toLowerCase()
    
    // Try to find a matching predefined config
    const predefined = Object.values(predefinedEmptyStates).find(
      config => config.component.toLowerCase().includes(lowerName)
    )
    
    if (predefined) {
      return predefined
    }

    // Create a default configuration
    return EmptyStateConfigBuilder
      .create(`${lowerName}-empty`, componentName)
      .withHeader(
        'No Data Available',
        'No data is available at this time.',
        { variant: 'icon', icon: 'FileX' }
      )
      .build()
  },

  /**
   * Merge configurations
   */
  merge(base: EmptyStateConfig, override: Partial<EmptyStateConfig>): EmptyStateConfig {
    return {
      ...base,
      ...override,
      header: {
        ...base.header,
        ...override.header,
        media: {
          ...base.header.media,
          ...override.header?.media,
        },
      },
      content: override.content || base.content,
      learnMore: override.learnMore || base.learnMore,
    }
  },
}

// Type is already exported above