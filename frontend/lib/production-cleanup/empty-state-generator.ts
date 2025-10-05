import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { defaultCleanupConfig, type CleanupConfig } from './config'

export interface ComponentAnalysis {
  file: string
  component: string
  needsEmptyState: boolean
  hasEmptyState: boolean
  mockDataFound: string[]
}

export interface EmptyStateTemplate {
  id: string
  name: string
  component: string
  imports: string[]
  props?: Record<string, unknown>
}

export interface GeneratedEmptyState {
  componentName: string
  filePath: string
  code: string
  imports: string[]
  usage: string
}

/**
 * Empty state generator using shadcn/ui Empty component
 */
export class EmptyStateGenerator {
  private config: CleanupConfig

  constructor(config: CleanupConfig = defaultCleanupConfig) {
    this.config = config
  }

  /**
   * Generate empty state components for components that need them
   */
  async generateEmptyStates(components: ComponentAnalysis[]): Promise<GeneratedEmptyState[]> {
    const generated: GeneratedEmptyState[] = []

    for (const component of components) {
      if (component.needsEmptyState && !component.hasEmptyState) {
        const emptyState = await this.generateEmptyStateForComponent(component)
        if (emptyState) {
          generated.push(emptyState)
        }
      }
    }

    return generated
  }

  /**
   * Generate empty state for a specific component
   */
  async generateEmptyStateForComponent(component: ComponentAnalysis): Promise<GeneratedEmptyState | null> {
    const template = this.getTemplateForComponent(component)
    if (!template) {
      return null
    }

    const componentName = `${component.component}EmptyState`
    const filePath = this.getEmptyStateFilePath(component.file, componentName)
    
    const code = this.generateEmptyStateCode(template, componentName)
    const imports = this.generateImports(template)
    const usage = this.generateUsageExample(componentName, component)

    return {
      componentName,
      filePath,
      code,
      imports,
      usage
    }
  }

