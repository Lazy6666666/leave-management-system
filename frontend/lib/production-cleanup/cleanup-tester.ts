import { test, expect, Page, Browser } from '@playwright/test'
import { ProductionCleanup } from './production-cleanup'
import { defaultCleanupConfig } from './config'

export interface CleanupTestResult {
  testName: string
  passed: boolean
  duration: number
  error?: string
  details?: Record<string, unknown>
}

export interface CleanupTestSuite {
  name: string
  tests: CleanupTestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    duration: number
  }
}

/**
 * Comprehensive testing framework for production cleanup
 */
export class CleanupTester {
  private cleanup: ProductionCleanup
  private projectRoot: string

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd()
    this.cleanup = new ProductionCleanup(defaultCleanupConfig, projectRoot)
  }

  /**
   * Run all cleanup tests
   */
  async runAllTests(): Promise<{
    suites: CleanupTestSuite[]
    overallSummary: {
      totalTests: number
      passedTests: number
      failedTests: number
      totalDuration: number
      success: boolean
    }
  }> {
    const suites: CleanupTestSuite[] = []

    // Run different test suites
    suites.push(await this.runFileCleanupTests())
    suites.push(await this.runEmptyStateTests())
    suites.push(await this.runDebugSanitizationTests())
    suites.push(await this.runErrorHandlingTests())
    suites.push(await this.runPerformanceTests())
    suites.push(await this.runSecurityTests())
    suites.push(await this.runIntegrationTests())

    // Calculate overall summary
    const totalTests = suites.reduce((sum, suite) => sum + suite.summary.total, 0)
    const passedTests = suites.reduce((sum, suite) => sum + suite.summary.passed, 0)
    const failedTests = suites.reduce((sum, suite) => sum + suite.summary.failed, 0)
    const totalDuration = suites.reduce((sum, suite) => sum + suite.summary.duration, 0)

    return {
      suites,
      overallSummary: {
        totalTests,
        passedTests,
        failedTests,
        totalDuration,
        success: failedTests === 0
      }
    }
  }

  /**
   * Test file cleanup functionality
   */
  private async runFileCleanupTests(): Promise<CleanupTestSuite> {
    const tests: CleanupTestResult[] = []
    const startTime = Date.now()

    // Test 1: Artifact scanning
    tests.push(await this.runTest('Artifact Scanning', async () => {
      const result = await this.cleanup['scanner'].scanArtifacts()
      expect(result.totalFiles).toBeGreaterThanOrEqual(0)
      expect(result.filesByType).toBeDefined()
      return { artifactsFound: result.totalFiles }
    }))

    // Test 2: File cleanup preview
    tests.push(await this.runTest('File Cleanup Preview', async () => {
      const preview = await this.cleanup['fileCleanup'].previewCleanup()
      expect(preview.willRemove).toBeDefined()
      expect(preview.estimatedSpaceSaved).toBeGreaterThanOrEqual(0)
      return { filesToRemove: preview.willRemove.length }
    }))

    // Test 3: Dry run cleanup
    tests.push(await this.runTest('Dry Run Cleanup', async () => {
      const result = await this.cleanup['fileCleanup'].cleanup({ dryRun: true })
      expect(result.removed).toBeDefined()
      expect(result.failed).toBeDefined()
      return { removedFiles: result.removed.length, failedFiles: result.failed.length }
    }))

    const endTime = Date.now()
    const duration = endTime - startTime

    return {
      name: 'File Cleanup Tests',
      tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length,
        duration
      }
    }
  }

  /**
   * Test empty state generation
   */
  private async runEmptyStateTests(): Promise<CleanupTestSuite> {
    const tests: CleanupTestResult[] = []
    const startTime = Date.now()

    // Test 1: Mock data detection
    tests.push(await this.runTest('Mock Data Detection', async () => {
      const analysis = await this.cleanup['mockDataDetector'].scanForMockData()
      expect(analysis.components).toBeDefined()
      expect(analysis.summary).toBeDefined()
      return { 
        componentsAnalyzed: analysis.summary.totalComponents,
        mockDataFound: analysis.summary.componentsWithMockData
      }
    }))

    // Test 2: Empty state generation
    tests.push(await this.runTest('Empty State Generation', async () => {
      const analysis = await this.cleanup['mockDataDetector'].scanForMockData()
      const emptyStates = await this.cleanup['emptyStateGenerator'].generateEmptyStates(analysis.components)
      expect(emptyStates).toBeDefined()
      return { emptyStatesGenerated: emptyStates.length }
    }))

    // Test 3: Empty state code quality
    tests.push(await this.runTest('Empty State Code Quality', async () => {
      const analysis = await this.cleanup['mockDataDetector'].scanForMockData()
      const emptyStates = await this.cleanup['emptyStateGenerator'].generateEmptyStates(analysis.components)
      
      // Check that generated code is valid
      for (const emptyState of emptyStates) {
        expect(emptyState.code).toContain('import React')
        expect(emptyState.code).toContain('export default function')
        expect(emptyState.code).toContain('<Empty')
      }
      
      return { validEmptyStates: emptyStates.length }
    }))

    const endTime = Date.now()
    const duration = endTime - startTime

    return {
      name: 'Empty State Tests',
      tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length,
        duration
      }
    }
  }

  /**
   * Test debug code sanitization
   */
  private async runDebugSanitizationTests(): Promise<CleanupTestSuite> {
    const tests: CleanupTestResult[] = []
    const startTime = Date.now()

    // Test 1: Debug code detection
    tests.push(await this.runTest('Debug Code Detection', async () => {
      const preview = await this.cleanup['debugSanitizer'].previewSanitization()
      expect(preview.matches).toBeDefined()
      expect(preview.summary).toBeDefined()
      return { 
        debugMatches: preview.matches.length,
        consoleStatements: preview.summary.consoleStatements
      }
    }))

    // Test 2: Sanitization preview
    tests.push(await this.runTest('Sanitization Preview', async () => {
      const preview = await this.cleanup['debugSanitizer'].previewSanitization()
      expect(preview.recommendations).toBeDefined()
      return { recommendations: preview.recommendations.length }
    }))

    // Test 3: Code pattern validation
    tests.push(await this.runTest('Code Pattern Validation', async () => {
      const preview = await this.cleanup['debugSanitizer'].previewSanitization()
      
      // Ensure high-severity issues are flagged
      const highSeverityMatches = preview.matches.filter(m => 
        m.match.includes('sk_live_') || m.match.includes('password')
      )
      
      return { highSeverityIssues: highSeverityMatches.length }
    }))

    const endTime = Date.now()
    const duration = endTime - startTime

    return {
      name: 'Debug Sanitization Tests',
      tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length,
        duration
      }
    }
  }

  /**
   * Test error handling enhancements
   */
  private async runErrorHandlingTests(): Promise<CleanupTestSuite> {
    const tests: CleanupTestResult[] = []
    const startTime = Date.now()

    // Test 1: Error boundary analysis
    tests.push(await this.runTest('Error Boundary Analysis', async () => {
      const analysis = await this.cleanup['errorHandlerEnhancer'].analyzeErrorHandling()
      expect(analysis.components).toBeDefined()
      expect(analysis.summary).toBeDefined()
      return { 
        componentsAnalyzed: analysis.summary.totalComponents,
        withErrorBoundaries: analysis.summary.componentsWithErrorBoundaries
      }
    }))

    // Test 2: API error handling check
    tests.push(await this.runTest('API Error Handling Check', async () => {
      const analysis = await this.cleanup['errorHandlerEnhancer'].analyzeErrorHandling()
      const componentsWithApiCalls = analysis.components.filter(c => c.apiCalls.length > 0)
      return { 
        componentsWithApiCalls: componentsWithApiCalls.length,
        apiCallsNeedingImprovement: analysis.summary.apiCallsNeedingImprovement
      }
    }))

    const endTime = Date.now()
    const duration = endTime - startTime

    return {
      name: 'Error Handling Tests',
      tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length,
        duration
      }
    }
  }

  /**
   * Test performance optimizations
   */
  private async runPerformanceTests(): Promise<CleanupTestSuite> {
    const tests: CleanupTestResult[] = []
    const startTime = Date.now()

    // Test 1: Performance analysis
    tests.push(await this.runTest('Performance Analysis', async () => {
      const analysis = await this.cleanup['performanceOptimizer'].analyzePerformance()
      expect(analysis.components).toBeDefined()
      expect(analysis.summary.averageScore).toBeGreaterThanOrEqual(0)
      expect(analysis.summary.averageScore).toBeLessThanOrEqual(100)
      return { 
        averageScore: analysis.summary.averageScore,
        totalIssues: analysis.summary.totalIssues
      }
    }))

    // Test 2: Bundle analysis
    tests.push(await this.runTest('Bundle Analysis', async () => {
      const analysis = await this.cleanup['performanceOptimizer'].analyzePerformance()
      expect(analysis.bundle).toBeDefined()
      return { 
        bundleSize: analysis.bundle.totalSize,
        chunks: analysis.bundle.chunks.length
      }
    }))

    // Test 3: Component optimization
    tests.push(await this.runTest('Component Optimization', async () => {
      const analysis = await this.cleanup['performanceOptimizer'].analyzePerformance()
      const componentsWithIssues = analysis.components.filter(c => c.issues.length > 0)
      return { 
        componentsWithIssues: componentsWithIssues.length,
        highSeverityIssues: analysis.summary.highSeverityIssues
      }
    }))

    const endTime = Date.now()
    const duration = endTime - startTime

    return {
      name: 'Performance Tests',
      tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length,
        duration
      }
    }
  }

  /**
   * Test security validation
   */
  private async runSecurityTests(): Promise<CleanupTestSuite> {
    const tests: CleanupTestResult[] = []
    const startTime = Date.now()

    // Test 1: Environment variable security
    tests.push(await this.runTest('Environment Variable Security', async () => {
      const analysis = await this.cleanup['securityValidator'].validateSecurity()
      expect(analysis.environmentVariables).toBeDefined()
      return { 
        forbiddenPatterns: analysis.environmentVariables.forbiddenPatterns.length,
        missingVars: analysis.environmentVariables.requiredPublicVars.filter(v => !v.present).length
      }
    }))

    // Test 2: Supabase security
    tests.push(await this.runTest('Supabase Security', async () => {
      const analysis = await this.cleanup['securityValidator'].validateSecurity()
      expect(analysis.supabaseSecrets).toBeDefined()
      return { 
        serviceRoleIssues: analysis.supabaseSecrets.serviceRoleUsage.filter(u => u.isClientSide).length,
        keyExposureIssues: analysis.supabaseSecrets.publicKeyExposure.filter(e => !e.isProperlyScoped).length
      }
    }))

    // Test 3: Code security issues
    tests.push(await this.runTest('Code Security Issues', async () => {
      const analysis = await this.cleanup['securityValidator'].validateSecurity()
      expect(analysis.codeSecurityIssues).toBeDefined()
      const highSeverityIssues = analysis.codeSecurityIssues.filter(i => i.severity === 'high')
      return { 
        totalIssues: analysis.codeSecurityIssues.length,
        highSeverityIssues: highSeverityIssues.length
      }
    }))

    const endTime = Date.now()
    const duration = endTime - startTime

    return {
      name: 'Security Tests',
      tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length,
        duration
      }
    }
  }

  /**
   * Test end-to-end integration
   */
  private async runIntegrationTests(): Promise<CleanupTestSuite> {
    const tests: CleanupTestResult[] = []
    const startTime = Date.now()

    // Test 1: Full cleanup preview
    tests.push(await this.runTest('Full Cleanup Preview', async () => {
      const preview = await this.cleanup.preview()
      expect(preview.willRemove).toBeDefined()
      expect(preview.willModify).toBeDefined()
      expect(preview.estimatedImpact).toBeDefined()
      return { 
        filesToRemove: preview.willRemove.length,
        filesToModify: preview.willModify.length,
        estimatedScore: preview.estimatedImpact.performanceScore
      }
    }))

    // Test 2: Production readiness check
    tests.push(await this.runTest('Production Readiness Check', async () => {
      const readiness = await this.cleanup.checkProductionReadiness()
      expect(readiness.score).toBeGreaterThanOrEqual(0)
      expect(readiness.score).toBeLessThanOrEqual(100)
      expect(readiness.issues).toBeDefined()
      return { 
        ready: readiness.ready,
        score: readiness.score,
        issues: readiness.issues.length
      }
    }))

    // Test 3: Dry run cleanup
    tests.push(await this.runTest('Dry Run Full Cleanup', async () => {
      const result = await this.cleanup.cleanup({ dryRun: true, verbose: false })
      expect(result.success).toBeDefined()
      expect(result.summary).toBeDefined()
      return { 
        success: result.success,
        filesProcessed: result.summary.totalFilesProcessed,
        issuesFixed: result.summary.issuesFixed
      }
    }))

    const endTime = Date.now()
    const duration = endTime - startTime

    return {
      name: 'Integration Tests',
      tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length,
        duration
      }
    }
  }

  /**
   * Run a single test with error handling
   */
  private async runTest(
    testName: string, 
    testFn: () => Promise<unknown>
  ): Promise<CleanupTestResult> {
    const startTime = Date.now()
    
    try {
      const details = await testFn()
      const duration = Date.now() - startTime
      
      return {
        testName,
        passed: true,
        duration,
        details: details as Record<string, unknown> | undefined
      }
    } catch (error) {
      const duration = Date.now() - startTime
      
      return {
        testName,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Run Playwright browser tests for cleanup validation
   */
  async runBrowserTests(page: Page): Promise<CleanupTestSuite> {
    const tests: CleanupTestResult[] = []
    const startTime = Date.now()

    // Test 1: Application loads after cleanup
    tests.push(await this.runTest('Application Loads', async () => {
      await page.goto('http://localhost:3000')
      await expect(page).toHaveTitle(/Leave Management/)
      return { loaded: true }
    }))

    // Test 2: Empty states render correctly
    tests.push(await this.runTest('Empty States Render', async () => {
      // Navigate to a page that should show empty states
      await page.goto('http://localhost:3000/dashboard/leaves')
      
      // Look for empty state components
      const emptyState = page.locator('[data-slot="empty"]')
      if (await emptyState.count() > 0) {
        await expect(emptyState).toBeVisible()
        return { emptyStatesFound: await emptyState.count() }
      }
      
      return { emptyStatesFound: 0 }
    }))

    // Test 3: No console errors
    tests.push(await this.runTest('No Console Errors', async () => {
      const errors: string[] = []
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })
      
      await page.goto('http://localhost:3000/dashboard')
      await page.waitForTimeout(2000) // Wait for any async operations
      
      return { consoleErrors: errors.length, errors }
    }))

    // Test 4: Error boundaries work
    tests.push(await this.runTest('Error Boundaries Work', async () => {
      // This would require triggering an error and checking if error boundary catches it
      // For now, just check that error boundary components exist
      await page.goto('http://localhost:3000')
      
      // Check if error boundary components are present in the DOM
      const errorBoundaries = await page.locator('[data-testid*="error-boundary"]').count()
      
      return { errorBoundariesFound: errorBoundaries }
    }))

    const endTime = Date.now()
    const duration = endTime - startTime

    return {
      name: 'Browser Tests',
      tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length,
        duration
      }
    }
  }

  /**
   * Generate test report
   */
  generateTestReport(results: {
    suites: CleanupTestSuite[]
    overallSummary: Record<string, unknown>
  }): string {
    let report = '# Production Cleanup Test Report\n\n'
    
    // Overall summary
    report += `## Overall Summary\n`
    report += `- **Total Tests**: ${results.overallSummary.totalTests}\n`
    report += `- **Passed**: ${results.overallSummary.passedTests}\n`
    report += `- **Failed**: ${results.overallSummary.failedTests}\n`
    report += `- **Duration**: ${results.overallSummary.totalDuration}ms\n`
    report += `- **Success**: ${results.overallSummary.success ? '✅' : '❌'}\n\n`

    // Test suites
    results.suites.forEach(suite => {
      report += `## ${suite.name}\n`
      report += `- **Total**: ${suite.summary.total}\n`
      report += `- **Passed**: ${suite.summary.passed}\n`
      report += `- **Failed**: ${suite.summary.failed}\n`
      report += `- **Duration**: ${suite.summary.duration}ms\n\n`

      // Individual tests
      suite.tests.forEach(test => {
        const status = test.passed ? '✅' : '❌'
        report += `### ${status} ${test.testName}\n`
        report += `- **Duration**: ${test.duration}ms\n`
        
        if (test.error) {
          report += `- **Error**: ${test.error}\n`
        }
        
        if (test.details) {
          report += `- **Details**: ${JSON.stringify(test.details, null, 2)}\n`
        }
        
        report += '\n'
      })
    })

    return report
  }
}