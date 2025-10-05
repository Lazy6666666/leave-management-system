import { statSync, existsSync } from 'fs'
import { relative, resolve } from 'path'
import { glob } from 'glob'
import { defaultCleanupConfig, type CleanupConfig } from './config'
import { NextJSCleaner, type NextJSCleanupResult } from './nextjs-cleaner'

export interface ScanResult {
  filePath: string
  relativePath: string
  size: number
  type: 'documentation' | 'test' | 'build' | 'temp' | 'development'
  reason: string
}

export interface ScanSummary {
  totalFiles: number
  totalSize: number
  filesByType: Record<string, ScanResult[]>
  recommendations: string[]
}

/**
 * Artifact scanner for identifying development files that should be removed in production
 */
export class ArtifactScanner {
  private config: CleanupConfig
  private projectRoot: string

  constructor(config: CleanupConfig = defaultCleanupConfig, projectRoot?: string) {
    this.config = config
    this.projectRoot = projectRoot || process.cwd()
  }

  /**
   * Scan for development artifacts based on file patterns
   */
  async scanArtifacts(): Promise<ScanSummary> {
    const results: ScanResult[] = []
    const { remove, preserve } = this.config.filePatterns

    // Create a set of preserved files for quick lookup
    const preservedFiles = new Set<string>()
    for (const pattern of preserve) {
      try {
        const files = await glob(pattern, { 
          cwd: this.projectRoot,
          absolute: true,
          ignore: ['node_modules/**', '.git/**']
        })
        files.forEach(file => preservedFiles.add(resolve(file)))
      } catch (error) {
        console.warn(`Warning: Failed to process preserve pattern ${pattern}:`, error)
      }
    }

    // Scan for files to remove
    for (const pattern of remove) {
      try {
        const files = await glob(pattern, { 
          cwd: this.projectRoot,
          absolute: true,
          ignore: ['node_modules/**', '.git/**', '.next/**']
        })

        for (const file of files) {
          const resolvedFile = resolve(file)
          
          // Skip if file is in preserve list
          if (preservedFiles.has(resolvedFile)) {
            continue
          }

          // Skip if file doesn't exist
          if (!existsSync(resolvedFile)) {
            continue
          }

          try {
            const stats = statSync(resolvedFile)
            if (stats.isFile()) {
              const relativePath = relative(this.projectRoot, resolvedFile)
              const scanResult: ScanResult = {
                filePath: resolvedFile,
                relativePath,
                size: stats.size,
                type: this.categorizeFile(relativePath),
                reason: this.getRemovalReason(relativePath, pattern)
              }
              results.push(scanResult)
            }
          } catch (error) {
            console.warn(`Warning: Failed to stat file ${resolvedFile}:`, error)
          }
        }
      } catch (error) {
        console.warn(`Warning: Failed to process pattern ${pattern}:`, error)
      }
    }

    return this.generateSummary(results)
  }

  /**
   * Scan for Next.js specific build artifacts
   */
  async scanNextJSArtifacts(): Promise<ScanResult[]> {
    const results: ScanResult[] = []
    const { nextjsSpecific } = this.config.filePatterns

    for (const pattern of nextjsSpecific) {
      try {
        const files = await glob(pattern, { 
          cwd: this.projectRoot,
          absolute: true,
          dot: true // Include hidden directories like .next
        })

        for (const file of files) {
          if (!existsSync(file)) continue

          try {
            const stats = statSync(file)
            const relativePath = relative(this.projectRoot, file)
            
            if (stats.isDirectory()) {
              // For directories, calculate total size
              const dirSize = await this.calculateDirectorySize(file)
              results.push({
                filePath: file,
                relativePath,
                size: dirSize,
                type: 'build',
                reason: 'Next.js build artifact directory'
              })
            } else if (stats.isFile()) {
              results.push({
                filePath: file,
                relativePath,
                size: stats.size,
                type: 'build',
                reason: 'Next.js build artifact file'
              })
            }
          } catch (error) {
            console.warn(`Warning: Failed to process ${file}:`, error)
          }
        }
      } catch (error) {
        console.warn(`Warning: Failed to process Next.js pattern ${pattern}:`, error)
      }
    }

    return results
  }

  /**
   * Validate that critical files are preserved
   */
  async validatePreservedFiles(): Promise<{ missing: string[], present: string[] }> {
    const { preserve } = this.config.filePatterns
    const missing: string[] = []
    const present: string[] = []

    for (const pattern of preserve) {
      try {
        const files = await glob(pattern, { 
          cwd: this.projectRoot,
          absolute: true
        })

        if (files.length === 0) {
          missing.push(pattern)
        } else {
          present.push(...files.map(f => relative(this.projectRoot, f)))
        }
      } catch (error) {
        console.warn(`Warning: Failed to validate pattern ${pattern}:`, error)
        missing.push(pattern)
      }
    }

    return { missing, present }
  }

