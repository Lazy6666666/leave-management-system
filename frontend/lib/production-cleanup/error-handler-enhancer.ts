import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, relative } from 'path'
import { glob } from 'glob'
import { defaultCleanupConfig, type CleanupConfig } from './config'

export interface ErrorHandlerAnalysis {
  file: string
  hasErrorBoundary: boolean
  hasErrorHandling: boolean
  apiCalls: ApiCallAnalysis[]
  recommendations: string[]
}

export interface ApiCallAnalysis {
  line: number
  method: string
  hasErrorHandling: boolean
  hasTryCatch: boolean
  hasRetry: boolean
  suggestion: string
}

export interface ErrorHandlerEnhancement {
  file: string
  enhancements: Enhancement[]
  error?: string
}

export interface Enhancement {
  type: 'error-boundary' | 'api-error-handling' | 'retry-logic' | 'user-feedback'
  description: string
  code: string
  line?: number
}

/**
 * Error handler enhancer for improving error handling across the application
 */
export class ErrorHandlerEnhancer {
  private config: CleanupConfig
  private projectRoot: string

  constructor(config: CleanupConfig = defaultCleanupConfig, projectRoot?: string) {
    this.config = config
    this.projectRoot = projectRoot || process.cwd()
  }

  /**
   * Analyze error handling across all components
   */
  async analyzeErrorHandling(): Promise<{
    components: ErrorHandlerAnalysis[]
    summary: {
      totalComponents: number
      componentsWithErrorBoundaries: number
      componentsWithApiErrorHandling: number
      apiCallsNeedingImprovement: number
    }
  }> {
    const componentFiles = await this.findComponentFiles()
    const components: ErrorHandlerAnalysis[] = []

    let componentsWithErrorBoundaries = 0
    let componentsWithApiErrorHandling = 0
    let apiCallsNeedingImprovement = 0

    for (const file of componentFiles) {
      try {
        const analysis = await this.analyzeComponent(file)
        components.push(analysis)

        if (analysis.hasErrorBoundary) componentsWithErrorBoundaries++
        if (analysis.hasErrorHandling) componentsWithApiErrorHandling++
        apiCallsNeedingImprovement += analysis.apiCalls.filter(call => !call.hasErrorHandling).length
      } catch (error) {
        console.warn(`Warning: Failed to analyze ${file}:`, error)
      }
    }

    return {
      components,
      summary: {
        totalComponents: components.length,
        componentsWithErrorBoundaries,
        componentsWithApiErrorHandling,
        apiCallsNeedingImprovement
      }
    }
  }

