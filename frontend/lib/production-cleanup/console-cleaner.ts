/**
 * Console Statement Removal Engine
 * AST-based parser to identify and remove console statements while preserving intentional error logging
 */

import { readFileSync, writeFileSync } from 'fs'
import { defaultCleanupConfig, type CleanupConfig } from './config'

export interface ConsoleStatement {
  file: string
  line: number
  column: number
  type: 'log' | 'warn' | 'error' | 'debug' | 'info'
  content: string
  isIntentional: boolean
  context: string
}

export interface ConsoleCleanupResult {
  file: string
  originalContent: string
  cleanedContent: string
  removedStatements: ConsoleStatement[]
  preservedStatements: ConsoleStatement[]
  hasChanges: boolean
}

/**
 * Console statement removal engine using regex patterns
 * In a production environment, this would use AST parsing with TypeScript compiler API
 */
export class ConsoleStatementCleaner {
  private config: CleanupConfig

  constructor(config: CleanupConfig = defaultCleanupConfig) {
    this.config = config
  }

  /**
   * Clean console statements from a file
   */
  async cleanFile(filePath: string): Promise<ConsoleCleanupResult> {
    const originalContent = readFileSync(filePath, 'utf-8')
    const result = this.cleanContent(originalContent, filePath)
    
    return {
      file: filePath,
      originalContent,
      cleanedContent: result.content,
      removedStatements: result.removed,
      preservedStatements: result.preserved,
      hasChanges: result.hasChanges
    }
  }

  /**
   * Clean console statements from content string
   */
  cleanContent(content: string, filePath: string = ''): {
    content: string
    removed: ConsoleStatement[]
    preserved: ConsoleStatement[]
    hasChanges: boolean
  } {
    const lines = content.split('\n')
    const removed: ConsoleStatement[] = []
    const preserved: ConsoleStatement[] = []
    let hasChanges = false

    // Process each line
    const cleanedLines = lines.map((line, lineIndex) => {
      const statements = this.findConsoleStatements(line, lineIndex + 1, filePath)
      
      if (statements.length === 0) {
        return line
      }

      let cleanedLine = line
      
      for (const statement of statements) {
        if (statement.isIntentional) {
          preserved.push(statement)
        } else {
          // Remove the console statement
          cleanedLine = this.removeConsoleStatement(cleanedLine, statement)
          removed.push(statement)
          hasChanges = true
        }
      }

      return cleanedLine
    })

    return {
      content: cleanedLines.join('\n'),
      removed,
      preserved,
      hasChanges
    }
  }

