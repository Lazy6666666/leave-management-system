/**
 * Credential Scanning and Removal Engine
 * Detects hardcoded API keys, passwords, and tokens in source files
 * Validates environment variable usage and NEXT_PUBLIC_ prefix compliance
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { defaultCleanupConfig, type CleanupConfig } from './config'

export interface CredentialMatch {
  file: string
  line: number
  column: number
  type: 'api_key' | 'password' | 'secret' | 'token' | 'url' | 'env_var'
  pattern: string
  match: string
  context: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  shouldRemove: boolean
  replacement?: string
}

export interface EnvironmentVariable {
  name: string
  value?: string
  isPublic: boolean
  isRequired: boolean
  isPresent: boolean
  isSecure: boolean
  file?: string
  line?: number
}

export interface CredentialScanResult {
  file: string
  originalContent: string
  cleanedContent: string
  credentials: CredentialMatch[]
  environmentVars: EnvironmentVariable[]
  hasChanges: boolean
  securityScore: number
}

/**
 * Credential scanning and removal engine
 */
export class CredentialScanner {
  private config: CleanupConfig

  constructor(config: CleanupConfig = defaultCleanupConfig) {
    this.config = config
  }

  /**
   * Scan file for credentials and security issues
   */
  async scanFile(filePath: string): Promise<CredentialScanResult> {
    const originalContent = readFileSync(filePath, 'utf-8')
    const result = this.scanContent(originalContent, filePath)
    
    return {
      file: filePath,
      originalContent,
      cleanedContent: result.content,
      credentials: result.credentials,
      environmentVars: result.environmentVars,
      hasChanges: result.hasChanges,
      securityScore: this.calculateSecurityScore(result.credentials)
    }
  }

  /**
   * Scan content for credentials
   */
  scanContent(content: string, filePath: string = ''): {
    content: string
    credentials: CredentialMatch[]
    environmentVars: EnvironmentVariable[]
    hasChanges: boolean
  } {
    const lines = content.split('\n')
    const credentials: CredentialMatch[] = []
    const environmentVars: EnvironmentVariable[] = []
    let hasChanges = false

    // Process each line
    const cleanedLines = lines.map((line, lineIndex) => {
      // Find credentials
      const lineCredentials = this.findCredentials(line, lineIndex + 1, filePath)
      credentials.push(...lineCredentials)

      // Find environment variables
      const lineEnvVars = this.findEnvironmentVariables(line, lineIndex + 1, filePath)
      environmentVars.push(...lineEnvVars)

      // Remove credentials that should be removed
      let cleanedLine = line
      for (const credential of lineCredentials) {
        if (credential.shouldRemove) {
          cleanedLine = this.removeCredential(cleanedLine, credential)
          hasChanges = true
        }
      }

      return cleanedLine
    })

    return {
      content: cleanedLines.join('\n'),
      credentials,
      environmentVars,
      hasChanges
    }
  }

