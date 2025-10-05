import { promises as fs } from 'fs'
import { join, relative } from 'path'
import { glob } from 'glob'
import { existsSync, statSync } from 'fs'

export interface NextJSCleanupResult {
  removed: string[]
  errors: Array<{ file: string; error: string }>
  totalSize: number
  summary: {
    buildDirectories: number
    testFiles: number
    storyFiles: number
    tempFiles: number
    logFiles: number
  }
}

/**
 * Next.js specific cleanup patterns for production deployment
 * Handles build directories, development files, and temporary artifacts
 */
export class NextJSCleaner {
  private projectRoot: string

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd()
  }

  /**
   * Execute complete Next.js cleanup process
   */
  async cleanup(dryRun: boolean = false): Promise<NextJSCleanupResult> {
    const result: NextJSCleanupResult = {
      removed: [],
      errors: [],
      totalSize: 0,
      summary: {
        buildDirectories: 0,
        testFiles: 0,
        storyFiles: 0,
        tempFiles: 0,
        logFiles: 0
      }
    }

    // Clean build directories
    await this.cleanBuildDirectories(result, dryRun)
    
    // Clean development-only files
    await this.cleanDevelopmentFiles(result, dryRun)
    
    // Clean temporary files and logs
    await this.cleanTemporaryFiles(result, dryRun)

    return result
  }

  /**
   * Remove Next.js build directories (.next/, .turbo/, .vercel/)
   */
  private async cleanBuildDirectories(result: NextJSCleanupResult, dryRun: boolean): Promise<void> {
    const buildPatterns = [
      '.next',
      '.turbo', 
      '.vercel',
      'frontend/.next',
      'frontend/.turbo',
      'frontend/.vercel',
      'backend/.temp',
      'supabase/.temp'
    ]

    for (const pattern of buildPatterns) {
      const fullPath = join(this.projectRoot, pattern)
      
      if (existsSync(fullPath)) {
        try {
          const stats = statSync(fullPath)
          if (stats.isDirectory()) {
            const size = await this.calculateDirectorySize(fullPath)
            result.totalSize += size
            result.summary.buildDirectories++
            
            if (!dryRun) {
              await fs.rm(fullPath, { recursive: true, force: true })
            }
            
            result.removed.push(relative(this.projectRoot, fullPath))
          }
        } catch (error) {
          result.errors.push({
            file: relative(this.projectRoot, fullPath),
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }
  }

  /**
   * Remove development-only files (*.test.*, *.spec.*, *.stories.*)
   */
  private async cleanDevelopmentFiles(result: NextJSCleanupResult, dryRun: boolean): Promise<void> {
    const developmentPatterns = [
      '**/*.test.*',
      '**/*.spec.*', 
      '**/*.stories.*',
      '**/__tests__/**/*',
      '**/e2e/**/*',
      '**/test-results/**/*',
      '**/coverage/**/*',
      '**/.playwright/**/*'
    ]

    for (const pattern of developmentPatterns) {
      try {
        const files = await glob(pattern, {
          cwd: this.projectRoot,
          absolute: true,
          ignore: ['node_modules/**', '.git/**']
        })

        for (const file of files) {
          if (existsSync(file)) {
            try {
              const stats = statSync(file)
              result.totalSize += stats.size
              
              // Categorize file type
              if (file.includes('.test.') || file.includes('.spec.')) {
                result.summary.testFiles++
              } else if (file.includes('.stories.')) {
                result.summary.storyFiles++
              }
              
              if (!dryRun) {
                if (stats.isDirectory()) {
                  await fs.rm(file, { recursive: true, force: true })
                } else {
                  await fs.unlink(file)
                }
              }
              
              result.removed.push(relative(this.projectRoot, file))
            } catch (error) {
              result.errors.push({
                file: relative(this.projectRoot, file),
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          }
        }
      } catch (error) {
        result.errors.push({
          file: pattern,
          error: `Pattern error: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }
  }

  /**
   * Remove temporary files and logs
   */
  private async cleanTemporaryFiles(result: NextJSCleanupResult, dryRun: boolean): Promise<void> {
    const tempPatterns = [
      '**/*.log',
      '**/*.cache',
      '**/tmp/**/*',
      '**/.temp/**/*',
      '**/debug.log',
      '**/error.log',
      '**/npm-debug.log*',
      '**/yarn-debug.log*',
      '**/yarn-error.log*',
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/*.tsbuildinfo',
      '**/.eslintcache'
    ]

    for (const pattern of tempPatterns) {
      try {
        const files = await glob(pattern, {
          cwd: this.projectRoot,
          absolute: true,
          ignore: ['node_modules/**', '.git/**'],
          dot: true // Include hidden files
        })

        for (const file of files) {
          if (existsSync(file)) {
            try {
              const stats = statSync(file)
              result.totalSize += stats.size
              
              // Categorize file type
              if (file.includes('.log')) {
                result.summary.logFiles++
              } else {
                result.summary.tempFiles++
              }
              
              if (!dryRun) {
                if (stats.isDirectory()) {
                  await fs.rm(file, { recursive: true, force: true })
                } else {
                  await fs.unlink(file)
                }
              }
              
              result.removed.push(relative(this.projectRoot, file))
            } catch (error) {
              result.errors.push({
                file: relative(this.projectRoot, file),
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          }
        }
      } catch (error) {
        result.errors.push({
          file: pattern,
          error: `Pattern error: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }
  }

  /**
   * Generate cleanup report without actually removing files
   */
  async generateReport(): Promise<NextJSCleanupResult> {
    return this.cleanup(true)
  }

  /**
   * Check if specific Next.js artifacts exist
   */
  async checkArtifacts(): Promise<{
    buildDirs: Array<{ path: string; exists: boolean; size?: number }>
    devFiles: number
    tempFiles: number
  }> {
    const buildDirs = [
      '.next',
      '.turbo', 
      '.vercel',
      'frontend/.next',
      'frontend/.turbo',
      'frontend/.vercel'
    ]

    const buildDirStatus = await Promise.all(
      buildDirs.map(async (dir) => {
        const fullPath = join(this.projectRoot, dir)
        const exists = existsSync(fullPath)
        let size: number | undefined
        
        if (exists) {
          try {
            size = await this.calculateDirectorySize(fullPath)
          } catch {
            size = 0
          }
        }
        
        return { path: dir, exists, size }
      })
    )

    // Count development files
    const devFilePatterns = ['**/*.test.*', '**/*.spec.*', '**/*.stories.*']
    let devFiles = 0
    
    for (const pattern of devFilePatterns) {
      try {
        const files = await glob(pattern, {
          cwd: this.projectRoot,
          ignore: ['node_modules/**', '.git/**']
        })
        devFiles += files.length
      } catch {
        // Ignore pattern errors
      }
    }

    // Count temporary files
    const tempFilePatterns = ['**/*.log', '**/*.cache', '**/.temp/**/*']
    let tempFiles = 0
    
    for (const pattern of tempFilePatterns) {
      try {
        const files = await glob(pattern, {
          cwd: this.projectRoot,
          ignore: ['node_modules/**', '.git/**'],
          dot: true
        })
        tempFiles += files.length
      } catch {
        // Ignore pattern errors
      }
    }

    return {
      buildDirs: buildDirStatus,
      devFiles,
      tempFiles
    }
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
        } catch {
          // Ignore individual file errors
        }
      }
      return totalSize
    } catch {
      return 0
    }
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}