/**
 * Development Comment and Debug Flag Removal Engine
 * Scans for and removes TODO, FIXME, DEBUG comments and temporary development flags
 */

import { readFileSync, writeFileSync } from 'fs'
import { defaultCleanupConfig, type CleanupConfig } from './config'

export interface DevelopmentComment {
  file: string
  line: number
  column: number
  type: 'TODO' | 'FIXME' | 'DEBUG' | 'HACK' | 'XXX' | 'MOCK_DATA'
  content: string
  fullLine: string
  shouldRemove: boolean
}

export interface CommentCleanupResult {
  file: string
  originalContent: string
  cleanedContent: string
  removedComments: DevelopmentComment[]
  preservedComments: DevelopmentComment[]
  hasChanges: boolean
}

/**
 * Comment and debug flag removal engine
 */
export class CommentCleaner {
  private config: CleanupConfig

  constructor(config: CleanupConfig = defaultCleanupConfig) {
    this.config = config
  }

  /**
   * Clean development comments from a file
   */
  async cleanFile(filePath: string): Promise<CommentCleanupResult> {
    const originalContent = readFileSync(filePath, 'utf-8')
    const result = this.cleanContent(originalContent, filePath)
    
    return {
      file: filePath,
      originalContent,
      cleanedContent: result.content,
      removedComments: result.removed,
      preservedComments: result.preserved,
      hasChanges: result.hasChanges
    }
  }

  /**
   * Clean development comments from content string
   */
  cleanContent(content: string, filePath: string = ''): {
    content: string
    removed: DevelopmentComment[]
    preserved: DevelopmentComment[]
    hasChanges: boolean
  } {
    const lines = content.split('\n')
    const removed: DevelopmentComment[] = []
    const preserved: DevelopmentComment[] = []
    let hasChanges = false

    // Process each line
    const cleanedLines = lines.map((line, lineIndex) => {
      const comments = this.findDevelopmentComments(line, lineIndex + 1, filePath)
      
      if (comments.length === 0) {
        return line
      }

      let cleanedLine = line
      
      for (const comment of comments) {
        if (comment.shouldRemove) {
          cleanedLine = this.removeComment(cleanedLine, comment)
          removed.push(comment)
          hasChanges = true
        } else {
          preserved.push(comment)
        }
      }

      return cleanedLine
    })

    // Remove empty lines that were left after comment removal
    const finalLines = cleanedLines.filter((line, index) => {
      // Keep non-empty lines
      if (line.trim() !== '') return true
      
      // Keep empty lines that are not the result of comment removal
      const originalLine = lines[index]
      return originalLine?.trim() === ''
    })

    return {
      content: finalLines.join('\n'),
      removed,
      preserved,
      hasChanges
    }
  }