  /**
   * Find credentials in a line
   */
  private findCredentials(line: string, lineNumber: number, filePath: string): CredentialMatch[] {
    const credentials: CredentialMatch[] = []

    // Credential patterns with their types and severity
    const patterns = [
      // API Keys
      { 
        type: 'api_key' as const, 
        pattern: /sk_live_[a-zA-Z0-9]{24,}/g, 
        severity: 'critical' as const,
        description: 'Stripe Live Secret Key'
      },
      { 
        type: 'api_key' as const, 
        pattern: /sk_test_[a-zA-Z0-9]{24,}/g, 
        severity: 'high' as const,
        description: 'Stripe Test Secret Key'
      },
      { 
        type: 'api_key' as const, 
        pattern: /pk_live_[a-zA-Z0-9]{24,}/g, 
        severity: 'medium' as const,
        description: 'Stripe Live Publishable Key'
      },
      { 
        type: 'api_key' as const, 
        pattern: /pk_test_[a-zA-Z0-9]{24,}/g, 
        severity: 'low' as const,
        description: 'Stripe Test Publishable Key'
      },

      // Generic secrets
      { 
        type: 'secret' as const, 
        pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/gi, 
        severity: 'critical' as const,
        description: 'Hardcoded Password'
      },
      { 
        type: 'secret' as const, 
        pattern: /secret\s*[:=]\s*['"][^'"]{16,}['"]/gi, 
        severity: 'critical' as const,
        description: 'Hardcoded Secret'
      },
      { 
        type: 'secret' as const, 
        pattern: /key\s*[:=]\s*['"][^'"]{16,}['"]/gi, 
        severity: 'high' as const,
        description: 'Hardcoded Key'
      },
      { 
        type: 'token' as const, 
        pattern: /token\s*[:=]\s*['"][^'"]{20,}['"]/gi, 
        severity: 'high' as const,
        description: 'Hardcoded Token'
      },

      // Supabase specific
      { 
        type: 'api_key' as const, 
        pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, 
        severity: 'critical' as const,
        description: 'JWT Token'
      },

      // Database URLs
      { 
        type: 'url' as const, 
        pattern: /postgresql:\/\/[^'">\s]+/gi, 
        severity: 'critical' as const,
        description: 'Database URL'
      },
      { 
        type: 'url' as const, 
        pattern: /mysql:\/\/[^'">\s]+/gi, 
        severity: 'critical' as const,
        description: 'Database URL'
      },
    ]

    for (const { type, pattern, severity, description } of patterns) {
      let match
      while ((match = pattern.exec(line)) !== null) {
        const matchText = match[0]
        const column = match.index + 1
        const shouldRemove = this.shouldRemoveCredential(matchText, line, type)

        credentials.push({
          file: filePath,
          line: lineNumber,
          column,
          type,
          pattern: description,
          match: matchText,
          context: line.trim(),
          severity,
          shouldRemove,
          replacement: shouldRemove ? this.generateReplacement(type, matchText) : undefined
        })
      }
    }

    return credentials
  }

  /**
   * Find environment variables in a line
   */
  private findEnvironmentVariables(line: string, lineNumber: number, filePath: string): EnvironmentVariable[] {
    const envVars: EnvironmentVariable[] = []

    // Environment variable patterns
    const patterns = [
      /process\.env\.([A-Z_][A-Z0-9_]*)/g,
      /import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g,
      /env\.([A-Z_][A-Z0-9_]*)/g,
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(line)) !== null) {
        const varName = match[1]
        if (!varName) continue
        
        const isPublic = varName.startsWith('NEXT_PUBLIC_')
        const isRequired = this.isRequiredEnvironmentVariable(varName)

        envVars.push({
          name: varName,
          isPublic,
          isRequired,
          isPresent: this.checkEnvironmentVariablePresence(varName),
          isSecure: this.validateEnvironmentVariableSecurity(varName, isPublic),
          file: filePath,
          line: lineNumber
        })
      }
    }

    return envVars
  }

  /**
   * Check if credential should be removed
   */
  private shouldRemoveCredential(match: string, line: string, type: string): boolean {
    // Always remove hardcoded credentials
    if (['password', 'secret', 'token'].includes(type)) {
      return true
    }

    // Remove API keys that are clearly hardcoded
    if (type === 'api_key') {
      // Don't remove if it's in a comment or example
      if (line.includes('//') || line.includes('/*') || line.includes('example')) {
        return false
      }
      return true
    }

    // Remove database URLs that contain credentials
    if (type === 'url' && (match.includes('@') || match.includes(':'))) {
      return true
    }

    return false
  }

  /**
   * Generate replacement for removed credential
   */
  private generateReplacement(type: string, match: string): string {
    switch (type) {
      case 'password':
        return 'process.env.PASSWORD'
      case 'secret':
        return 'process.env.SECRET_KEY'
      case 'token':
        return 'process.env.API_TOKEN'
      case 'api_key':
        if (match.includes('pk_')) {
          return 'process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
        }
        return 'process.env.STRIPE_SECRET_KEY'
      case 'url':
        return 'process.env.DATABASE_URL'
      default:
        return 'process.env.CREDENTIAL'
    }
  }

  /**
   * Remove credential from line
   */
  private removeCredential(line: string, credential: CredentialMatch): string {
    if (!credential.replacement) {
      return line
    }

    return line.replace(credential.match, credential.replacement)
  }

  /**
   * Check if environment variable is required
   */
  private isRequiredEnvironmentVariable(varName: string): boolean {
    const requiredPublic = this.config.security.environmentVariables.requiredPublicVars
    const requiredPrivate = this.config.security.environmentVariables.requiredPrivateVars
    
    return requiredPublic.includes(varName) || requiredPrivate.includes(varName)
  }

