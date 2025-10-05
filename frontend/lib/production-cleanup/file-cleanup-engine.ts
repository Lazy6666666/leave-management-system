import { unlinkSync, rmSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { ArtifactScanner, type ScanResult } from './artifact-scanner'
import { defaultCleanupConfig, type CleanupConfig } from './config'

export interface CleanupResult {
  removed: string[]
  errors: Array<{ file: string, error: string }>
  totalSize: number
  summary: {
    documentation: number
    test: number
    build: number
    temp: number
    development: number
  }
}

export interface CleanupOptions {
  dryRun?: boolean
  verbose?: boolean
  backup?: boolean
  force?: boolean
}

/**
 * File system cleanup engine for removing development artifacts
 */
export class FileCleanupEngine {
  private config: CleanupConfig
  private projectRoot: string
  private scanner: ArtifactScanner

  constructor(config: CleanupConfig = defaultCleanupConfig, projectRoot?: string) {
    this.config = config
    this.projectRoot = projectRoot || process.cwd()
    this.scanner = new ArtifactScanner(config, projectRoot)
  }

  /**
   * Perform complete cleanup of development artifacts
   */
  async cleanup(options: CleanupOptions = {}): Promise<CleanupResult> {
    const { dryRun = false, verbose = false } = options

    if (verbose) {
      console.log('🧹 Starting production cleanup...')
    }

    // Generate cleanup report
    const report = await this.scanner.generateCleanupReport()
    
    if (verbose) {
      console.log(`📊 Found ${report.summary.totalFiles} files to clean (${this.formatBytes(report.summary.totalSize)})`)
    }

    const result: CleanupResult = {
      removed: [],
      errors: [],
      totalSize: 0,
      summary: {
        documentation: 0,
        test: 0,
        build: 0,
        temp: 0,
        development: 0
      }
    }

    // Clean development artifacts
    await this.cleanArtifacts(report.toRemove, result, { dryRun, verbose })
    
    // Clean Next.js specific artifacts
    await this.cleanArtifacts(report.nextjsArtifacts, result, { dryRun, verbose })

    if (verbose) {
      console.log(`✅ Cleanup complete: ${result.removed.length} files removed (${this.formatBytes(result.totalSize)})`)
      if (result.errors.length > 0) {
        console.log(`⚠️  ${result.errors.length} errors occurred`)
      }
    }

    return result
  }

  /**
   * Clean specific artifacts
   */
  private async cleanArtifacts(
    artifacts: ScanResult[], 
    result: CleanupResult, 
    options: { dryRun?: boolean, verbose?: boolean }
  ): Promise<void> {
    const { dryRun = false, verbose = false } = options

    for (const artifact of artifacts) {
      try {
        if (dryRun) {
          if (verbose) {
            console.log(`[DRY RUN] Would remove: ${artifact.relativePath} (${artifact.reason})`)
          }
          result.removed.push(artifact.relativePath)
          result.totalSize += artifact.size
          result.summary[artifact.type]++
        } else {
          if (existsSync(artifact.filePath)) {
            // Remove file or directory
            rmSync(artifact.filePath, { recursive: true, force: true })
            
            if (verbose) {
              console.log(`🗑️  Removed: ${artifact.relativePath} (${this.formatBytes(artifact.size)})`)
            }
            
            result.removed.push(artifact.relativePath)
            result.totalSize += artifact.size
            result.summary[artifact.type]++
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        result.errors.push({
          file: artifact.relativePath,
          error: errorMessage
        })
        
        if (verbose) {
          console.error(`❌ Failed to remove ${artifact.relativePath}: ${errorMessage}`)
        }
      }
    }
  }

  /**
   * Clean specific file patterns
   */
  async cleanPattern(pattern: string, options: CleanupOptions = {}): Promise<CleanupResult> {
    const { dryRun = false, verbose = false } = options
    
    // Create temporary config with just this pattern
    const tempConfig = {
      ...this.config,
      filePatterns: {
        ...this.config.filePatterns,
        remove: [pattern]
      }
    }
    
    const tempScanner = new ArtifactScanner(tempConfig, this.projectRoot)
    const summary = await tempScanner.scanArtifacts()
    
    const result: CleanupResult = {
      removed: [],
      errors: [],
      totalSize: 0,
      summary: {
        documentation: 0,
        test: 0,
        build: 0,
        temp: 0,
        development: 0
      }
    }

    // Convert summary to scan results
    const artifacts: ScanResult[] = []
    Object.values(summary.filesByType).forEach(files => {
      artifacts.push(...files)
    })

    await this.cleanArtifacts(artifacts, result, { dryRun, verbose })
    
    return result
  }

  /**
   * Validate cleanup safety
   */
  async validateCleanupSafety(): Promise<{
    safe: boolean
    warnings: string[]
    criticalFiles: string[]
  }> {
    const warnings: string[] = []
    const criticalFiles: string[] = []
    
    // Check for preserved files
    const validation = await this.scanner.validatePreservedFiles()
    
    if (validation.missing.length > 0) {
      warnings.push(`Missing critical files: ${validation.missing.join(', ')}`)
    }
    
    // Check for potential issues
    const report = await this.scanner.generateCleanupReport()
    
    // Look for potentially important files in removal list
    const allArtifacts = [
      ...Object.values(report.summary.filesByType).flat(),
      ...report.nextjsArtifacts
    ]
    
    for (const artifact of allArtifacts) {
      if (this.isCriticalFile(artifact.relativePath)) {
        criticalFiles.push(artifact.relativePath)
        warnings.push(`Critical file marked for removal: ${artifact.relativePath}`)
      }
    }
    
    const safe = warnings.length === 0
    
    return { safe, warnings, criticalFiles }
  }

  /**
   * Generate cleanup preview
   */
  async generatePreview(): Promise<{
    summary: string
    details: {
      type: string
      count: number
      size: string
      files: string[]
    }[]
    warnings: string[]
  }> {
    const report = await this.scanner.generateCleanupReport()
    const validation = await this.validateCleanupSafety()
    
    const details = Object.entries(report.summary.filesByType).map(([type, files]) => ({
      type,
      count: files.length,
      size: this.formatBytes(files.reduce((sum, f) => sum + f.size, 0)),
      files: files.slice(0, 5).map(f => f.relativePath) // Show first 5 files
    }))
    
    // Add Next.js artifacts
    if (report.nextjsArtifacts.length > 0) {
      details.push({
        type: 'nextjs-build',
        count: report.nextjsArtifacts.length,
        size: this.formatBytes(report.nextjsArtifacts.reduce((sum, f) => sum + f.size, 0)),
        files: report.nextjsArtifacts.slice(0, 5).map(f => f.relativePath)
      })
    }
    
    const totalFiles = report.summary.totalFiles + report.nextjsArtifacts.length
    const totalSize = report.summary.totalSize + report.nextjsArtifacts.reduce((sum, f) => sum + f.size, 0)
    
    const summary = `Found ${totalFiles} files to clean (${this.formatBytes(totalSize)})`
    
    return {
      summary,
      details,
      warnings: validation.warnings
    }
  }

  /**
   * Check if a file is critical and should not be removed
   */
  private isCriticalFile(relativePath: string): boolean {
    const criticalPatterns = [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'next.config.js',
      'tailwind.config.js',
      '.env.example',
      '.gitignore',
      'README.md'
    ]
    
    return criticalPatterns.some(pattern => 
      relativePath.includes(pattern) || relativePath.endsWith(pattern)
    )
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