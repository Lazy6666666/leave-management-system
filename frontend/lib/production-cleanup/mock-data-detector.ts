import { readFileSync, existsSync } from 'fs'
import { join, relative } from 'path'
import { glob } from 'glob'
import { defaultCleanupConfig, type CleanupConfig } from './config'
import type { ComponentAnalysis } from './empty-state-generator'

export interface MockDataMatch {
  file: string
  line: number
  column: number
  match: string
  pattern: string
  context: string
}

export interface MockDataAnalysis {
  components: ComponentAnalysis[]
  mockDataMatches: MockDataMatch[]
  summary: {
    totalComponents: number
    componentsWithMockData: number
    componentsNeedingEmptyStates: number
    totalMockDataInstances: number
  }
}

/**
 * Mock data detector for identifying hardcoded data in components
 */
export class MockDataDetector {
  private config: CleanupConfig
  private projectRoot: string

  constructor(config: CleanupConfig = defaultCleanupConfig, projectRoot?: string) {
    this.config = config
    this.projectRoot = projectRoot || process.cwd()
  }

  /**
   * Scan components for mock data
   */
  async scanForMockData(): Promise<MockDataAnalysis> {
    const components: ComponentAnalysis[] = []
    const mockDataMatches: MockDataMatch[] = []

    // Find all React component files
    const componentFiles = await this.findComponentFiles()

    for (const file of componentFiles) {
      try {
        const analysis = await this.analyzeComponent(file)
        if (analysis) {
          components.push(analysis)
          
          // Collect mock data matches
          const matches = await this.findMockDataInFile(file)
          mockDataMatches.push(...matches)
        }
      } catch (error) {
        console.warn(`Warning: Failed to analyze component ${file}:`, error)
      }
    }

    const summary = this.generateSummary(components, mockDataMatches)

    return {
      components,
      mockDataMatches,
      summary
    }
  }

  /**
   * Analyze a specific component file
   */
  async analyzeComponent(filePath: string): Promise<ComponentAnalysis | null> {
    if (!existsSync(filePath)) {
      return null
    }

    try {
      const content = readFileSync(filePath, 'utf-8')
      const relativePath = relative(this.projectRoot, filePath)
      
      // Extract component name from file
      const componentName = this.extractComponentName(filePath, content)
      if (!componentName) {
        return null
      }

      // Check for mock data patterns
      const mockDataFound = this.findMockDataPatterns(content)
      
      // Check if component already has empty state
      const hasEmptyState = this.hasExistingEmptyState(content)
      
      // Determine if component needs empty state
      const needsEmptyState = mockDataFound.length > 0 || this.shouldHaveEmptyState(content, componentName)

      return {
        file: relativePath,
        component: componentName,
        needsEmptyState,
        hasEmptyState,
        mockDataFound
      }
    } catch (error) {
      console.warn(`Warning: Failed to read component ${filePath}:`, error)
      return null
    }
  }

  /**
   * Find mock data in a specific file
   */
  async findMockDataInFile(filePath: string): Promise<MockDataMatch[]> {
    const matches: MockDataMatch[] = []
    
    if (!existsSync(filePath)) {
      return matches
    }

    try {
      const content = readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')
      const relativePath = relative(this.projectRoot, filePath)

      // Check each pattern
      for (const pattern of this.config.codePatterns.mockDataPatterns) {
        const regex = new RegExp(pattern, 'gi')
        
        lines.forEach((line, lineIndex) => {
          let match
          while ((match = regex.exec(line)) !== null) {
            matches.push({
              file: relativePath,
              line: lineIndex + 1,
              column: match.index + 1,
              match: match[0],
              pattern,
              context: this.getContext(lines, lineIndex)
            })
          }
        })
      }
    } catch (error) {
      console.warn(`Warning: Failed to scan file ${filePath}:`, error)
    }

    return matches
  }

