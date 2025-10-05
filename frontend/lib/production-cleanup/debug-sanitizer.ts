import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, relative } from 'path'
import { glob } from 'glob'
import { defaultCleanupConfig, type CleanupConfig } from './config'

export interface DebugCodeMatch {
  file: string
  line: number
  column: number
  match: string
  type: 'console' | 'comment' | 'credential' | 'development'
  severity: 'low' | 'medium' | 'high'
  context: string
}

export interface SanitizationResult {
  file: string
  removed: DebugCodeMatch[]
  preserved: DebugCodeMatch[]
  error?: string
}

export interface SanitizationSummary {
  totalFiles: number
  totalMatches: number
  removedMatches: number
  preservedMatches: number
  fileResults: SanitizationResult[]
  summary: {
    consoleStatements: number
    debugComments: number
    credentials: number
    developmentCode: number
  }
}

/**
 * Debug code sanitizer for removing console statements, debug comments, and credentials
 */
export class DebugSanitizer {
  private config: CleanupConfig
  private projectRoot: string

  constructor(config: CleanupConfig = defaultCleanupConfig, projectRoot?: string) {
    this.config = config
    this.projectRoot = projectRoot || process.cwd()
  }

  /**
   * Sanitize all source files
   */
  async sanitizeAll(): Promise<SanitizationSummary> {
    const sourceFiles = await this.findSourceFiles()
    const fileResults: SanitizationResult[] = []
    
    let totalMatches = 0
    let removedMatches = 0
    let preservedMatches = 0
    
    const summary = {
      consoleStatements: 0,
      debugComments: 0,
      credentials: 0,
      developmentCode: 0
    }

    for (const file of sourceFiles) {
      try {
        const result = await this.sanitizeFile(file)
        fileResults.push(result)
        
        totalMatches += result.removed.length + result.preserved.length
        removedMatches += result.removed.length
        preservedMatches += result.preserved.length
        
        // Update summary counts
        result.removed.forEach(match => {
          switch (match.type) {
            case 'console':
              summary.consoleStatements++
              break
            case 'comment':
              summary.debugComments++
              break
            case 'credential':
              summary.credentials++
              break
            case 'development':
              summary.developmentCode++
              break
          }
        })
      } catch (error) {
        fileResults.push({
          file: relative(this.projectRoot, file),
          removed: [],
          preserved: [],
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return {
      totalFiles: sourceFiles.length,
      totalMatches,
      removedMatches,
      preservedMatches,
      fileResults,
      summary
    }
  }

  /**
   * Sanitize a specific file
   */
  async sanitizeFile(filePath: string): Promise<SanitizationResult> {
    if (!existsSync(filePath)) {
      return {
        file: relative(this.projectRoot, filePath),
        removed: [],
        preserved: [],
        error: 'File not found'
      }
    }

    try {
      const content = readFileSync(filePath, 'utf-8')
      const matches = this.findDebugCode(content, filePath)
      
      const { sanitizedContent, removed, preserved } = this.processSanitization(content, matches)
      
      // Write sanitized content back to file
      if (removed.length > 0) {
        writeFileSync(filePath, sanitizedContent)
      }

      return {
        file: relative(this.projectRoot, filePath),
        removed,
        preserved
      }
    } catch (error) {
      return {
        file: relative(this.projectRoot, filePath),
        removed: [],
        preserved: [],
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Preview sanitization without making changes
   */
  async previewSanitization(): Promise<{
    matches: DebugCodeMatch[]
    summary: SanitizationSummary['summary']
    recommendations: string[]
  }> {
    const sourceFiles = await this.findSourceFiles()
    const allMatches: DebugCodeMatch[] = []
    
    const summary = {
      consoleStatements: 0,
      debugComments: 0,
      credentials: 0,
      developmentCode: 0
    }

    for (const file of sourceFiles) {
      try {
        if (existsSync(file)) {
          const content = readFileSync(file, 'utf-8')
          const matches = this.findDebugCode(content, file)
          allMatches.push(...matches)
          
          matches.forEach(match => {
            switch (match.type) {
              case 'console':
                summary.consoleStatements++
                break
              case 'comment':
                summary.debugComments++
                break
              case 'credential':
                summary.credentials++
                break
              case 'development':
                summary.developmentCode++
                break
            }
          })
        }
      } catch (error) {
        console.warn(`Warning: Failed to preview file ${file}:`, error)
      }
    }

    const recommendations = this.generateRecommendations(summary)

    return {
      matches: allMatches,
      summary,
      recommendations
    }
  }

  /**
   * Find all debug code in content
   */
  private findDebugCode(content: string, filePath: string): DebugCodeMatch[] {
    const matches: DebugCodeMatch[] = []
    const lines = content.split('\n')
    const relativePath = relative(this.projectRoot, filePath)

    // Find console statements
    this.config.codePatterns.consoleStatements.forEach(pattern => {
      matches.push(...this.findMatches(lines, pattern, 'console', relativePath))
    })

    // Find debug comments
    this.config.codePatterns.debugComments.forEach(pattern => {
      matches.push(...this.findMatches(lines, pattern, 'comment', relativePath))
    })

    // Find hardcoded credentials
    this.config.codePatterns.hardcodedCredentials.forEach(pattern => {
      matches.push(...this.findMatches(lines, pattern, 'credential', relativePath))
    })

    // Find development-only code
    this.config.codePatterns.developmentOnlyCode.forEach(pattern => {
      matches.push(...this.findMatches(lines, pattern, 'development', relativePath))
    })

    return matches
  }

  /**
   * Find matches for a specific pattern
   */
  private findMatches(
    lines: string[], 
    pattern: string, 
    type: DebugCodeMatch['type'], 
    filePath: string
  ): DebugCodeMatch[] {
    const matches: DebugCodeMatch[] = []
    const regex = new RegExp(pattern, 'gi')

    lines.forEach((line, lineIndex) => {
      let match
      while ((match = regex.exec(line)) !== null) {
        matches.push({
          file: filePath,
          line: lineIndex + 1,
          column: match.index + 1,
          match: match[0],
          type,
          severity: this.getSeverity(type, match[0]),
          context: this.getContext(lines, lineIndex)
        })
      }
    })

    return matches
  }

  /**
   * Process sanitization and return results
   */
  private processSanitization(content: string, matches: DebugCodeMatch[]): {
    sanitizedContent: string
    removed: DebugCodeMatch[]
    preserved: DebugCodeMatch[]
  } {
    let sanitizedContent = content
    const removed: DebugCodeMatch[] = []
    const preserved: DebugCodeMatch[] = []

    // Sort matches by line number (descending) to avoid index issues when removing
    const sortedMatches = matches.sort((a, b) => b.line - a.line)

    for (const match of sortedMatches) {
      if (this.shouldPreserve(match)) {
        preserved.push(match)
      } else {
        // Remove the match
        const lines = sanitizedContent.split('\n')
        const lineIndex = match.line - 1
        
        if (lineIndex >= 0 && lineIndex < lines.length) {
          const line = lines[lineIndex]
          if (!line) continue
          const updatedLine = this.sanitizeLine(line, match)
          
          if (updatedLine !== line) {
            lines[lineIndex] = updatedLine
            sanitizedContent = lines.join('\n')
            removed.push(match)
          }
        }
      }
    }

    return { sanitizedContent, removed, preserved }
  }

  /**
   * Sanitize a specific line
   */
  private sanitizeLine(line: string, match: DebugCodeMatch): string {
    switch (match.type) {
      case 'console':
        // Remove entire console statement line if it's the only thing on the line
        if (line.trim().startsWith('console.') && line.trim().endsWith(';')) {
          return ''
        }
        // Otherwise just remove the console statement
        return line.replace(new RegExp(match.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '')
      
      case 'comment':
        // Remove debug comments
        return line.replace(new RegExp(match.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '')
      
      case 'credential':
        // Replace credentials with placeholder
        return line.replace(new RegExp(match.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'process.env.SECRET_KEY')
      
      case 'development':
        // Remove development-only code blocks
        return ''
      
      default:
        return line
    }
  }

  /**
   * Determine if a match should be preserved
   */
  private shouldPreserve(match: DebugCodeMatch): boolean {
    // Preserve intentional error logging
    if (match.type === 'console' && match.match.includes('console.error')) {
      // Check if it's in a catch block or error handler
      if (match.context.includes('catch') || match.context.includes('error')) {
        return true
      }
    }

    // Preserve high-severity credentials (they need manual review)
    if (match.type === 'credential' && match.severity === 'high') {
      return true
    }

    // Preserve comments that might be important
    if (match.type === 'comment') {
      const importantCommentPatterns = [
        /eslint-disable/i,
        /@ts-ignore/i,
        /@ts-expect-error/i,
        /prettier-ignore/i
      ]
      
      if (importantCommentPatterns.some(pattern => pattern.test(match.match))) {
        return true
      }
    }

    return false
  }

  /**
   * Get severity level for a match
   */
  private getSeverity(type: DebugCodeMatch['type'], match: string): DebugCodeMatch['severity'] {
    switch (type) {
      case 'console':
        if (match.includes('console.error') || match.includes('console.warn')) {
          return 'medium'
        }
        return 'low'
      
      case 'credential':
        if (match.includes('sk_live_') || match.includes('password')) {
          return 'high'
        }
        return 'medium'
      
      case 'comment':
        if (match.includes('FIXME') || match.includes('HACK')) {
          return 'medium'
        }
        return 'low'
      
      case 'development':
        return 'medium'
      
      default:
        return 'low'
    }
  }

  /**
   * Get context around a line
   */
  private getContext(lines: string[], lineIndex: number): string {
    const start = Math.max(0, lineIndex - 2)
    const end = Math.min(lines.length - 1, lineIndex + 2)
    return lines.slice(start, end + 1).join('\n')
  }

  /**
   * Find all source files to sanitize
   */
  private async findSourceFiles(): Promise<string[]> {
    try {
      const patterns = [
        '**/*.{ts,tsx,js,jsx}',
        '!node_modules/**',
        '!.next/**',
        '!**/*.test.*',
        '!**/*.spec.*',
        '!**/*.d.ts'
      ]

      const files = await glob(patterns, {
        cwd: this.projectRoot,
        absolute: true
      })

      return files
    } catch (error) {
      console.warn('Warning: Failed to find source files:', error)
      return []
    }
  }

  /**
   * Generate recommendations based on summary
   */
  private generateRecommendations(summary: SanitizationSummary['summary']): string[] {
    const recommendations: string[] = []

    if (summary.consoleStatements > 0) {
      recommendations.push(`Remove ${summary.consoleStatements} console statements for production`)
    }

    if (summary.credentials > 0) {
      recommendations.push(`⚠️  Found ${summary.credentials} potential hardcoded credentials - review manually`)
    }

    if (summary.debugComments > 0) {
      recommendations.push(`Clean up ${summary.debugComments} debug comments`)
    }

    if (summary.developmentCode > 0) {
      recommendations.push(`Remove ${summary.developmentCode} development-only code blocks`)
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ No debug code found - ready for production')
    }

    return recommendations
  }
}