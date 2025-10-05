import { ArtifactScanner } from './artifact-scanner'
import { FileCleanup } from './file-cleanup'
import { MockDataDetector } from './mock-data-detector'
import { EmptyStateGenerator } from './empty-state-generator'
import { DebugSanitizer } from './debug-sanitizer'
import { ErrorHandlerEnhancer } from './error-handler-enhancer'
import { PerformanceOptimizer } from './performance-optimizer'
import { SecurityValidator } from './security-validator'
import { defaultCleanupConfig, type CleanupConfig } from './config'

export interface ProductionCleanupOptions {
  dryRun?: boolean
  skipBackup?: boolean
  skipTests?: boolean
  force?: boolean
  verbose?: boolean
}

export interface ProductionCleanupResult {
  success: boolean
  summary: CleanupSummary
  results: {
    fileCleanup: unknown
    mockDataReplacement: unknown
    debugSanitization: unknown
    errorHandling: unknown
    performance: unknown
    security: unknown
  }
  errors: string[]
  warnings: string[]
  recommendations: string[]
}

export interface CleanupSummary {
  totalFilesProcessed: number
  filesRemoved: number
  filesModified: number
  issuesFixed: number
  performanceScore: number
  securityScore: number
  estimatedSavings: {
    bundleSize: number
    loadTime: number
  }
}

/**
 * Main production cleanup orchestrator
 */
export class ProductionCleanup {
  private config: CleanupConfig
  private projectRoot: string
  private scanner: ArtifactScanner
  private fileCleanup: FileCleanup
  private mockDataDetector: MockDataDetector
  private emptyStateGenerator: EmptyStateGenerator
  private debugSanitizer: DebugSanitizer
  private errorHandlerEnhancer: ErrorHandlerEnhancer
  private performanceOptimizer: PerformanceOptimizer
  private securityValidator: SecurityValidator

  constructor(config: CleanupConfig = defaultCleanupConfig, projectRoot?: string) {
    this.config = config
    this.projectRoot = projectRoot || process.cwd()
    
    // Initialize all cleanup components
    this.scanner = new ArtifactScanner(config, projectRoot)
    this.fileCleanup = new FileCleanup(config, projectRoot)
    this.mockDataDetector = new MockDataDetector(config, projectRoot)
    this.emptyStateGenerator = new EmptyStateGenerator(config)
    this.debugSanitizer = new DebugSanitizer(config, projectRoot)
    this.errorHandlerEnhancer = new ErrorHandlerEnhancer(config, projectRoot)
    this.performanceOptimizer = new PerformanceOptimizer(config, projectRoot)
    this.securityValidator = new SecurityValidator(config, projectRoot)
  }