  /**
   * Enhance error handling in a specific component
   */
  async enhanceComponent(filePath: string): Promise<ErrorHandlerEnhancement> {
    if (!existsSync(filePath)) {
      return {
        file: relative(this.projectRoot, filePath),
        enhancements: [],
        error: 'File not found'
      }
    }

    try {
      const content = readFileSync(filePath, 'utf-8')
      const analysis = await this.analyzeComponent(filePath)
      const enhancements = this.generateEnhancements(content, analysis)

      // Apply enhancements
      const enhancedContent = this.applyEnhancements(content, enhancements)
      
      if (enhancedContent !== content) {
        writeFileSync(filePath, enhancedContent)
      }

      return {
        file: relative(this.projectRoot, filePath),
        enhancements
      }
    } catch (error) {
      return {
        file: relative(this.projectRoot, filePath),
        enhancements: [],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Generate enhanced error boundary wrapper
   */
  generateErrorBoundaryWrapper(componentName: string): string {
    return `import React from 'react'
import { ErrorBoundary, CompactErrorFallback } from '@/components/error-boundary'

interface ${componentName}WithErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

export function ${componentName}WithErrorBoundary({ 
  children, 
  fallback = CompactErrorFallback 
}: ${componentName}WithErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={fallback}
      onError={(error, errorInfo) => {
        // Log error to monitoring service
        console.error('${componentName} Error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export default ${componentName}WithErrorBoundary`
  }

  /**
   * Generate enhanced API error handling
   */
  generateApiErrorHandling(): string {
    return `import { toast } from 'sonner'

export interface ApiError {
  status: number
  message: string
  details?: Record<string, string[]>
  retryable: boolean
}

export function handleApiError(error: unknown): ApiError {
  // Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message?: string }
    
    switch (supabaseError.code) {
      case 'PGRST116':
        return {
          status: 404,
          message: 'No data found',
          retryable: false
        }
      case 'PGRST301':
        return {
          status: 403,
          message: 'Access denied. Please check your permissions.',
          retryable: false
        }
      case '23505':
        return {
          status: 409,
          message: 'This record already exists',
          retryable: false
        }
      default:
        return {
          status: 500,
          message: supabaseError.message || 'Database error occurred',
          retryable: true
        }
    }
  }

  // HTTP errors
  if (error && typeof error === 'object' && 'status' in error) {
    const httpError = error as { status: number; message?: string }
    
    switch (httpError.status) {
      case 401:
        return {
          status: 401,
          message: 'Please log in to continue',
          retryable: false
        }
      case 403:
        return {
          status: 403,
          message: 'You don\\'t have permission to perform this action',
          retryable: false
        }
      case 422:
        return {
          status: 422,
          message: 'Please check your input and try again',
          details: httpError.details,
          retryable: false
        }
      case 500:
        return {
          status: 500,
          message: 'Server error. Please try again later.',
          retryable: true
        }
      default:
        return {
          status: httpError.status || 500,
          message: httpError.message || 'An error occurred',
          retryable: true
        }
    }
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      status: 0,
      message: 'Network error. Please check your connection.',
      retryable: true
    }
  }

  // Default error
  return {
    status: 500,
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    retryable: true
  }
}

export function showErrorToast(error: ApiError) {
  toast.error(error.message, {
    description: error.details ? 'Please check the highlighted fields' : undefined,
    action: error.retryable ? {
      label: 'Retry',
      onClick: () => window.location.reload()
    } : undefined
  })
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const apiError = handleApiError(error)
      
      if (!apiError.retryable || attempt === maxRetries) {
        throw error
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
    }
  }

  throw lastError
}`
  }

  /**
   * Analyze a specific component
   */
  private async analyzeComponent(filePath: string): Promise<ErrorHandlerAnalysis> {
    const content = readFileSync(filePath, 'utf-8')
    const relativePath = relative(this.projectRoot, filePath)

    const hasErrorBoundary = this.hasErrorBoundary(content)
    const hasErrorHandling = this.hasErrorHandling(content)
    const apiCalls = this.analyzeApiCalls(content)
    const recommendations = this.generateRecommendations(hasErrorBoundary, hasErrorHandling, apiCalls)

    return {
      file: relativePath,
      hasErrorBoundary,
      hasErrorHandling,
      apiCalls,
      recommendations
    }
  }

  /**
   * Check if component has error boundary
   */
  private hasErrorBoundary(content: string): boolean {
    const errorBoundaryPatterns = [
      /ErrorBoundary/,
      /componentDidCatch/,
      /getDerivedStateFromError/,
      /useErrorBoundary/
    ]

    return errorBoundaryPatterns.some(pattern => pattern.test(content))
  }

  /**
   * Check if component has error handling
   */
  private hasErrorHandling(content: string): boolean {
    const errorHandlingPatterns = [
      /try\s*{[\s\S]*?catch/,
      /\.catch\s*\(/,
      /onError\s*[:=]/,
      /error\s*&&/,
      /isError/,
      /errorMessage/
    ]

    return errorHandlingPatterns.some(pattern => pattern.test(content))
  }

  /**
   * Analyze API calls in the component
   */
  private analyzeApiCalls(content: string): ApiCallAnalysis[] {
    const lines = content.split('\n')
    const apiCalls: ApiCallAnalysis[] = []

    lines.forEach((line, index) => {
      // Look for API call patterns
      const apiCallPatterns = [
        /fetch\s*\(/,
        /axios\./,
        /supabase\./,
        /useQuery\s*\(/,
        /useMutation\s*\(/
      ]

      apiCallPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          const hasErrorHandling = this.lineHasErrorHandling(line, lines, index)
          const hasTryCatch = this.lineHasTryCatch(lines, index)
          const hasRetry = this.lineHasRetry(line, lines, index)

          apiCalls.push({
            line: index + 1,
            method: line.trim(),
            hasErrorHandling,
            hasTryCatch,
            hasRetry,
            suggestion: this.generateApiCallSuggestion(hasErrorHandling, hasTryCatch, hasRetry)
          })
        }
      })
    })

    return apiCalls
  }

  /**
   * Check if line has error handling
   */
  private lineHasErrorHandling(line: string, lines: string[], index: number): boolean {
    // Check current line and surrounding lines for error handling
    const contextLines = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3))
    const context = contextLines.join('\n')

    return /\.catch|onError|error\s*[:=]|isError/.test(context)
  }

  /**
   * Check if line is in try-catch block
   */
  private lineHasTryCatch(lines: string[], index: number): boolean {
    // Look backwards for try block
    for (let i = index; i >= 0; i--) {
      const line = lines[i]
      if (line?.includes('try')) {
        // Look forwards for catch block
        for (let j = index; j < lines.length; j++) {
          const catchLine = lines[j]
          if (catchLine?.includes('catch')) {
            return true
          }
        }
      }
    }
    return false
  }

  /**
   * Check if line has retry logic
   */
  private lineHasRetry(line: string, lines: string[], index: number): boolean {
    const contextLines = lines.slice(Math.max(0, index - 5), Math.min(lines.length, index + 5))
    const context = contextLines.join('\n')

    return /retry|retries|attempt|withRetry/.test(context)
  }

  /**
   * Generate API call suggestion
   */
  private generateApiCallSuggestion(hasErrorHandling: boolean, hasTryCatch: boolean, hasRetry: boolean): string {
    if (!hasErrorHandling) {
      return 'Add error handling with .catch() or try-catch'
    }
    if (!hasRetry) {
      return 'Consider adding retry logic for network errors'
    }
    if (!hasTryCatch) {
      return 'Consider wrapping in try-catch for better error handling'
    }
    return 'Error handling looks good'
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    hasErrorBoundary: boolean,
    hasErrorHandling: boolean,
    apiCalls: ApiCallAnalysis[]
  ): string[] {
    const recommendations: string[] = []

    if (!hasErrorBoundary) {
      recommendations.push('Add error boundary to catch rendering errors')
    }

    if (!hasErrorHandling && apiCalls.length > 0) {
      recommendations.push('Add error handling for API calls')
    }

    const unhandledApiCalls = apiCalls.filter(call => !call.hasErrorHandling)
    if (unhandledApiCalls.length > 0) {
      recommendations.push(`${unhandledApiCalls.length} API calls need error handling`)
    }

    const callsWithoutRetry = apiCalls.filter(call => !call.hasRetry)
    if (callsWithoutRetry.length > 0) {
      recommendations.push(`Consider adding retry logic to ${callsWithoutRetry.length} API calls`)
    }

    return recommendations
  }

  /**
   * Generate enhancements for a component
   */
  private generateEnhancements(content: string, analysis: ErrorHandlerAnalysis): Enhancement[] {
    const enhancements: Enhancement[] = []

    // Add error boundary if missing
    if (!analysis.hasErrorBoundary) {
      enhancements.push({
        type: 'error-boundary',
        description: 'Wrap component with error boundary',
        code: this.generateErrorBoundaryImport()
      })
    }

    // Add API error handling
    const unhandledApiCalls = analysis.apiCalls.filter(call => !call.hasErrorHandling)
    if (unhandledApiCalls.length > 0) {
      enhancements.push({
        type: 'api-error-handling',
        description: 'Add error handling to API calls',
        code: this.generateApiErrorHandling()
      })
    }

    return enhancements
  }

  /**
   * Apply enhancements to content
   */
  private applyEnhancements(content: string, enhancements: Enhancement[]): string {
    let enhancedContent = content

    enhancements.forEach(enhancement => {
      switch (enhancement.type) {
        case 'error-boundary':
          enhancedContent = this.addErrorBoundaryImport(enhancedContent)
          break
        case 'api-error-handling':
          enhancedContent = this.addApiErrorHandling(enhancedContent)
          break
      }
    })

    return enhancedContent
  }

  /**
   * Generate error boundary import
   */
  private generateErrorBoundaryImport(): string {
    return "import { ErrorBoundary } from '@/components/error-boundary'"
  }

  /**
   * Add error boundary import to content
   */
  private addErrorBoundaryImport(content: string): string {
    if (content.includes('ErrorBoundary')) {
      return content
    }

    const importMatch = content.match(/^import.*$/gm)
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1]
      if (lastImport) {
        return content.replace(lastImport, `${lastImport}\n${this.generateErrorBoundaryImport()}`)
      }
    }

    return content
  }

  /**
   * Add API error handling to content
   */
  private addApiErrorHandling(content: string): string {
    // This would be more sophisticated in a real implementation
    // For now, just add import
    if (content.includes('handleApiError')) {
      return content
    }

    const importMatch = content.match(/^import.*$/gm)
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1]
      if (lastImport) {
        return content.replace(lastImport, `${lastImport}\nimport { handleApiError, showErrorToast } from '@/lib/api-error-handler'`)
      }
    }

    return content
  }

  /**
   * Find all component files
   */
  private async findComponentFiles(): Promise<string[]> {
    try {
      const patterns = [
        'components/**/*.{tsx,jsx}',
        'pages/**/*.{tsx,jsx}',
        'app/**/*.{tsx,jsx}'
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
              '**/*.spec.*'
            ]
          })
          files.push(...matchedFiles)
        } catch (error) {
          // Ignore pattern errors
        }
      }

      return [...new Set(files)]
    } catch (error) {
      console.warn('Warning: Failed to find component files:', error)
      return []
    }
  }
}