  /**
   * Find development comments in a line
   */
  private findDevelopmentComments(line: string, lineNumber: number, filePath: string): DevelopmentComment[] {
    const comments: DevelopmentComment[] = []
    
    // Patterns for different comment types
    const patterns = [
      { type: 'TODO' as const, pattern: /\/\/\s*TODO:?.*$/gi },
      { type: 'FIXME' as const, pattern: /\/\/\s*FIXME:?.*$/gi },
      { type: 'DEBUG' as const, pattern: /\/\/\s*DEBUG:?.*$/gi },
      { type: 'HACK' as const, pattern: /\/\/\s*HACK:?.*$/gi },
      { type: 'XXX' as const, pattern: /\/\/\s*XXX:?.*$/gi },
      { type: 'MOCK_DATA' as const, pattern: /\/\/\s*Mock data.*$/gi },
    ]

    // Also check for block comments
    const blockPatterns = [
      { type: 'TODO' as const, pattern: /\/\*\s*TODO:?.*?\*\//gi },
      { type: 'FIXME' as const, pattern: /\/\*\s*FIXME:?.*?\*\//gi },
      { type: 'DEBUG' as const, pattern: /\/\*\s*DEBUG:?.*?\*\//gi },
    ]

    // Check single-line comments
    for (const { type, pattern } of patterns) {
      let match
      while ((match = pattern.exec(line)) !== null) {
        const content = match[0]
        const column = match.index + 1
        const shouldRemove = this.shouldRemoveComment(content, line, type)

        comments.push({
          file: filePath,
          line: lineNumber,
          column,
          type,
          content,
          fullLine: line,
          shouldRemove
        })
      }
    }

    // Check block comments
    for (const { type, pattern } of blockPatterns) {
      let match
      while ((match = pattern.exec(line)) !== null) {
        const content = match[0]
        const column = match.index + 1
        const shouldRemove = this.shouldRemoveComment(content, line, type)

        comments.push({
          file: filePath,
          line: lineNumber,
          column,
          type,
          content,
          fullLine: line,
          shouldRemove
        })
      }
    }

    return comments
  }

  /**
   * Determine if a comment should be removed
   */
  private shouldRemoveComment(content: string, line: string, type: string): boolean {
    const lowerContent = content.toLowerCase()
    const lowerLine = line.toLowerCase()

    // Always remove mock data comments
    if (type === 'MOCK_DATA' || lowerContent.includes('mock data')) {
      return true
    }

    // Remove development-only comments
    if (['TODO', 'FIXME', 'DEBUG', 'HACK', 'XXX'].includes(type)) {
      // Preserve comments that are marked as important
      const preserveKeywords = [
        'important',
        'critical',
        'security',
        'production',
        'keep',
        'preserve'
      ]

      if (preserveKeywords.some(keyword => lowerContent.includes(keyword))) {
        return false
      }

      return true
    }

    return false
  }

  /**
   * Remove comment from a line
   */
  private removeComment(line: string, comment: DevelopmentComment): string {
    // Remove the comment content
    let cleanedLine = line.replace(comment.content, '')
    
    // Clean up any trailing whitespace
    cleanedLine = cleanedLine.trimEnd()
    
    // If the line becomes empty or only whitespace, return empty string
    if (cleanedLine.trim() === '') {
      return ''
    }

    return cleanedLine
  }

  /**
   * Find and remove commented-out code blocks
   */
  findCommentedOutCode(content: string): {
    content: string
    removedBlocks: Array<{
      startLine: number
      endLine: number
      content: string
    }>
    hasChanges: boolean
  } {
    const lines = content.split('\n')
    const removedBlocks: Array<{ startLine: number, endLine: number, content: string }> = []
    const cleanedLines: string[] = []
    let hasChanges = false

    let inCommentedBlock = false
    let blockStart = -1
    let blockContent = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue
      const trimmedLine = line.trim()

      // Check if this line is commented-out code
      if (this.isCommentedOutCode(trimmedLine)) {
        if (!inCommentedBlock) {
          inCommentedBlock = true
          blockStart = i + 1
          blockContent = line || ''
        } else {
          blockContent += '\n' + (line || '')
        }
      } else {
        if (inCommentedBlock) {
          // End of commented block
          removedBlocks.push({
            startLine: blockStart,
            endLine: i,
            content: blockContent
          })
          inCommentedBlock = false
          hasChanges = true
        }
        cleanedLines.push(line || '')
      }
    }

    // Handle case where file ends with commented block
    if (inCommentedBlock) {
      removedBlocks.push({
        startLine: blockStart,
        endLine: lines.length,
        content: blockContent
      })
      hasChanges = true
    }

    return {
      content: cleanedLines.join('\n'),
      removedBlocks,
      hasChanges
    }
  }

  /**
   * Check if a line is commented-out code
   */
  private isCommentedOutCode(line: string): boolean {
    // Skip empty lines and regular comments
    if (!line.startsWith('//') && !line.startsWith('/*')) {
      return false
    }

    // Remove comment markers
    const codeContent = line.replace(/^\/\/\s*/, '').replace(/^\/\*\s*/, '').replace(/\s*\*\/$/, '')

    // Check if it looks like code
    const codePatterns = [
      /^\s*import\s+/,
      /^\s*export\s+/,
      /^\s*const\s+\w+\s*=/,
      /^\s*let\s+\w+\s*=/,
      /^\s*var\s+\w+\s*=/,
      /^\s*function\s+\w+/,
      /^\s*class\s+\w+/,
      /^\s*interface\s+\w+/,
      /^\s*type\s+\w+/,
      /^\s*\w+\s*\(/,
      /^\s*\w+\.\w+/,
      /^\s*return\s+/,
      /^\s*if\s*\(/,
      /^\s*for\s*\(/,
      /^\s*while\s*\(/,
      /^\s*\{.*\}$/,
      /^\s*\[.*\]$/,
    ]

    return codePatterns.some(pattern => pattern.test(codeContent))
  }

  /**
   * Remove development flags and feature toggles
   */
  removeDevelopmentFlags(content: string): {
    content: string
    removedFlags: Array<{
      line: number
      flag: string
      content: string
    }>
    hasChanges: boolean
  } {
    const lines = content.split('\n')
    const removedFlags: Array<{ line: number, flag: string, content: string }> = []
    let hasChanges = false

    const flagPatterns = [
      /if\s*\(\s*process\.env\.NODE_ENV\s*===\s*['"]development['"]\s*\)/,
      /__DEV__/,
      /development.*only/i,
      /debug.*mode/i,
      /test.*mode/i,
    ]

    const cleanedLines = lines.map((line, index) => {
      for (const pattern of flagPatterns) {
        if (pattern.test(line)) {
          removedFlags.push({
            line: index + 1,
            flag: pattern.source,
            content: line.trim()
          })
          hasChanges = true
          return '' // Remove the line
        }
      }
      return line
    })

    return {
      content: cleanedLines.filter(line => line !== '').join('\n'),
      removedFlags,
      hasChanges
    }
  }

  /**
   * Generate cleanup report
   */
  generateReport(results: CommentCleanupResult[]): {
    totalFiles: number
    filesWithChanges: number
    totalRemoved: number
    totalPreserved: number
    byType: Record<string, number>
    summary: string
  } {
    const totalFiles = results.length
    const filesWithChanges = results.filter(r => r.hasChanges).length
    const totalRemoved = results.reduce((sum, r) => sum + r.removedComments.length, 0)
    const totalPreserved = results.reduce((sum, r) => sum + r.preservedComments.length, 0)

    const byType: Record<string, number> = {}
    results.forEach(result => {
      result.removedComments.forEach(comment => {
        byType[comment.type] = (byType[comment.type] || 0) + 1
      })
    })

    const summary = `Comment Cleanup Report:
- Files processed: ${totalFiles}
- Files modified: ${filesWithChanges}
- Comments removed: ${totalRemoved}
- Comments preserved: ${totalPreserved}
- By type: ${Object.entries(byType).map(([type, count]) => `${type}: ${count}`).join(', ')}`

    return {
      totalFiles,
      filesWithChanges,
      totalRemoved,
      totalPreserved,
      byType,
      summary
    }
  }

  /**
   * Apply cleanup results to files
   */
  async applyCleanup(results: CommentCleanupResult[]): Promise<{
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
}

// Types are already exported above