  /**
   * Find console statements in a line
   */
  private findConsoleStatements(line: string, lineNumber: number, filePath: string): ConsoleStatement[] {
    const statements: ConsoleStatement[] = []
    
    // Regex patterns for different console methods
    const patterns = [
      { type: 'log' as const, pattern: /console\.log\s*\([^)]*\)/g },
      { type: 'warn' as const, pattern: /console\.warn\s*\([^)]*\)/g },
      { type: 'error' as const, pattern: /console\.error\s*\([^)]*\)/g },
      { type: 'debug' as const, pattern: /console\.debug\s*\([^)]*\)/g },
      { type: 'info' as const, pattern: /console\.info\s*\([^)]*\)/g },
    ]

    for (const { type, pattern } of patterns) {
      let match
      while ((match = pattern.exec(line)) !== null) {
        const content = match[0]
        const column = match.index + 1
        const isIntentional = this.isIntentionalConsoleStatement(content, line, type)

        statements.push({
          file: filePath,
          line: lineNumber,
          column,
          type,
          content,
          isIntentional,
          context: line.trim()
        })
      }
    }

    return statements
  }

  /**
   * Determine if a console statement is intentional (should be preserved)
   */
  private isIntentionalConsoleStatement(content: string, line: string, type: string): boolean {
    // Preserve console.error statements that are clearly for error handling
    if (type === 'error') {
      const errorKeywords = ['catch', 'error', 'exception', 'fail', 'reject']
      const lowerContent = content.toLowerCase()
      const lowerLine = line.toLowerCase()
      
      if (errorKeywords.some(keyword => lowerContent.includes(keyword) || lowerLine.includes(keyword))) {
        return true
      }
    }

    // Preserve statements with specific comments indicating they should stay
    const preserveComments = [
      '// keep',
      '// preserve',
      '// production',
      '/* keep */',
      '/* preserve */',
      '/* production */'
    ]

    const lowerLine = line.toLowerCase()
    if (preserveComments.some(comment => lowerLine.includes(comment))) {
      return true
    }

    // Preserve statements in error handling blocks
    if (line.includes('catch') || line.includes('finally')) {
      return true
    }

    return false
  }

  /**
   * Remove console statement from a line
   */
  private removeConsoleStatement(line: string, statement: ConsoleStatement): string {
    // Simple removal - replace the console statement with empty string
    let cleanedLine = line.replace(statement.content, '')
    
    // Clean up any remaining semicolons or commas that might be left
    cleanedLine = cleanedLine.replace(/;\s*;/g, ';') // Remove double semicolons
    cleanedLine = cleanedLine.replace(/,\s*,/g, ',') // Remove double commas
    cleanedLine = cleanedLine.replace(/^\s*;\s*$/g, '') // Remove lines with only semicolons
    
    // If the line becomes empty or only whitespace, return empty string
    if (cleanedLine.trim() === '' || cleanedLine.trim() === ';') {
      return ''
    }

    return cleanedLine
  }

  /**
   * Clean multiple files
   */
  async cleanFiles(filePaths: string[]): Promise<ConsoleCleanupResult[]> {
    const results: ConsoleCleanupResult[] = []
    
    for (const filePath of filePaths) {
      try {
        const result = await this.cleanFile(filePath)
        results.push(result)
      } catch (error) {
        console.error(`Error cleaning file ${filePath}:`, error)
      }
    }

    return results
  }

  /**
   * Apply cleanup results to files
   */
  async applyCleanup(results: ConsoleCleanupResult[]): Promise<{
    success: string[]
    errors: Array<{ file: string, error: string }>
  }> {
    const success: string[] = []
    const errors: Array<{ file: string, error: string }> = []

    for (const result of results) {
      if (!result.hasChanges) {
        continue
      }

      try {
        writeFileSync(result.file, result.cleanedContent, 'utf-8')
        success.push(result.file)
      } catch (error) {
        errors.push({
          file: result.file,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return { success, errors }
  }

  /**
   * Generate cleanup report
   */
  generateReport(results: ConsoleCleanupResult[]): {
    totalFiles: number
    filesWithChanges: number
    totalRemoved: number
    totalPreserved: number
    summary: string
    details: Array<{
      file: string
      removed: number
      preserved: number
      statements: ConsoleStatement[]
    }>
  } {
    const totalFiles = results.length
    const filesWithChanges = results.filter(r => r.hasChanges).length
    const totalRemoved = results.reduce((sum, r) => sum + r.removedStatements.length, 0)
    const totalPreserved = results.reduce((sum, r) => sum + r.preservedStatements.length, 0)

    const summary = `Console Cleanup Report:
- Files processed: ${totalFiles}
- Files modified: ${filesWithChanges}
- Console statements removed: ${totalRemoved}
- Console statements preserved: ${totalPreserved}`

    const details = results.map(result => ({
      file: result.file,
      removed: result.removedStatements.length,
      preserved: result.preservedStatements.length,
      statements: [...result.removedStatements, ...result.preservedStatements]
    }))

    return {
      totalFiles,
      filesWithChanges,
      totalRemoved,
      totalPreserved,
      summary,
      details
    }
  }

  /**
   * Validate cleaned content for syntax errors
   */
  validateCleanedContent(content: string): { isValid: boolean, errors: string[] } {
    const errors: string[] = []
    
    // Basic syntax validation
    const lines = content.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue
      
      // Check for unmatched brackets
      const openBrackets = (line.match(/\{/g) || []).length
      const closeBrackets = (line.match(/\}/g) || []).length
      const openParens = (line.match(/\(/g) || []).length
      const closeParens = (line.match(/\)/g) || []).length
      
      if (openBrackets !== closeBrackets) {
        errors.push(`Line ${i + 1}: Unmatched curly brackets`)
      }
      
      if (openParens !== closeParens) {
        errors.push(`Line ${i + 1}: Unmatched parentheses`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * Utility functions for console statement cleanup
 */
export const ConsoleCleanupUtils = {
  /**
   * Find all TypeScript/JavaScript files in a directory
   */
  findSourceFiles(directory: string, extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']): string[] {
    // This would be implemented with file system traversal
    // For now, return empty array as placeholder
    return []
  },

  /**
   * Create backup of files before cleaning
   */
  createBackup(filePaths: string[], backupDir: string): Promise<void> {
    // Implementation would copy files to backup directory
    return Promise.resolve()
  },

  /**
   * Restore files from backup
   */
  restoreFromBackup(backupDir: string): Promise<void> {
    // Implementation would restore files from backup
    return Promise.resolve()
  }
}

// Types are already exported above