  /**
   * Check if environment variable is present
   */
  private checkEnvironmentVariablePresence(varName: string): boolean {
    // Check if variable is defined in environment files
    const envFiles = ['.env', '.env.local', '.env.example']
    
    for (const envFile of envFiles) {
      if (existsSync(envFile)) {
        const content = readFileSync(envFile, 'utf-8')
        if (content.includes(`${varName}=`)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Validate environment variable security
   */
  private validateEnvironmentVariableSecurity(varName: string, isPublic: boolean): boolean {
    // Public variables should start with NEXT_PUBLIC_
    if (isPublic && !varName.startsWith('NEXT_PUBLIC_')) {
      return false
    }

    // Private variables should not start with NEXT_PUBLIC_
    if (!isPublic && varName.startsWith('NEXT_PUBLIC_')) {
      return false
    }

    // Check against forbidden patterns
    const forbiddenPatterns = this.config.security.environmentVariables.forbiddenPatterns
    for (const pattern of forbiddenPatterns) {
      if (new RegExp(pattern).test(varName)) {
        return false
      }
    }

    return true
  }

  /**
   * Calculate security score based on found credentials
   */
  private calculateSecurityScore(credentials: CredentialMatch[]): number {
    if (credentials.length === 0) {
      return 100
    }

    let score = 100
    for (const credential of credentials) {
      switch (credential.severity) {
        case 'critical':
          score -= 25
          break
        case 'high':
          score -= 15
          break
        case 'medium':
          score -= 10
          break
        case 'low':
          score -= 5
          break
      }
    }

    return Math.max(0, score)
  }

  /**
   * Validate NEXT_PUBLIC_ prefix compliance
   */
  validateNextPublicCompliance(environmentVars: EnvironmentVariable[]): {
    compliant: EnvironmentVariable[]
    violations: EnvironmentVariable[]
    recommendations: string[]
  } {
    const compliant: EnvironmentVariable[] = []
    const violations: EnvironmentVariable[] = []
    const recommendations: string[] = []

    for (const envVar of environmentVars) {
      if (envVar.isSecure) {
        compliant.push(envVar)
      } else {
        violations.push(envVar)
        
        if (envVar.isPublic && !envVar.name.startsWith('NEXT_PUBLIC_')) {
          recommendations.push(`Add NEXT_PUBLIC_ prefix to ${envVar.name}`)
        } else if (!envVar.isPublic && envVar.name.startsWith('NEXT_PUBLIC_')) {
          recommendations.push(`Remove NEXT_PUBLIC_ prefix from ${envVar.name} (contains sensitive data)`)
        }
      }
    }

    return { compliant, violations, recommendations }
  }

  /**
   * Audit Edge Function secret usage
   */
  async auditEdgeFunctionSecrets(functionsDir: string = 'backend/supabase/functions'): Promise<{
    functions: Array<{
      name: string
      file: string
      secrets: string[]
      issues: string[]
    }>
    recommendations: string[]
  }> {
    const functions: Array<{ name: string, file: string, secrets: string[], issues: string[] }> = []
    const recommendations: string[] = []

    // This would scan Edge Function files for secret usage
    // Implementation would traverse the functions directory
    
    return { functions, recommendations }
  }

  /**
   * Generate comprehensive security report
   */
  generateSecurityReport(results: CredentialScanResult[]): {
    totalFiles: number
    filesWithIssues: number
    totalCredentials: number
    criticalIssues: number
    averageSecurityScore: number
    recommendations: string[]
    summary: string
  } {
    const totalFiles = results.length
    const filesWithIssues = results.filter(r => r.credentials.length > 0).length
    const totalCredentials = results.reduce((sum, r) => sum + r.credentials.length, 0)
    const criticalIssues = results.reduce((sum, r) => 
      sum + r.credentials.filter(c => c.severity === 'critical').length, 0
    )
    const averageSecurityScore = results.reduce((sum, r) => sum + r.securityScore, 0) / totalFiles

    const recommendations: string[] = []
    
    if (criticalIssues > 0) {
      recommendations.push(`Remove ${criticalIssues} critical security issues immediately`)
    }
    
    if (averageSecurityScore < 80) {
      recommendations.push('Improve overall security score by addressing credential issues')
    }

    recommendations.push('Use environment variables for all sensitive configuration')
    recommendations.push('Ensure NEXT_PUBLIC_ prefix compliance for client-side variables')

    const summary = `Security Scan Report:
- Files scanned: ${totalFiles}
- Files with issues: ${filesWithIssues}
- Total credentials found: ${totalCredentials}
- Critical issues: ${criticalIssues}
- Average security score: ${averageSecurityScore.toFixed(1)}/100`

    return {
      totalFiles,
      filesWithIssues,
      totalCredentials,
      criticalIssues,
      averageSecurityScore,
      recommendations,
      summary
    }
  }

  /**
   * Apply credential cleanup to files
   */
  async applyCleanup(results: CredentialScanResult[]): Promise<{
    success: string[]
    errors: Array<{ file: string, error: string }>
  }> {
    const success: string[] = []
    const errors: Array<{ file: string, error: string }> = []

    for (const result of results) {
      if (!result.hasChanges) {
        continue
      }

      try {
        writeFileSync(result.file, result.cleanedContent, 'utf-8')
        success.push(result.file)
      } catch (error) {
        errors.push({
          file: result.file,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return { success, errors }
  }
}

// Types are already exported above