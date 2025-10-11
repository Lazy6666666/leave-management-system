#!/usr/bin/env tsx
/**
 * Comprehensive Test Execution Script
 *
 * Runs all test suites and generates consolidated report
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

interface TestResult {
  suite: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  coverage?: {
    lines: number
    functions: number
    branches: number
    statements: number
  }
  errors?: string[]
}

const results: TestResult[] = []

function runCommand(command: string, suite: string): TestResult {
  const startTime = Date.now()
  const result: TestResult = {
    suite,
    status: 'passed',
    duration: 0,
    errors: [],
  }

  try {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Running ${suite}...`)
    console.log(`${'='.repeat(60)}\n`)

    execSync(command, { stdio: 'inherit' })
    result.status = 'passed'
  } catch (error) {
    console.error(`\n❌ ${suite} failed`)
    result.status = 'failed'
    result.errors?.push(error instanceof Error ? error.message : String(error))
  } finally {
    result.duration = Date.now() - startTime
  }

  return result
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║   Leave Management System - Comprehensive Test Suite        ║
║   Target Coverage: ≥95%                                      ║
╚══════════════════════════════════════════════════════════════╝
`)

  // 1. Unit Tests with Coverage
  console.log('\n📦 Phase 1: Unit Tests')
  const unitTestResult = runCommand('npm run test:run -- --coverage', 'Unit Tests')
  results.push(unitTestResult)

  // Read coverage from coverage-summary.json if available
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json')
  if (fs.existsSync(coveragePath)) {
    try {
      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
      const total = coverageData.total

      unitTestResult.coverage = {
        lines: total.lines.pct,
        functions: total.functions.pct,
        branches: total.branches.pct,
        statements: total.statements.pct,
      }
    } catch (error) {
      console.error('Failed to read coverage data:', error)
    }
  }

  // 2. Integration Tests
  console.log('\n🔗 Phase 2: Integration Tests')
  const integrationResult = runCommand(
    'npm run test:integration',
    'Integration Tests'
  )
  results.push(integrationResult)

  // 3. E2E Tests
  console.log('\n🎭 Phase 3: E2E Tests')
  const e2eResult = runCommand('npm run test:e2e', 'E2E Tests')
  results.push(e2eResult)

  // 4. Accessibility Tests
  console.log('\n♿ Phase 4: Accessibility Tests')
  const a11yResult = runCommand('npm run test:a11y:all', 'Accessibility Tests')
  results.push(a11yResult)

  // Generate Report
  console.log('\n\n' + '='.repeat(60))
  console.log('TEST EXECUTION SUMMARY')
  console.log('='.repeat(60) + '\n')

  let totalDuration = 0
  let passedCount = 0
  let failedCount = 0

  results.forEach((result) => {
    const statusIcon = result.status === 'passed' ? '✅' : '❌'
    const duration = (result.duration / 1000).toFixed(2)

    console.log(`${statusIcon} ${result.suite}`)
    console.log(`   Duration: ${duration}s`)

    if (result.coverage) {
      console.log('   Coverage:')
      console.log(`      Lines: ${result.coverage.lines.toFixed(2)}%`)
      console.log(`      Functions: ${result.coverage.functions.toFixed(2)}%`)
      console.log(`      Branches: ${result.coverage.branches.toFixed(2)}%`)
      console.log(`      Statements: ${result.coverage.statements.toFixed(2)}%`)
    }

    if (result.errors && result.errors.length > 0) {
      console.log('   Errors:')
      result.errors.forEach((error) => {
        console.log(`      - ${error}`)
      })
    }

    console.log()

    totalDuration += result.duration
    if (result.status === 'passed') passedCount++
    else failedCount++
  })

  console.log('='.repeat(60))
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`)
  console.log(`Passed: ${passedCount}/${results.length}`)
  console.log(`Failed: ${failedCount}/${results.length}`)
  console.log('='.repeat(60) + '\n')

  // Coverage Assessment
  const unitCoverage = results.find((r) => r.suite === 'Unit Tests')?.coverage
  if (unitCoverage) {
    const meetsThreshold =
      unitCoverage.lines >= 95 &&
      unitCoverage.functions >= 95 &&
      unitCoverage.statements >= 95 &&
      unitCoverage.branches >= 90

    if (meetsThreshold) {
      console.log('✅ Coverage thresholds met!')
    } else {
      console.log('⚠️  Coverage below thresholds:')
      if (unitCoverage.lines < 95) console.log(`   Lines: ${unitCoverage.lines}% (target: 95%)`)
      if (unitCoverage.functions < 95)
        console.log(`   Functions: ${unitCoverage.functions}% (target: 95%)`)
      if (unitCoverage.statements < 95)
        console.log(`   Statements: ${unitCoverage.statements}% (target: 95%)`)
      if (unitCoverage.branches < 90)
        console.log(`   Branches: ${unitCoverage.branches}% (target: 90%)`)
    }
  }

  // Write detailed report
  const reportPath = path.join(process.cwd(), 'test-report.json')
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        results,
        summary: {
          total: results.length,
          passed: passedCount,
          failed: failedCount,
          totalDuration: totalDuration / 1000,
        },
      },
      null,
      2
    )
  )

  console.log(`\n📄 Detailed report saved to: ${reportPath}`)
  console.log(`📊 HTML coverage report: ${path.join(process.cwd(), 'coverage', 'index.html')}`)
  console.log(`🎭 Playwright report: Run 'npm run test:visual:report' to view\n`)

  // Exit with error code if any tests failed
  if (failedCount > 0) {
    console.error('\n❌ Some tests failed!')
    process.exit(1)
  }

  console.log('\n✅ All tests passed!\n')
  process.exit(0)
}

main().catch((error) => {
  console.error('Fatal error running tests:', error)
  process.exit(1)
})
