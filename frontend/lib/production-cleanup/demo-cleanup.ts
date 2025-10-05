#!/usr/bin/env node

import { NextJSCleaner } from './nextjs-cleaner'
import { ArtifactScanner } from './artifact-scanner'

/**
 * Demo script to show Next.js cleanup functionality
 * This demonstrates the cleanup patterns without actually removing files
 */
async function demonstrateCleanup() {
  console.log('🧹 Next.js Production Cleanup Demo')
  console.log('===================================\n')

  try {
    const cleaner = new NextJSCleaner()
    const scanner = new ArtifactScanner()

    // 1. Check what artifacts currently exist
    console.log('📊 Checking current artifacts...\n')
    const artifacts = await cleaner.checkArtifacts()

    console.log('Build Directories Status:')
    artifacts.buildDirs.forEach(dir => {
      const status = dir.exists ? '✅ EXISTS' : '❌ NOT FOUND'
      const size = dir.size ? ` (${cleaner.formatBytes(dir.size)})` : ''
      console.log(`  ${dir.path}: ${status}${size}`)
    })

    console.log(`\nDevelopment Files Found: ${artifacts.devFiles}`)
    console.log(`Temporary Files Found: ${artifacts.tempFiles}`)

    // 2. Generate cleanup report (dry run)
    console.log('\n📋 Generating cleanup report (dry run)...\n')
    const report = await cleaner.generateReport()

    console.log('Files that would be removed:')
    if (report.removed.length === 0) {
      console.log('  ✨ No files found to clean up!')
    } else {
      report.removed.slice(0, 10).forEach(file => {
        console.log(`  📄 ${file}`)
      })
      if (report.removed.length > 10) {
        console.log(`  ... and ${report.removed.length - 10} more files`)
      }
    }

    console.log('\n📊 Cleanup Summary:')
    console.log(`  Total files: ${report.removed.length}`)
    console.log(`  Total size: ${cleaner.formatBytes(report.totalSize)}`)
    console.log(`  Build directories: ${report.summary.buildDirectories}`)
    console.log(`  Test files: ${report.summary.testFiles}`)
    console.log(`  Story files: ${report.summary.storyFiles}`)
    console.log(`  Temporary files: ${report.summary.tempFiles}`)
    console.log(`  Log files: ${report.summary.logFiles}`)

    if (report.errors.length > 0) {
      console.log('\n⚠️  Potential Issues:')
      report.errors.forEach(error => {
        console.log(`  ${error.file}: ${error.error}`)
      })
    }

    // 3. Show comprehensive scan results
    console.log('\n🔍 Comprehensive artifact scan...\n')
    const scanReport = await scanner.generateCleanupReport()

    console.log('Additional cleanup recommendations:')
    scanReport.summary.recommendations.forEach(rec => {
      console.log(`  💡 ${rec}`)
    })

    console.log('\n✅ Demo completed successfully!')
    console.log('\n💡 To actually perform cleanup, use:')
    console.log('   npx tsx frontend/lib/production-cleanup/cleanup-cli.ts --dry-run')
    console.log('   npx tsx frontend/lib/production-cleanup/cleanup-cli.ts')

  } catch (error) {
    console.error('\n❌ Error during demo:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  demonstrateCleanup()
}

export { demonstrateCleanup }