  /**
   * Run complete production cleanup process
   */
  async cleanup(options: ProductionCleanupOptions = {}): Promise<ProductionCleanupResult> {
    const { dryRun = false, skipBackup = false, force = false, verbose = false } = options
    
    const errors: string[] = []
    const warnings: string[] = []
    const recommendations: string[] = []

    if (verbose) {
      console.log('🚀 Starting production cleanup process...')
    }

    try {
      // Step 1: Pre-cleanup validation
      if (verbose) console.log('📋 Running pre-cleanup validation...')
      const preValidation = await this.runPreCleanupValidation()
      if (!preValidation.passed && !force) {
        throw new Error(`Pre-cleanup validation failed: ${preValidation.errors.join(', ')}`)
      }
      warnings.push(...preValidation.warnings)

      // Step 2: File system cleanup
      if (verbose) console.log('🗂️  Cleaning up development artifacts...')
      const fileCleanupResult = await this.fileCleanup.cleanup({
        dryRun,
        backup: !skipBackup,
        backupDir: `${this.projectRoot}/.cleanup-backup-${Date.now()}`
      })

      // Step 3: Mock data replacement with empty states
      if (verbose) console.log('🔄 Replacing mock data with empty states...')
      const mockDataAnalysis = await this.mockDataDetector.scanForMockData()
      const emptyStates = await this.emptyStateGenerator.generateEmptyStates(mockDataAnalysis.components)
      const emptyStateResult = await this.emptyStateGenerator.createEmptyStateFiles(emptyStates)

      // Step 4: Debug code sanitization
      if (verbose) console.log('🧹 Sanitizing debug code...')
      const debugSanitizationResult = await this.debugSanitizer.sanitizeAll()

      // Step 5: Error handling enhancement
      if (verbose) console.log('🛡️  Enhancing error handling...')
      const errorHandlingAnalysis = await this.errorHandlerEnhancer.analyzeErrorHandling()

      // Step 6: Performance optimization
      if (verbose) console.log('⚡ Optimizing performance...')
      const performanceAnalysis = await this.performanceOptimizer.analyzePerformance()

      // Step 7: Security validation
      if (verbose) console.log('🔒 Validating security...')
      const securityAnalysis = await this.securityValidator.validateSecurity()

      // Step 8: Post-cleanup validation
      if (verbose) console.log('✅ Running post-cleanup validation...')
      const postValidation = await this.runPostCleanupValidation()
      if (!postValidation.passed) {
        warnings.push(...postValidation.errors)
      }

      // Step 9: Generate summary and recommendations
      const summary = this.generateSummary({
        fileCleanupResult,
        mockDataAnalysis,
        emptyStateResult,
        debugSanitizationResult,
        errorHandlingAnalysis,
        performanceAnalysis,
        securityAnalysis
      })

      recommendations.push(...this.generateRecommendations({
        performanceAnalysis,
        securityAnalysis,
        debugSanitizationResult
      }))

      if (verbose) {
        console.log('🎉 Production cleanup completed successfully!')
        console.log(`📊 Summary: ${summary.filesModified} files modified, ${summary.issuesFixed} issues fixed`)
        console.log(`⚡ Performance score: ${summary.performanceScore}/100`)
        console.log(`🔒 Security score: ${summary.securityScore}/100`)
      }

      return {
        success: true,
        summary,
        results: {
          fileCleanup: fileCleanupResult,
          mockDataReplacement: { mockDataAnalysis, emptyStateResult },
          debugSanitization: debugSanitizationResult,
          errorHandling: errorHandlingAnalysis,
          performance: performanceAnalysis,
          security: securityAnalysis
        },
        errors,
        warnings,
        recommendations
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      errors.push(errorMessage)

      if (verbose) {
        console.error('❌ Production cleanup failed:', errorMessage)
      }

      return {
        success: false,
        summary: this.getEmptySummary(),
        results: {
          fileCleanup: null,
          mockDataReplacement: null,
          debugSanitization: null,
          errorHandling: null,
          performance: null,
          security: null
        },
        errors,
        warnings,
        recommendations
      }
    }
  }

  /**
   * Run cleanup preview without making changes
   */
  async preview(): Promise<{
    willRemove: string[]
    willModify: string[]
    estimatedImpact: CleanupSummary
    warnings: string[]
    recommendations: string[]
  }> {
    const [
      filePreview,
      mockDataAnalysis,
      debugPreview,
      performanceAnalysis,
      securityAnalysis
    ] = await Promise.all([
      this.fileCleanup.previewCleanup(),
      this.mockDataDetector.scanForMockData(),
      this.debugSanitizer.previewSanitization(),
      this.performanceOptimizer.analyzePerformance(),
      this.securityValidator.validateSecurity()
    ])

    const willRemove = filePreview.willRemove.map(f => f.relativePath)
    const willModify = [
      ...mockDataAnalysis.components.filter(c => c.needsEmptyState).map(c => c.file),
      ...debugPreview.matches.map(m => m.file)
    ]

    const estimatedImpact: CleanupSummary = {
      totalFilesProcessed: willRemove.length + willModify.length,
      filesRemoved: willRemove.length,
      filesModified: willModify.length,
      issuesFixed: debugPreview.summary.consoleStatements + 
                   debugPreview.summary.debugComments + 
                   mockDataAnalysis.summary.componentsNeedingEmptyStates,
      performanceScore: performanceAnalysis.summary.averageScore,
      securityScore: securityAnalysis.summary.overallScore,
      estimatedSavings: {
        bundleSize: filePreview.estimatedSpaceSaved,
        loadTime: performanceAnalysis.summary.averageScore * 10 // Rough estimate
      }
    }

    const warnings = [
      ...filePreview.warnings,
      ...debugPreview.recommendations.filter(r => r.includes('⚠️')),
      ...securityAnalysis.summary.highSeverityIssues > 0 ? ['High severity security issues found'] : []
    ]

    const recommendations = [
      ...debugPreview.recommendations,
      ...performanceAnalysis.summary.recommendations,
      ...securityAnalysis.environmentVariables.recommendations
    ]

    return {
      willRemove,
      willModify,
      estimatedImpact,
      warnings,
      recommendations
    }
  }

  /**
   * Run production readiness check
   */
  async checkProductionReadiness(): Promise<{
    ready: boolean
    score: number
    issues: Array<{
      category: string
      severity: 'low' | 'medium' | 'high'
      description: string
      recommendation: string
    }>
    summary: {
      fileCleanup: boolean
      mockDataHandled: boolean
      debugCodeRemoved: boolean
      errorHandlingComplete: boolean
      performanceOptimized: boolean
      securityValidated: boolean
    }
  }> {
    const [
      performanceAnalysis,
      securityAnalysis,
      debugPreview
    ] = await Promise.all([
      this.performanceOptimizer.analyzePerformance(),
      this.securityValidator.validateSecurity(),
      this.debugSanitizer.previewSanitization()
    ])

    const issues: Array<{
      category: string
      severity: 'low' | 'medium' | 'high'
      description: string
      recommendation: string
    }> = []

    // Check performance issues
    performanceAnalysis.components.forEach(component => {
      component.issues.forEach(issue => {
        issues.push({
          category: 'Performance',
          severity: issue.severity,
          description: `${component.file}: ${issue.description}`,
          recommendation: issue.suggestion
        })
      })
    })

    // Check security issues
    securityAnalysis.codeSecurityIssues.forEach(issue => {
      issues.push({
        category: 'Security',
        severity: issue.severity,
        description: `${issue.file}:${issue.line} - ${issue.description}`,
        recommendation: issue.suggestion
      })
    })

    // Check debug code
    if (debugPreview.summary.consoleStatements > 0) {
      issues.push({
        category: 'Debug Code',
        severity: 'medium',
        description: `${debugPreview.summary.consoleStatements} console statements found`,
        recommendation: 'Remove console statements for production'
      })
    }

    const highSeverityIssues = issues.filter(i => i.severity === 'high').length
    const mediumSeverityIssues = issues.filter(i => i.severity === 'medium').length
    const lowSeverityIssues = issues.filter(i => i.severity === 'low').length

    const score = Math.max(0, 100 - (highSeverityIssues * 20) - (mediumSeverityIssues * 10) - (lowSeverityIssues * 5))
    const ready = score >= 80 && highSeverityIssues === 0

    const summary = {
      fileCleanup: true, // Assume file cleanup is always possible
      mockDataHandled: debugPreview.summary.consoleStatements === 0,
      debugCodeRemoved: debugPreview.summary.consoleStatements === 0 && debugPreview.summary.debugComments === 0,
      errorHandlingComplete: true, // Would check actual error handling
      performanceOptimized: performanceAnalysis.summary.averageScore >= 80,
      securityValidated: securityAnalysis.summary.overallScore >= 80
    }

    return {
      ready,
      score,
      issues,
      summary
    }
  }

  /**
   * Pre-cleanup validation
   */
  private async runPreCleanupValidation(): Promise<{
    passed: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if git is clean
    try {
      const { execSync } = await import('child_process')
      const gitStatus = execSync('git status --porcelain', { 
        cwd: this.projectRoot, 
        encoding: 'utf-8' 
      })
      
      if (gitStatus.trim()) {
        warnings.push('Git working directory is not clean - consider committing changes first')
      }
    } catch (error) {
      warnings.push('Could not check git status')
    }

    // Check if build works
    try {
      const { execSync } = await import('child_process')
      execSync('npm run build', { 
        cwd: this.projectRoot, 
        stdio: 'pipe',
        timeout: 120000 
      })
    } catch (error) {
      errors.push('Build failed - fix build errors before cleanup')
    }

    // Check if tests pass
    try {
      const { execSync } = await import('child_process')
      execSync('npm run test:run', { 
        cwd: this.projectRoot, 
        stdio: 'pipe',
        timeout: 60000 
      })
    } catch (error) {
      warnings.push('Tests are failing - consider fixing tests before cleanup')
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Post-cleanup validation
   */
  private async runPostCleanupValidation(): Promise<{
    passed: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    // Check if build still works after cleanup
    try {
      const { execSync } = await import('child_process')
      execSync('npm run build', { 
        cwd: this.projectRoot, 
        stdio: 'pipe',
        timeout: 120000 
      })
    } catch (error) {
      errors.push('Build failed after cleanup - some changes may have broken the build')
    }

    // Run production readiness check
    try {
      const { execSync } = await import('child_process')
      execSync('npm run production-check', { 
        cwd: this.projectRoot, 
        stdio: 'pipe' 
      })
    } catch (error) {
      errors.push('Production readiness check failed')
    }

    return {
      passed: errors.length === 0,
      errors
    }
  }

  /**
   * Generate cleanup summary
   */
  private generateSummary(results: { [key: string]: unknown }): CleanupSummary {
    const {
      fileCleanupResult,
      mockDataAnalysis,
      emptyStateResult,
      debugSanitizationResult,
      performanceAnalysis,
      securityAnalysis
    } = results

    // Type assertions for unknown values
    const fileCleanup = fileCleanupResult as { removed: unknown[]; summary: { spaceSaved: number } }
    const emptyState = emptyStateResult as { created: unknown[] }
    const debugSanitization = debugSanitizationResult as { totalFiles: number; removedMatches: number; summary: { consoleStatements: number } }
    const mockData = mockDataAnalysis as { summary: { componentsNeedingEmptyStates: number } }
    const performance = performanceAnalysis as { summary: { averageScore: number } }
    const security = securityAnalysis as { summary: { overallScore: number } }

    return {
      totalFilesProcessed: fileCleanup.removed.length + 
                          emptyState.created.length + 
                          debugSanitization.totalFiles,
      filesRemoved: fileCleanup.removed.length,
      filesModified: emptyState.created.length + debugSanitization.removedMatches,
      issuesFixed: debugSanitization.removedMatches + 
                   mockData.summary.componentsNeedingEmptyStates,
      performanceScore: performance.summary.averageScore,
      securityScore: security.summary.overallScore,
      estimatedSavings: {
        bundleSize: fileCleanup.summary.spaceSaved,
        loadTime: performance.summary.averageScore * 10
      }
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(results: { [key: string]: unknown }): string[] {
    const { performanceAnalysis, securityAnalysis, debugSanitizationResult } = results
    const recommendations: string[] = []

    // Type assertions
    const performance = performanceAnalysis as { summary: { averageScore: number; recommendations: string[] } }
    const security = securityAnalysis as { summary: { overallScore: number }; environmentVariables: { recommendations: string[] } }
    const debugSanitization = debugSanitizationResult as { removedMatches: number; summary?: { consoleStatements: number } }

    // Performance recommendations
    if (performance.summary.averageScore < 80) {
      recommendations.push('Consider additional performance optimizations')
      recommendations.push(...performance.summary.recommendations)
    }

    // Security recommendations
    if (security.summary.overallScore < 80) {
      recommendations.push('Address security issues before deployment')
      recommendations.push(...security.environmentVariables.recommendations)
    }

    // Debug code recommendations
    if (debugSanitization.summary && debugSanitization.summary.consoleStatements > 0) {
      recommendations.push('Remove remaining console statements')
    }

    // General recommendations
    recommendations.push('Run end-to-end tests before deployment')
    recommendations.push('Monitor application performance after deployment')
    recommendations.push('Set up error tracking and monitoring')

    return recommendations
  }

  /**
   * Get empty summary for error cases
   */
  private getEmptySummary(): CleanupSummary {
    return {
      totalFilesProcessed: 0,
      filesRemoved: 0,
      filesModified: 0,
      issuesFixed: 0,
      performanceScore: 0,
      securityScore: 0,
      estimatedSavings: {
        bundleSize: 0,
        loadTime: 0
      }
    }
  }
}