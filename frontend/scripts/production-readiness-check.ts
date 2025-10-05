#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync, existsSync, statSync } from 'fs'
import { join, resolve } from 'path'
import { glob } from 'glob'

interface CheckResult {
  name: string
  passed: boolean
  message: string
  details?: string[]
}

/**
 * Production readiness validation script
 */
class ProductionReadinessChecker {
  private results: CheckResult[] = []
  private projectRoot: string

  constructor() {
    this.projectRoot = process.cwd()
  }

  /**
   * Add a check result
   */
  private addResult(name: string, passed: boolean, message: string, details?: string[]): void {
    this.results.push({ name, passed, message, details })
  }

  /**
   * Check if TypeScript strict mode is enabled
   */
  private checkTypeScriptStrict(): void {
    try {
      const tsconfigPath = join(this.projectRoot, 'tsconfig.json')
      if (!existsSync(tsconfigPath)) {
        this.addResult('TypeScript Config', false, 'tsconfig.json not found')
        return
      }

      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
      const compilerOptions = tsconfig.compilerOptions || {}

      const requiredOptions = ['strict', 'noImplicitAny', 'strictNullChecks']
      const missingOptions = requiredOptions.filter(option => !compilerOptions[option])

      if (missingOptions.length > 0) {
        this.addResult(
          'TypeScript Strict Mode',
          false,
          'Missing strict mode options',
          missingOptions.map(opt => `${opt} is not enabled`)
        )
      } else {
        this.addResult('TypeScript Strict Mode', true, 'All strict mode options enabled')
      }
    } catch (error) {
      this.addResult('TypeScript Config', false, `Failed to parse tsconfig.json: ${error}`)
    }
  }

  /**
   * Check for development artifacts
   */
  private async checkDevelopmentArtifacts(): Promise<void> {
    const artifactPatterns = [
      '**/*_SUMMARY.md',
      '**/*_GUIDE.md',
      '**/CONV.txt',
      '**/GEMINI.md',
      '**/PRODUCTION_*.md',
      '**/QUESTION.txt',
      '**/*.log',
      '**/.temp/**',
    ]

    const foundArtifacts: string[] = []

    for (const pattern of artifactPatterns) {
      try {
        const files = await glob(pattern, { 
          cwd: this.projectRoot,
          ignore: ['node_modules/**', '.git/**', '.next/**']
        })
        foundArtifacts.push(...files)
      } catch (error) {
        // Ignore glob errors
      }
    }

    if (foundArtifacts.length > 0) {
      this.addResult(
        'Development Artifacts',
        false,
        `Found ${foundArtifacts.length} development artifacts`,
        foundArtifacts.slice(0, 10) // Show first 10
      )
    } else {
      this.addResult('Development Artifacts', true, 'No development artifacts found')
    }
  }

  /**
   * Check for console statements in production code
   */
  private async checkConsoleStatements(): Promise<void> {
    const sourceFiles = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: this.projectRoot,
      ignore: [
        'node_modules/**',
        '.next/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/__tests__/**',
        '**/scripts/**',
      ]
    })

    const filesWithConsole: string[] = []

    for (const file of sourceFiles) {
      try {
        const content = readFileSync(join(this.projectRoot, file), 'utf-8')
        if (/console\.(log|warn|error|debug|info)\s*\(/.test(content)) {
          filesWithConsole.push(file)
        }
      } catch (error) {
        // Ignore read errors
      }
    }

    if (filesWithConsole.length > 0) {
      this.addResult(
        'Console Statements',
        false,
        `Found console statements in ${filesWithConsole.length} files`,
        filesWithConsole.slice(0, 10)
      )
    } else {
      this.addResult('Console Statements', true, 'No console statements found in production code')
    }
  }

  /**
   * Check environment variable configuration
   */
  private checkEnvironmentVariables(): void {
    const requiredPublicVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_APP_URL',
    ]

    const requiredPrivateVars = [
      'SUPABASE_SERVICE_ROLE_KEY',
    ]

    const missingPublic = requiredPublicVars.filter(varName => !process.env[varName])
    const missingPrivate = requiredPrivateVars.filter(varName => !process.env[varName])

    const allMissing = [...missingPublic, ...missingPrivate]

    if (allMissing.length > 0) {
      this.addResult(
        'Environment Variables',
        false,
        `Missing ${allMissing.length} required environment variables`,
        allMissing
      )
    } else {
      this.addResult('Environment Variables', true, 'All required environment variables are set')
    }
  }

  /**
   * Check bundle size (if analyze script exists)
   */
  private checkBundleSize(): void {
    try {
      const packageJsonPath = join(this.projectRoot, 'package.json')
      if (!existsSync(packageJsonPath)) {
        this.addResult('Bundle Analysis', false, 'package.json not found')
        return
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      const hasAnalyzeScript = packageJson.scripts && packageJson.scripts.analyze

      if (hasAnalyzeScript) {
        this.addResult('Bundle Analysis', true, 'Bundle analyzer is configured')
      } else {
        this.addResult('Bundle Analysis', false, 'Bundle analyzer script not found')
      }
    } catch (error) {
      this.addResult('Bundle Analysis', false, `Failed to check bundle configuration: ${error}`)
    }
  }

  /**
   * Check for proper error boundaries
   */
  private async checkErrorBoundaries(): Promise<void> {
    const errorBoundaryFiles = await glob('**/error-boundary.{ts,tsx,js,jsx}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', '.next/**']
    })

    if (errorBoundaryFiles.length > 0) {
      this.addResult('Error Boundaries', true, `Found ${errorBoundaryFiles.length} error boundary files`)
    } else {
      this.addResult('Error Boundaries', false, 'No error boundary files found')
    }
  }

  /**
   * Run all production readiness checks
   */
  async runAllChecks(): Promise<void> {
    console.log('🚀 Running production readiness checks...\n')

    this.checkTypeScriptStrict()
    await this.checkDevelopmentArtifacts()
    await this.checkConsoleStatements()
    this.checkEnvironmentVariables()
    this.checkBundleSize()
    await this.checkErrorBoundaries()
  }

  /**
   * Print results and exit with appropriate code
   */
  printResults(): void {
    const passed = this.results.filter(r => r.passed)
    const failed = this.results.filter(r => !r.passed)

    console.log('\n📊 Production Readiness Results:')
    console.log('================================\n')

    // Print passed checks
    if (passed.length > 0) {
      console.log('✅ Passed Checks:')
      passed.forEach(result => {
        console.log(`  ✅ ${result.name}: ${result.message}`)
      })
      console.log('')
    }

    // Print failed checks
    if (failed.length > 0) {
      console.log('❌ Failed Checks:')
      failed.forEach(result => {
        console.log(`  ❌ ${result.name}: ${result.message}`)
        if (result.details && result.details.length > 0) {
          result.details.forEach(detail => {
            console.log(`     - ${detail}`)
          })
        }
      })
      console.log('')
    }

    // Summary
    console.log(`📈 Summary: ${passed.length}/${this.results.length} checks passed`)

    if (failed.length > 0) {
      console.log('\n❌ Production readiness check failed')
      console.log('Please address the failed checks before deploying to production')
      process.exit(1)
    } else {
      console.log('\n🎉 All production readiness checks passed!')
      console.log('Your application is ready for production deployment')
    }
  }
}

// Run checks if this script is executed directly
async function main(): Promise<void> {
  const checker = new ProductionReadinessChecker()
  await checker.runAllChecks()
  checker.printResults()
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Production readiness check failed:', error)
    process.exit(1)
  })
}

export { ProductionReadinessChecker }