  /**
   * Replace mock data with proper data flow
   */
  async replaceMockDataWithDataFlow(filePath: string): Promise<{
    updated: boolean
    changes: string[]
    error?: string
  }> {
    try {
      if (!existsSync(filePath)) {
        return { updated: false, changes: [], error: 'File not found' }
      }

      const content = readFileSync(filePath, 'utf-8')
      let updatedContent = content
      const changes: string[] = []

      // Replace mock data patterns
      for (const pattern of this.config.codePatterns.mockDataPatterns) {
        const regex = new RegExp(pattern, 'gi')
        
        if (regex.test(updatedContent)) {
          // Replace with proper data fetching pattern
          const replacement = this.generateDataFetchingReplacement(pattern)
          updatedContent = updatedContent.replace(regex, replacement)
          changes.push(`Replaced pattern: ${pattern}`)
        }
      }

      // Add React Query imports if needed
      if (changes.length > 0 && !updatedContent.includes('@tanstack/react-query')) {
        const importMatch = updatedContent.match(/^import.*from.*$/gm)
        if (importMatch) {
          const lastImport = importMatch[importMatch.length - 1]
          if (lastImport) {
            const reactQueryImport = "import { useQuery } from '@tanstack/react-query'"
            updatedContent = updatedContent.replace(lastImport, `${lastImport}\n${reactQueryImport}`)
            changes.push('Added React Query import')
          }
        }
      }

      if (changes.length > 0) {
        const { writeFileSync } = await import('fs')
        writeFileSync(filePath, updatedContent)
        return { updated: true, changes }
      }

      return { updated: false, changes: [], error: 'No changes needed' }
    } catch (error) {
      return {
        updated: false,
        changes: [],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Find all React component files
   */
  private async findComponentFiles(): Promise<string[]> {
    try {
      const patterns = [
        'components/**/*.{tsx,jsx}',
        'pages/**/*.{tsx,jsx}',
        'app/**/*.{tsx,jsx}',
        'src/**/*.{tsx,jsx}'
      ]

      const files: string[] = []
      
      for (const pattern of patterns) {
        try {
          const matchedFiles = await glob(pattern, {
            cwd: this.projectRoot,
            absolute: true,
            ignore: [
              'node_modules/**',
              '.next/**',
              '**/*.test.*',
              '**/*.spec.*',
              '**/*.stories.*'
            ]
          })
          files.push(...matchedFiles)
        } catch (error) {
          // Ignore pattern errors
        }
      }

      return Array.from(new Set(files)) // Remove duplicates
    } catch (error) {
      console.warn('Warning: Failed to find component files:', error)
      return []
    }
  }

  /**
   * Extract component name from file
   */
  private extractComponentName(filePath: string, content: string): string | null {
    // Try to extract from export default
    const defaultExportMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/)
    if (defaultExportMatch && defaultExportMatch[1]) {
      return defaultExportMatch[1]
    }

    // Try to extract from function declaration
    const functionMatch = content.match(/(?:export\s+)?function\s+(\w+)/)
    if (functionMatch && functionMatch[1]) {
      return functionMatch[1]
    }

    // Try to extract from const declaration
    const constMatch = content.match(/(?:export\s+)?const\s+(\w+)\s*=/)
    if (constMatch && constMatch[1]) {
      return constMatch[1]
    }

    // Fallback to filename
    const filename = filePath.split('/').pop()?.replace(/\.(tsx|jsx)$/, '')
    return filename || null
  }

  /**
   * Find mock data patterns in content
   */
  private findMockDataPatterns(content: string): string[] {
    const found: string[] = []

    for (const pattern of this.config.codePatterns.mockDataPatterns) {
      const regex = new RegExp(pattern, 'gi')
      const matches = content.match(regex)
      if (matches) {
        found.push(...matches)
      }
    }

    return found
  }

  /**
   * Check if component already has empty state
   */
  private hasExistingEmptyState(content: string): boolean {
    const emptyStatePatterns = [
      /EmptyState/i,
      /NoData/i,
      /Empty.*Component/i,
      /<Empty/i
    ]

    return emptyStatePatterns.some(pattern => pattern.test(content))
  }

  /**
   * Determine if component should have empty state
   */
  private shouldHaveEmptyState(content: string, componentName: string): boolean {
    // Check if component renders lists or data
    const dataRenderingPatterns = [
      /\.map\s*\(/,
      /\.filter\s*\(/,
      /\.length\s*===\s*0/,
      /data\s*\?\s*data\.map/,
      /items\s*\?\s*items\.map/,
      /list\s*\?\s*list\.map/
    ]

    const hasDataRendering = dataRenderingPatterns.some(pattern => pattern.test(content))
    
    // Check component name suggests it displays lists
    const listComponentNames = ['list', 'table', 'grid', 'items', 'requests', 'members']
    const isListComponent = listComponentNames.some(name => 
      componentName.toLowerCase().includes(name)
    )

    return hasDataRendering || isListComponent
  }

  /**
   * Get context around a line
   */
  private getContext(lines: string[], lineIndex: number): string {
    const start = Math.max(0, lineIndex - 1)
    const end = Math.min(lines.length - 1, lineIndex + 1)
    return lines.slice(start, end + 1).join('\n')
  }

  /**
   * Generate data fetching replacement for mock data
   */
  private generateDataFetchingReplacement(pattern: string): string {
    if (pattern.includes('mockData')) {
      return '// TODO: Replace with actual data fetching\n  // const { data, isLoading, error } = useQuery({ queryKey: [\'data\'], queryFn: fetchData })'
    }
    
    if (pattern.includes('MOCK_')) {
      return '// TODO: Replace with API call'
    }

    return '// TODO: Implement proper data fetching'
  }

  /**
   * Generate summary of analysis
   */
  private generateSummary(
    components: ComponentAnalysis[], 
    mockDataMatches: MockDataMatch[]
  ) {
    const componentsWithMockData = components.filter(c => c.mockDataFound.length > 0).length
    const componentsNeedingEmptyStates = components.filter(c => c.needsEmptyState && !c.hasEmptyState).length

    return {
      totalComponents: components.length,
      componentsWithMockData,
      componentsNeedingEmptyStates,
      totalMockDataInstances: mockDataMatches.length
    }
  }
}