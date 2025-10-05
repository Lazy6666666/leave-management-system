#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface TSConfig {
  compilerOptions?: {
    strict?: boolean
    noImplicitAny?: boolean
    strictNullChecks?: boolean
    strictFunctionTypes?: boolean
    strictBindCallApply?: boolean
    strictPropertyInitialization?: boolean
    noImplicitReturns?: boolean
    noFallthroughCasesInSwitch?: boolean
    noUncheckedIndexedAccess?: boolean
  }
}

/**
 * Validates TypeScript strict mode configuration and runs type checking
 */
function validateTypeScriptStrict(): void {
  console.log('🔍 Validating TypeScript strict mode configuration...')

  // Check if tsconfig.json exists
  const tsconfigPath = join(process.cwd(), 'tsconfig.json')
  if (!existsSync(tsconfigPath)) {
    console.error('❌ tsconfig.json not found')
    process.exit(1)
  }

  // Read and parse tsconfig.json
  let tsconfig: TSConfig
  try {
    const tsconfigContent = readFileSync(tsconfigPath, 'utf-8')
    tsconfig = JSON.parse(tsconfigContent)
  } catch (error) {
    console.error('❌ Failed to parse tsconfig.json:', error)
    process.exit(1)
  }

  // Validate strict mode settings
  const compilerOptions = tsconfig.compilerOptions || {}
  const strictModeChecks = [
    { key: 'strict', required: true, description: 'Enable all strict type checking options' },
    { key: 'noImplicitAny', required: true, description: 'Raise error on expressions with implied any type' },
    { key: 'strictNullChecks', required: true, description: 'Enable strict null checks' },
    { key: 'strictFunctionTypes', required: true, description: 'Enable strict checking of function types' },
    { key: 'strictBindCallApply', required: true, description: 'Enable strict bind, call, and apply methods' },
    { key: 'noImplicitReturns', required: true, description: 'Report error when not all code paths return a value' },
    { key: 'noFallthroughCasesInSwitch', required: true, description: 'Report errors for fallthrough cases in switch' },
  ]

  let hasErrors = false

  strictModeChecks.forEach(({ key, required, description }) => {
    const value = compilerOptions[key as keyof typeof compilerOptions]
    if (required && value !== true) {
      console.error(`❌ ${key}: ${description} (currently: ${value})`)
      hasErrors = true
    } else if (value === true) {
      console.log(`✅ ${key}: ${description}`)
    }
  })

  if (hasErrors) {
    console.error('\n❌ TypeScript strict mode validation failed')
    console.error('Please update your tsconfig.json to enable all required strict mode options')
    process.exit(1)
  }

  console.log('\n✅ TypeScript strict mode configuration is valid')

  // Run type checking
  console.log('\n🔍 Running TypeScript type checking...')
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' })
    console.log('✅ TypeScript type checking passed')
  } catch (error) {
    console.error('❌ TypeScript type checking failed')
    process.exit(1)
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateTypeScriptStrict()
}

export { validateTypeScriptStrict }