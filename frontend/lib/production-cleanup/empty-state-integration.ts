/**
 * Integration utilities for shadcn/ui Empty component
 * Provides seamless integration with existing components and React Query
 */

import { EmptyStateConfig, predefinedEmptyStates } from './empty-state-config'

export interface ComponentEmptyStateMapping {
  componentPath: string
  componentName: string
  emptyStateConfig: EmptyStateConfig
  dataProperty: string
  conditionCheck: string
}

/**
 * Maps components to their appropriate empty state configurations
 */
export const componentEmptyStateMappings: ComponentEmptyStateMapping[] = [
  {
    componentPath: 'components/leave-requests/LeaveRequestsList',
    componentName: 'LeaveRequestsList',
    emptyStateConfig: predefinedEmptyStates.noLeaveRequests!,
    dataProperty: 'leaveRequests',
    conditionCheck: 'leaveRequests.length === 0',
  },
  {
    componentPath: 'components/team/TeamMembersList',
    componentName: 'TeamMembersList',
    emptyStateConfig: predefinedEmptyStates.noTeamMembers!,
    dataProperty: 'teamMembers',
    conditionCheck: 'teamMembers.length === 0',
  },
  {
    componentPath: 'components/notifications/NotificationsList',
    componentName: 'NotificationsList',
    emptyStateConfig: predefinedEmptyStates.noNotifications!,
    dataProperty: 'notifications',
    conditionCheck: 'notifications.length === 0',
  },
  {
    componentPath: 'components/documents/DocumentsList',
    componentName: 'DocumentsList',
    emptyStateConfig: predefinedEmptyStates.noDocuments!,
    dataProperty: 'documents',
    conditionCheck: 'documents.length === 0',
  },
]

/**
 * React Query integration patterns for empty states
 */
export interface ReactQueryEmptyStatePattern {
  hookName: string
  emptyCondition: string
  loadingCondition: string
  errorCondition: string
  emptyStateConfig: EmptyStateConfig
}

export const reactQueryEmptyStatePatterns: ReactQueryEmptyStatePattern[] = [
  {
    hookName: 'useLeaveRequests',
    emptyCondition: 'data?.length === 0',
    loadingCondition: 'isLoading',
    errorCondition: 'error',
    emptyStateConfig: predefinedEmptyStates.noLeaveRequests!,
  },
  {
    hookName: 'useTeamMembers',
    emptyCondition: 'data?.length === 0',
    loadingCondition: 'isLoading',
    errorCondition: 'error',
    emptyStateConfig: predefinedEmptyStates.noTeamMembers!,
  },
  {
    hookName: 'useNotifications',
    emptyCondition: 'data?.length === 0',
    loadingCondition: 'isLoading',
    errorCondition: 'error',
    emptyStateConfig: predefinedEmptyStates.noNotifications!,
  },
]

/**
 * Code generation utilities for empty state integration
 */
export class EmptyStateIntegration {
  /**
   * Generate React component code with empty state integration
   */
  static generateComponentWithEmptyState(
    componentName: string,
    dataProperty: string,
    emptyStateConfig: EmptyStateConfig,
    useReactQuery = true
  ): string {
    const emptyStateComponentName = `${componentName}EmptyState`
    
    if (useReactQuery) {
      return `import React from 'react'
import { ${emptyStateComponentName} } from './empty-states/${emptyStateComponentName}'
import { Skeleton } from '@/ui/skeleton'

interface ${componentName}Props {
  className?: string
}

export default function ${componentName}({ className }: ${componentName}Props) {
  const { data: ${dataProperty}, isLoading, error } = use${componentName}()

  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorEmpty className={className} onAction={() => window.location.reload()} />
  }

  if (!${dataProperty} || ${dataProperty}.length === 0) {
    return <${emptyStateComponentName} className={className} />
  }

  return (
    <div className={className}>
      {/* Render your data here */}
      {${dataProperty}.map((item) => (
        <div key={item.id}>
          {/* Item rendering logic */}
        </div>
      ))}
    </div>
  )
}`
    }

    return `import React from 'react'
import { ${emptyStateComponentName} } from './empty-states/${emptyStateComponentName}'

interface ${componentName}Props {
  ${dataProperty}: unknown[]
  className?: string
}

export default function ${componentName}({ ${dataProperty}, className }: ${componentName}Props) {
  if (!${dataProperty} || ${dataProperty}.length === 0) {
    return <${emptyStateComponentName} className={className} />
  }

  return (
    <div className={className}>
      {${dataProperty}.map((item) => (
        <div key={item.id}>
          {/* Item rendering logic */}
        </div>
      ))}
    </div>
  )
}`
  }