  /**
   * Generate a dry-run report of what would be cleaned
   */
  async generateCleanupReport(): Promise<{
    toRemove: ScanResult[]
    toPreserve: string[]
    nextjsArtifacts: ScanResult[]
    summary: ScanSummary
    validation: { missing: string[], present: string[] }
    nextjsCleanup: NextJSCleanupResult
  }> {
    const [toRemove, nextjsArtifacts, validation] = await Promise.all([
      this.scanArtifacts(),
      this.scanNextJSArtifacts(),
      this.validatePreservedFiles()
    ])

    // Use the new Next.js cleaner for comprehensive cleanup
    const nextjsCleaner = new NextJSCleaner(this.projectRoot)
    const nextjsCleanup = await nextjsCleaner.generateReport()

    const allFiles = Object.values(toRemove.filesByType).flat()

    return {
      toRemove: allFiles,
      toPreserve: validation.present,
      nextjsArtifacts,
      summary: toRemove,
      validation,
      nextjsCleanup
    }
  }

  /**
   * Execute Next.js specific cleanup
   */
  async executeNextJSCleanup(dryRun: boolean = false): Promise<any> {
    const nextjsCleaner = new NextJSCleaner(this.projectRoot)
    return nextjsCleaner.cleanup(dryRun)
  }

  /**
   * Categorize file based on its path and pattern
   */
  private categorizeFile(relativePath: string): ScanResult['type'] {
    if (relativePath.includes('__tests__') || relativePath.includes('.test.') || relativePath.includes('.spec.')) {
      return 'test'
    }
    if (relativePath.includes('.next') || relativePath.includes('.turbo') || relativePath.includes('.vercel')) {
      return 'build'
    }
    if (relativePath.includes('.temp') || relativePath.includes('.log') || relativePath.includes('.cache')) {
      return 'temp'
    }
    if (relativePath.includes('_SUMMARY') || relativePath.includes('_GUIDE') || relativePath.includes('PRODUCTION_')) {
      return 'documentation'
    }
    return 'development'
  }

  /**
   * Get reason for file removal based on pattern
   */
  private getRemovalReason(relativePath: string, pattern: string): string {
    if (pattern.includes('*_SUMMARY.md') || pattern.includes('*_GUIDE.md')) {
      return 'Development documentation file'
    }
    if (pattern.includes('*.test.*') || pattern.includes('*.spec.*')) {
      return 'Test file'
    }
    if (pattern.includes('__tests__')) {
      return 'Test directory'
    }
    if (pattern.includes('*.log') || pattern.includes('*.cache')) {
      return 'Temporary/cache file'
    }
    if (pattern.includes('PRODUCTION_') || pattern.includes('CONV.txt') || pattern.includes('GEMINI.md')) {
      return 'Development artifact file'
    }
    return `Matches cleanup pattern: ${pattern}`
  }

  /**
   * Calculate total size of a directory recursively
   */
  private async calculateDirectorySize(dirPath: string): Promise<number> {
    try {
      const files = await glob('**/*', { 
        cwd: dirPath,
        absolute: true,
        dot: true
      })

      let totalSize = 0
      for (const file of files) {
        try {
          const stats = statSync(file)
          if (stats.isFile()) {
            totalSize += stats.size
          }
        } catch (error) {
          // Ignore individual file errors
        }
      }
      return totalSize
    } catch (error) {
      return 0
    }
  }

  /**
   * Generate summary from scan results
   */
  private generateSummary(results: ScanResult[]): ScanSummary {
    const filesByType: Record<string, ScanResult[]> = {}
    let totalSize = 0

    results.forEach(result => {
      if (!filesByType[result.type]) {
        filesByType[result.type] = []
      }
      filesByType[result.type]!.push(result)
      totalSize += result.size
    })

    const recommendations: string[] = []
    
    const docFiles = filesByType.documentation
    if (docFiles && docFiles.length > 0) {
      recommendations.push(`Remove ${docFiles.length} documentation files (${this.formatBytes(docFiles.reduce((sum, f) => sum + f.size, 0))})`)
    }
    
    const testFiles = filesByType.test
    if (testFiles && testFiles.length > 0) {
      recommendations.push(`Remove ${testFiles.length} test files (${this.formatBytes(testFiles.reduce((sum, f) => sum + f.size, 0))})`)
    }
    
    const tempFiles = filesByType.temp
    if (tempFiles && tempFiles.length > 0) {
      recommendations.push(`Remove ${tempFiles.length} temporary files (${this.formatBytes(tempFiles.reduce((sum, f) => sum + f.size, 0))})`)
    }

    return {
      totalFiles: results.length,
      totalSize,
      filesByType,
      recommendations
    }
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}