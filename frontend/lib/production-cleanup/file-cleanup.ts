import { unlinkSync, rmSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { ArtifactScanner, type ScanResult } from './artifact-scanner'
import { defaultCleanupConfig, type CleanupConfig } from './config'

export interface CleanupResult {
  removed: string[]
  failed: Array<{ file: string, error: string }>
  preserved: string[]
  summary: {
    totalRemoved: number
    totalFailed: number
    spaceSaved: number
  }
}

export interface CleanupOptions {
  dryRun?: boolean
  force?: boolean
  backup?: boolean
  backupDir?: string
}

/**
 * File cleanup engine for removing development artifacts
 */
export class FileCleanup {
  private config: CleanupConfig
  private projectRoot: string
  private scanner: ArtifactScanner

  constructor(config: CleanupConfig = defaultCleanupConfig, projectRoot?: string) {
    this.config = config
    this.projectRoot = projectRoot || process.cwd()
    this.scanner = new ArtifactScanner(config, projectRoot)
  }

  /**
   * Perform cleanup of development artifacts
   */
  async cleanup(options: CleanupOptions = {}): Promise<CleanupResult> {
    const { dryRun = false, force = false, backup = false, backupDir } = options

    // Generate cleanup report first
    const report = await this.scanner.generateCleanupReport()
    
    const removed: string[] = []
    const failed: Array<{ file: string, error: string }> = []
    const preserved: string[] = report.toPreserve
    let spaceSaved = 0

    // Validate critical files are preserved
    if (report.validation.missing.length > 0 && !force) {
      throw new Error(`Critical files missing: ${report.validation.missing.join(', ')}. Use force=true to override.`)
    }

    // Process files to remove
    const allFilesToRemove = [
      ...Object.values(report.summary.filesByType).flat(),
      ...report.nextjsArtifacts
    ]

    for (const fileInfo of allFilesToRemove) {
      try {
        if (dryRun) {
          removed.push(fileInfo.relativePath)
          spaceSaved += fileInfo.size
          continue
        }

        // Create backup if requested
        if (backup && backupDir) {
          await this.createBackup(fileInfo.filePath, backupDir)
        }

        // Remove file or directory
        if (existsSync(fileInfo.filePath)) {
          rmSync(fileInfo.filePath, { recursive: true, force: true })
          removed.push(fileInfo.relativePath)
          spaceSaved += fileInfo.size
        }
      } catch (error) {
        failed.push({
          file: fileInfo.relativePath,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return {
      removed,
      failed,
      preserved,
      summary: {
        totalRemoved: removed.length,
        totalFailed: failed.length,
        spaceSaved
      }
    }
  }

  /**
   * Clean specific file patterns
   */
  async cleanupPattern(pattern: string, options: CleanupOptions = {}): Promise<CleanupResult> {
    const tempConfig = {
      ...this.config,
      filePatterns: {
        ...this.config.filePatterns,
        remove: [pattern]
      }
    }

    const tempCleanup = new FileCleanup(tempConfig, this.projectRoot)
    return tempCleanup.cleanup(options)
  }

  /**
   * Clean Next.js build artifacts only
   */
  async cleanupNextJSArtifacts(options: CleanupOptions = {}): Promise<CleanupResult> {
    const { dryRun = false } = options
    const removed: string[] = []
    const failed: Array<{ file: string, error: string }> = []
    let spaceSaved = 0

    const nextjsArtifacts = await this.scanner.scanNextJSArtifacts()

    for (const artifact of nextjsArtifacts) {
      try {
        if (dryRun) {
          removed.push(artifact.relativePath)
          spaceSaved += artifact.size
          continue
        }

        if (existsSync(artifact.filePath)) {
          rmSync(artifact.filePath, { recursive: true, force: true })
          removed.push(artifact.relativePath)
          spaceSaved += artifact.size
        }
      } catch (error) {
        failed.push({
          file: artifact.relativePath,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return {
      removed,
      failed,
      preserved: [],
      summary: {
        totalRemoved: removed.length,
        totalFailed: failed.length,
        spaceSaved
      }
    }
  }

  /**
   * Generate cleanup preview without actually removing files
   */
  async previewCleanup(): Promise<{
    willRemove: ScanResult[]
    willPreserve: string[]
    estimatedSpaceSaved: number
    warnings: string[]
  }> {
    const report = await this.scanner.generateCleanupReport()
    const allFilesToRemove = [
      ...Object.values(report.summary.filesByType).flat(),
      ...report.nextjsArtifacts
    ]

    const estimatedSpaceSaved = allFilesToRemove.reduce((total, file) => total + file.size, 0)
    const warnings: string[] = []

    // Check for potential issues
    if (report.validation.missing.length > 0) {
      warnings.push(`Missing critical files: ${report.validation.missing.join(', ')}`)
    }

    const largeFiles = allFilesToRemove.filter(f => f.size > 10 * 1024 * 1024) // > 10MB
    if (largeFiles.length > 0) {
      warnings.push(`Large files will be removed: ${largeFiles.map(f => f.relativePath).join(', ')}`)
    }

    return {
      willRemove: allFilesToRemove,
      willPreserve: report.toPreserve,
      estimatedSpaceSaved,
      warnings
    }
  }

  /**
   * Create backup of file before removal
   */
  private async createBackup(filePath: string, backupDir: string): Promise<void> {
    try {
      const backupPath = filePath.replace(this.projectRoot, backupDir)
      const backupDirPath = dirname(backupPath)
      
      // Ensure backup directory exists
      mkdirSync(backupDirPath, { recursive: true })
      
      // Copy file to backup location
      const { copyFileSync } = await import('fs')
      copyFileSync(filePath, backupPath)
    } catch (error) {
      throw new Error(`Failed to create backup: ${error}`)
    }
  }

  /**
   * Restore files from backup
   */
  async restoreFromBackup(backupDir: string): Promise<{
    restored: string[]
    failed: Array<{ file: string, error: string }>
  }> {
    const restored: string[] = []
    const failed: Array<{ file: string, error: string }> = []

    try {
      const { glob } = await import('glob')
      const backupFiles = await glob('**/*', {
        cwd: backupDir,
        absolute: true,
        dot: true
      })

      for (const backupFile of backupFiles) {
        try {
          const originalPath = backupFile.replace(backupDir, this.projectRoot)
          const originalDir = dirname(originalPath)
          
          // Ensure original directory exists
          mkdirSync(originalDir, { recursive: true })
          
          // Copy file back
          const { copyFileSync } = await import('fs')
          copyFileSync(backupFile, originalPath)
          restored.push(originalPath)
        } catch (error) {
          failed.push({
            file: backupFile,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error}`)
    }

    return { restored, failed }
  }
}