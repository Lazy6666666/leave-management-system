#!/usr/bin/env node

import { FileCleanup, type CleanupResult } from '../lib/production-cleanup/file-cleanup'
import { defaultCleanupConfig } from '../lib/production-cleanup/config'

interface CLIOptions {
  dryRun: boolean
  verbose: boolean
  type?: string
  nextjs: boolean
  stats: boolean
  help: boolean
}

/**
 * Parse command line arguments
 */
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2)
  const options: CLIOptions = {
    dryRun: false,
    verbose: false,
    nextjs: false,
    stats: false,
    help: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--dry-run':
      case '-d':
        options.dryRun = true
        break
      case '--verbose':
      case '-v':
        options.verbose = true
        break
      case '--type':
      case '-t':
        options.type = args[++i]
        break
      case '--nextjs':
      case '-n':
        options.nextjs = true
        break
      case '--stats':
      case '-s':
        options.stats = true
        break
      case '--help':
      case '-h':
        options.help = true
        break
    }
  }

  return options
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
🧹 File Cleanup Tool

Usage: npm run cleanup [options]

Options:
  -d, --dry-run     Show what would be cleaned without actually removing files
  -v, --verbose     Show detailed output
  -t, --type <type> Clean specific file type (documentation, test, build, temp, development)
  -n, --nextjs      Clean Next.js specific artifacts
  -s, --stats       Show cleanup statistics
  -h, --help        Show this help message

Examples:
  npm run cleanup --dry-run          # Preview cleanup
  npm run cleanup --type test        # Clean only test files
  npm run cleanup --nextjs           # Clean Next.js artifacts
  npm run cleanup --stats            # Show statistics
`)
}

/**
 * Main cleanup function
 */
async function main() {
  const options = parseArgs()

  if (options.help) {
    showHelp()
    return
  }

  try {
    console.log('🧹 Starting file cleanup...\n')
    
    const cleanup = new FileCleanup(defaultCleanupConfig)

    if (options.stats) {
      console.log('📊 Calculating cleanup statistics...\n')
      const result: CleanupResult = await cleanup.cleanup({ dryRun: true })
      
      console.log(`📈 Cleanup Statistics:`)
      console.log(`  Files to remove: ${result.removed.length}`)
      console.log(`  Files to preserve: ${result.preserved.length}`)
      console.log(`  Potential savings: ${formatBytes(result.summary.spaceSaved)}\n`)
      
      return
    }

    // Use the available cleanup method
    const result: CleanupResult = await cleanup.cleanup({
      dryRun: options.dryRun,
      force: !options.dryRun
    })

    // Show results
    console.log(`\n📋 Cleanup Results:`)
    console.log(`  Files removed: ${result.removed.length}`)
    console.log(`  Files preserved: ${result.preserved.length}`)
    console.log(`  Space ${options.dryRun ? 'would be freed' : 'freed'}: ${formatBytes(result.summary.spaceSaved)}`)
    
    if (result.failed.length > 0) {
      console.log(`\n❌ Errors (${result.failed.length}):`)
      result.failed.forEach((error: any) => {
        console.log(`  - ${error.file}: ${error.error}`)
      })
    }

    console.log(`\n📝 Summary:`)
    console.log(`  Cleanup completed successfully`)

    if (result.failed.length > 0) {
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  }
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Run the script
if (require.main === module) {
  main().catch(console.error)
}