  /**
   * Generate empty state component code
   */
  static generateEmptyStateComponent(config: EmptyStateConfig): string {
    const componentName = `${config.component}EmptyState`
    const iconName = config.header.media.icon || 'FileX'
    
    let actionsCode = ''
    if (config.content?.actions && config.content.actions.length > 0) {
      const actionButtons = config.content.actions.map(action => 
        `<Button variant="${action.variant}" size="${action.size || 'default'}"${action.href ? ` href="${action.href}"` : ''}>${action.label}</Button>`
      ).join('\n          ')
      
      actionsCode = `
      <EmptyContent>
        <div className="flex gap-2">
          ${actionButtons}
        </div>
      </EmptyContent>`
    }

    let learnMoreCode = ''
    if (config.learnMore) {
      learnMoreCode = `
        <div className="mt-4">
          <a 
            href="${config.learnMore.href}" 
            className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
            ${config.learnMore.external ? 'target="_blank" rel="noopener noreferrer"' : ''}
          >
            ${config.learnMore.text}
          </a>
        </div>`
    }

    return `import React from 'react'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/ui/empty'
import { ${iconName} } from 'lucide-react'
import { Button } from '@/ui/button'

interface ${componentName}Props {
  className?: string
  onAction?: () => void
}

export default function ${componentName}({ className, onAction }: ${componentName}Props) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="${config.header.media.variant}">
          <${iconName} />
        </EmptyMedia>
        <EmptyTitle>${config.header.title}</EmptyTitle>
        <EmptyDescription>
          ${config.header.description}
        </EmptyDescription>${learnMoreCode}
      </EmptyHeader>${actionsCode}
    </Empty>
  )
}

export type { ${componentName}Props }`
  }

  /**
   * Generate import statements for empty state components
   */
  static generateImports(componentName: string): string[] {
    return [
      `import { ${componentName}EmptyState } from './empty-states/${componentName}EmptyState'`,
      `import { ErrorEmpty } from '@/lib/production-cleanup/empty-state-templates'`,
      `import { Skeleton } from '@/ui/skeleton'`,
    ]
  }

  /**
   * Generate usage documentation
   */
  static generateUsageDoc(componentName: string, config: EmptyStateConfig): string {
    return `# ${componentName} Empty State

## Usage

\`\`\`tsx
import { ${componentName}EmptyState } from './empty-states/${componentName}EmptyState'

// Basic usage
<${componentName}EmptyState />

// With custom className
<${componentName}EmptyState className="my-4" />

// With action handler
<${componentName}EmptyState onAction={() => handleAction()} />
\`\`\`

## Configuration

- **Title**: ${config.header.title}
- **Description**: ${config.header.description}
- **Icon**: ${config.header.media.icon}
- **Actions**: ${config.content?.actions?.length || 0} action(s)

## Integration Pattern

This empty state is designed to be used when:
- Data array is empty (\`${config.component.toLowerCase()}.length === 0\`)
- No data is available from the API
- User has not created any items yet

## Accessibility

- Proper ARIA labels for screen readers
- Keyboard navigation support
- High contrast color scheme
- Semantic HTML structure
`
  }
}

/**
 * Utility functions for empty state integration
 */
export const EmptyStateIntegrationUtils = {
  /**
   * Find mapping for component
   */
  findMappingForComponent(componentName: string): ComponentEmptyStateMapping | undefined {
    return componentEmptyStateMappings.find(
      mapping => mapping.componentName === componentName
    )
  },

  /**
   * Find React Query pattern for hook
   */
  findReactQueryPattern(hookName: string): ReactQueryEmptyStatePattern | undefined {
    return reactQueryEmptyStatePatterns.find(
      pattern => pattern.hookName === hookName
    )
  },

  /**
   * Generate all empty state components for mappings
   */
  generateAllEmptyStateComponents(): Array<{ name: string, code: string, config: EmptyStateConfig }> {
    return componentEmptyStateMappings.map(mapping => ({
      name: `${mapping.componentName}EmptyState`,
      code: EmptyStateIntegration.generateEmptyStateComponent(mapping.emptyStateConfig),
      config: mapping.emptyStateConfig,
    }))
  },

  /**
   * Validate empty state integration
   */
  validateIntegration(componentCode: string, componentName: string): {
    hasEmptyState: boolean
    hasProperCondition: boolean
    hasImports: boolean
    suggestions: string[]
  } {
    const suggestions: string[] = []
    
    const hasEmptyState = componentCode.includes('EmptyState') || componentCode.includes('Empty')
    const hasProperCondition = componentCode.includes('.length === 0') || componentCode.includes('!data')
    const hasImports = componentCode.includes('import') && componentCode.includes('Empty')

    if (!hasEmptyState) {
      suggestions.push('Add empty state component for better UX')
    }
    
    if (!hasProperCondition) {
      suggestions.push('Add proper condition check for empty data')
    }
    
    if (!hasImports) {
      suggestions.push('Import empty state components')
    }

    return {
      hasEmptyState,
      hasProperCondition,
      hasImports,
      suggestions,
    }
  },
}

// Export types for external use
export type {
  ComponentEmptyStateMapping as ComponentMapping,
  ReactQueryEmptyStatePattern as ReactQueryPattern,
}