  /**
   * Create empty state files
   */
  async createEmptyStateFiles(emptyStates: GeneratedEmptyState[]): Promise<{
    created: string[]
    errors: Array<{ file: string, error: string }>
  }> {
    const created: string[] = []
    const errors: Array<{ file: string, error: string }> = []

    for (const emptyState of emptyStates) {
      try {
        // Ensure directory exists
        const dir = dirname(emptyState.filePath)
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
        }
        
        // Write the empty state component
        writeFileSync(emptyState.filePath, emptyState.code)
        created.push(emptyState.filePath)
      } catch (error) {
        errors.push({
          file: emptyState.filePath,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return { created, errors }
  }

  /**
   * Get template for component based on configuration
   */
  private getTemplateForComponent(component: ComponentAnalysis): EmptyStateTemplate | null {
    const configTemplate = this.config.emptyStates.find(
      template => template.component === component.component
    )

    if (configTemplate) {
      return {
        id: configTemplate.id,
        name: configTemplate.component,
        component: configTemplate.component,
        imports: ['Empty', 'EmptyHeader', 'EmptyMedia', 'EmptyTitle', 'EmptyDescription', 'EmptyContent'],
        props: configTemplate
      }
    }

    // Default template based on component name
    return this.createDefaultTemplate(component)
  }

  /**
   * Create default template for component
   */
  private createDefaultTemplate(component: ComponentAnalysis): EmptyStateTemplate {
    const componentName = component.component.toLowerCase()
    
    let icon = 'FileX'
    let title = 'No Data'
    let description = 'No data available at this time.'
    let actions: Array<{ label: string, variant: 'default' | 'outline' | 'link' }> = []

    // Customize based on component name
    if (componentName.includes('leave') || componentName.includes('request')) {
      icon = 'Calendar'
      title = 'No Leave Requests'
      description = 'You haven\'t submitted any leave requests yet. Get started by creating your first request.'
      actions = [{ label: 'Create Leave Request', variant: 'default' }]
    } else if (componentName.includes('team') || componentName.includes('member')) {
      icon = 'Users'
      title = 'No Team Members'
      description = 'No team members have been added yet. Invite team members to get started.'
      actions = [{ label: 'Invite Team Member', variant: 'default' }]
    } else if (componentName.includes('notification')) {
      icon = 'Bell'
      title = 'No Notifications'
      description = 'You\'re all caught up! No new notifications at this time.'
    }

    return {
      id: `${componentName}-empty`,
      name: `${component.component}EmptyState`,
      component: component.component,
      imports: ['Empty', 'EmptyHeader', 'EmptyMedia', 'EmptyTitle', 'EmptyDescription', 'EmptyContent'],
      props: {
        header: {
          media: { variant: 'icon', icon },
          title,
          description
        },
        content: actions.length > 0 ? { actions } : undefined
      }
    }
  }

  /**
   * Get file path for empty state component
   */
  private getEmptyStateFilePath(originalFile: string, componentName: string): string {
    const dir = dirname(originalFile)
    return join(dir, `${componentName}.tsx`)
  }

  /**
   * Generate empty state component code
   */
  private generateEmptyStateCode(template: EmptyStateTemplate, componentName: string): string {
    const props = template.props as { 
      header: { 
        media: { icon: string; variant: string }
        title: string
        description: string
      }
      content: { 
        actions: Array<{ variant: string; label: string }> 
      } 
    }
    const { header, content } = props

    let code = `import React from 'react'
import { ${template.imports.join(', ')} } from '@/ui/empty'
import { ${header.media.icon} } from 'lucide-react'
import { Button } from '@/ui/button'

interface ${componentName}Props {
  className?: string
}

export default function ${componentName}({ className }: ${componentName}Props) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="${header.media.variant}">
          <${header.media.icon} />
        </EmptyMedia>
        <EmptyTitle>${header.title}</EmptyTitle>
        <EmptyDescription>
          ${header.description}
        </EmptyDescription>
      </EmptyHeader>`

    if (content?.actions && content.actions.length > 0) {
      code += `
      <EmptyContent>
        <div className="flex gap-2">`
      
      content.actions.forEach((action: { variant: string; label: string }) => {
        code += `
          <Button variant="${action.variant}">${action.label}</Button>`
      })
      
      code += `
        </div>
      </EmptyContent>`
    }

    code += `
    </Empty>
  )
}

export type { ${componentName}Props }`

    return code
  }

  /**
   * Generate imports for template
   */
  private generateImports(template: EmptyStateTemplate): string[] {
    return [
      `import ${template.name} from './${template.name}'`,
      `import type { ${template.name}Props } from './${template.name}'`
    ]
  }

  /**
   * Generate usage example
   */
  private generateUsageExample(componentName: string, component: ComponentAnalysis): string {
    return `// Usage in ${component.component}:
// Replace empty data rendering with:
// {data.length === 0 ? <${componentName} /> : <DataList data={data} />}`
  }

  /**
   * Update component to use empty state
   */
  async updateComponentWithEmptyState(
    componentFile: string, 
    emptyStateComponent: string
  ): Promise<{ updated: boolean, error?: string }> {
    try {
      if (!existsSync(componentFile)) {
        return { updated: false, error: 'Component file not found' }
      }

      const content = readFileSync(componentFile, 'utf-8')
      
      // Simple replacement - in a real implementation, you'd use AST parsing
      const mockDataPatterns = [
        /\/\/ Mock data.*$/gm,
        /const mockData = \[.*?\]/g,
        /const MOCK_.*? = \[.*?\]/g
      ]

      let updatedContent = content
      let hasChanges = false

      // Remove mock data patterns
      mockDataPatterns.forEach(pattern => {
        if (pattern.test(updatedContent)) {
          updatedContent = updatedContent.replace(pattern, '')
          hasChanges = true
        }
      })

      // Add empty state import if not present
      const emptyStateImport = `import ${emptyStateComponent} from './${emptyStateComponent}'`
      if (!updatedContent.includes(emptyStateImport)) {
        const importSection = updatedContent.match(/^import.*$/gm)
        if (importSection && importSection.length > 0) {
          const lastImport = importSection[importSection.length - 1]
          if (lastImport) {
            updatedContent = updatedContent.replace(lastImport, `${lastImport}\n${emptyStateImport}`)
            hasChanges = true
          }
        }
      }

      if (hasChanges) {
        writeFileSync(componentFile, updatedContent)
        return { updated: true }
      }

      return { updated: false, error: 'No changes needed' }
    } catch (error) {
      return { 
        updated: false, 
        error: error instanceof Error ? error.message : String(error) 
      }
    }
  }
}