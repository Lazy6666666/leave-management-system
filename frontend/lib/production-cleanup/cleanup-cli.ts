#!/usr/bin/env node

import { NextJSCleaner } from './nextjs-cleaner'
import { ArtifactScanner } from './artifact-scanner'

/**
 * CLI tool for Next.js production cleanup
 * Usage: npx tsx frontend/lib/production-cleanup/cleanup-cli.ts [--dry-run] [--report]
 */
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const reportOnly = args.includes('--report')
  
  console.log('🧹 Next.js Production Cleanup Tool')
  console.log('==================================')
  
  try {
    const cleaner = new NextJSCleaner()
    const scanner = new ArtifactScanner()
    
    if (reportOnly) {
      console.log('\n📊 Generating cleanup report...\n')
      
      // Check what artifacts exist
      const artifacts = await cleaner.checkArtifacts()
      
      console.log('Build Directories:')
      artifacts.buildDirs.forEach(dir => {
        const status = dir.exists ? '✅ EXISTS' : '❌ NOT FOUND'
        const size = dir.size ? ` (${cleaner.formatBytes(dir.size)})` : ''
        console.log(`  ${dir.path}: ${status}${size}`)
      })
      
      console.log(`\nDevelopment Files: ${artifacts.devFiles} files`)
      console.log(`Temporary Files: ${artifacts.tempFiles} files`)
      
      // Generate full report
      const report = await scanner.generateCleanupReport()
      console.log('\n📋 Full Cleanup Report:')
      console.log(`Total files to remove: ${report.nextjsCleanup.removed.length}`)
      console.log(`Total size to free: ${cleaner.formatBytes(report.nextjsCleanup.totalSize)}`)
      console.log('\nBreakdown:')
      console.log(`  Build directories: ${report.nextjsCleanup.summary.buildDirectories}`)
      console.log(`  Test files: ${report.nextjsCleanup.summary.testFiles}`)
      console.log(`  Story files: ${report.nextjsCleanup.summary.storyFiles}`)
      console.log(`  Temporary files: ${report.nextjsCleanup.summary.tempFiles}`)
      console.log(`  Log files: ${report.nextjsCleanup.summary.logFiles}`)
      
      if (report.nextjsCleanup.errors.length > 0) {
        console.log('\n⚠️  Potential Issues:')
        report.nextjsCleanup.errors.forEach((error: { file: string; error: string }) => {
          console.log(`  ${error.file}: ${error.error}`)
        })
      }
      
    } else {
      const mode = dryRun ? 'DRY RUN' : 'LIVE CLEANUP'
      console.log(`\n🚀 Starting ${mode}...\n`)
      
      const result = await cleaner.cleanup(dryRun)
      
      if (dryRun) {
        console.log('📋 Files that would be removed:')
      } else {
        console.log('✅ Files removed:')
      }
      
      if (result.removed.length === 0) {
        console.log('  No files found to clean up!')
      } else {
        result.removed.forEach(file => {
          console.log(`  ${file}`)
        })
      }
      
      console.log(`\n📊 Summary:`)
      console.log(`  Total files: ${result.removed.length}`)
      console.log(`  Total size freed: ${cleaner.formatBytes(result.totalSize)}`)
      console.log(`  Build directories: ${result.summary.buildDirectories}`)
      console.log(`  Test files: ${result.summary.testFiles}`)
      console.log(`  Story files: ${result.summary.storyFiles}`)
      console.log(`  Temporary files: ${result.summary.tempFiles}`)
      console.log(`  Log files: ${result.summary.logFiles}`)
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors encountered:')
        result.errors.forEach(error => {
          console.log(`  ${error.file}: ${error.error}`)
        })
      }
      
      if (dryRun) {
        console.log('\n💡 Run without --dry-run to actually remove these files')
      } else {
        console.log('\n✨ Cleanup completed successfully!')
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { main as runCleanup }