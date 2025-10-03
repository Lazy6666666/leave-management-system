#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Simple unused imports checker for JavaScript/TypeScript
class UnusedImportChecker {
  constructor() {
    this.excludePatterns = [
      /node_modules/,
      /\.next/,
      /\.git/,
      /scripts/,
      /\.d\.ts$/,
    ]

    this.includePatterns = [
      /\.tsx?$/,
      /\.jsx?$/,
    ]
  }

  getAllFiles(dir) {
    const files = []
    
    const scan = (currentDir) => {
      const items = fs.readdirSync(currentDir)
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          if (!this.excludePatterns.some(pattern => pattern.test(fullPath))) {
            scan(fullPath)
          }
        } else {
          if (this.includePatterns.some(pattern => pattern.test(fullPath)) &&
              !this.excludePatterns.some(pattern => pattern.test(fullPath))) {
            files.push(fullPath)
          }
        }
      }
    }
    
    scan(dir)
    return files
  }

  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')
      
      const imports = []
      const unusedImports = []
      
      // Extract imports using regex
      lines.forEach((line, index) => {
        const importMatch = line.match(/^import\s+(?:type\s+)?(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/)
        
        if (importMatch) {
          const isTypeOnly = line.includes('import type')
          const moduleName = importMatch[4]
          
          if (importMatch[1]) {
            // Named imports: { a, b, c }
            const namedImports = importMatch[1].split(',').map(s => s.trim().split(' as ')[0].trim())
            namedImports.forEach(importName => {
              imports.push({
                line: index + 1,
                importName,
                moduleName,
                isTypeOnly,
                fullLine: line
              })
            })
          } else if (importMatch[2]) {
            // Namespace import: * as Something
            imports.push({
              line: index + 1,
              importName: importMatch[2],
              moduleName,
              isTypeOnly,
              fullLine: line
            })
          } else if (importMatch[3]) {
            // Default import
            imports.push({
              line: index + 1,
              importName: importMatch[3],
              moduleName,
              isTypeOnly,
              fullLine: line
            })
          }
        }
      })

      // Check which imports are used
      imports.forEach(imp => {
        const isUsed = this.isImportUsed(imp.importName, content, imp.line)
        if (!isUsed) {
          unusedImports.push(imp)
        }
      })

      return {
        file: filePath,
        imports,
        unusedImports,
        issues: this.findIssues(content, imports)
      }
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error.message)
      return null
    }
  }

  isImportUsed(importName, content, importLine) {
    // Remove the import line itself from content to avoid false positives
    const lines = content.split('\n')
    lines[importLine - 1] = ''
    const contentWithoutImport = lines.join('\n')

    // Check for various usage patterns
    const patterns = [
      new RegExp(`\\b${importName}\\b`, 'g'),  // Basic identifier usage
      new RegExp(`<${importName}[\\s>]`, 'g'), // JSX usage
      new RegExp(`${importName}\\.`, 'g'),     // Property access
      new RegExp(`:\\s*${importName}[\\s<>\\[\\],;]`, 'g'), // Type annotation
      new RegExp(`extends\\s+${importName}`, 'g'), // Class/interface extension
      new RegExp(`implements\\s+${importName}`, 'g'), // Interface implementation
    ]

    return patterns.some(pattern => pattern.test(contentWithoutImport))
  }

  findIssues(content, imports) {
    const issues = []

    // Check for React import in files without JSX
    const hasReactImport = imports.some(imp => imp.moduleName === 'react' && imp.importName === 'React')
    const hasJSX = /<[A-Z]/.test(content)
    
    if (hasReactImport && !hasJSX && !content.includes('React.')) {
      issues.push('React import may be unnecessary (no JSX found)')
    }

    // Check for duplicate module imports
    const moduleGroups = {}
    imports.forEach(imp => {
      if (!moduleGroups[imp.moduleName]) {
        moduleGroups[imp.moduleName] = []
      }
      moduleGroups[imp.moduleName].push(imp)
    })

    Object.entries(moduleGroups).forEach(([moduleName, impList]) => {
      if (impList.length > 1) {
        issues.push(`Multiple imports from '${moduleName}' - consider consolidating`)
      }
    })

    // Check for side-effect only imports that might be needed
    const sideEffectImports = content.match(/^import\s+['"][^'"]+['"]$/gm)
    if (sideEffectImports) {
      issues.push(`Side-effect imports found - verify they are needed: ${sideEffectImports.length}`)
    }

    return issues
  }

  analyzeProject(rootDir) {
    const files = this.getAllFiles(rootDir)
    console.log(`🔍 Found ${files.length} files to analyze...`)

    const results = []
    let totalUnused = 0

    files.forEach(file => {
      const analysis = this.analyzeFile(file)
      if (analysis) {
        results.push(analysis)
        totalUnused += analysis.unusedImports.length
      }
    })

    return { results, totalUnused, totalFiles: files.length }
  }

  generateReport({ results, totalUnused, totalFiles }) {
    let report = '\n=== UNUSED IMPORTS ANALYSIS ===\n\n'
    
    const filesWithUnused = results.filter(r => r.unusedImports.length > 0).length
    
    report += `📊 Summary:\n`
    report += `   • Total files analyzed: ${totalFiles}\n`
    report += `   • Files with unused imports: ${filesWithUnused}\n`
    report += `   • Total unused imports: ${totalUnused}\n\n`

    if (totalUnused === 0) {
      report += '✅ No unused imports found!\n'
    } else {
      report += '📋 Files with unused imports:\n\n'

      results.forEach(result => {
        if (result.unusedImports.length > 0 || result.issues.length > 0) {
          const relativePath = path.relative(process.cwd(), result.file)
          report += `📁 ${relativePath}\n`
          
          if (result.unusedImports.length > 0) {
            report += `   🚫 Unused imports (${result.unusedImports.length}):\n`
            result.unusedImports.forEach(unused => {
              const typeIndicator = unused.isTypeOnly ? ' (type-only)' : ''
              report += `      Line ${unused.line}: '${unused.importName}' from '${unused.moduleName}'${typeIndicator}\n`
            })
          }

          if (result.issues.length > 0) {
            report += `   ⚠️  Issues:\n`
            result.issues.forEach(issue => {
              report += `      ${issue}\n`
            })
          }
          
          report += '\n'
        }
      })
    }

    report += '\n💡 Next steps:\n'
    report += '   1. Review the unused imports above\n'
    report += '   2. Remove them manually or use your IDE\n'
    report += '   3. Run TypeScript compilation to verify\n'
    report += '   4. Consider adding ESLint rules to prevent this\n'

    return report
  }
}

// Main execution
function main() {
  const checker = new UnusedImportChecker()
  const projectRoot = process.argv[2] || '.'
  
  console.log(`🔍 Analyzing unused imports in: ${path.resolve(projectRoot)}`)
  
  const analysis = checker.analyzeProject(projectRoot)
  const report = checker.generateReport(analysis)
  
  console.log(report)
  
  // Save report to file
  fs.writeFileSync('unused-imports-report.txt', report)
  console.log('\n📄 Report saved to: unused-imports-report.txt')
}

if (require.main === module) {
  main()
}

module.exports = { UnusedImportChecker }