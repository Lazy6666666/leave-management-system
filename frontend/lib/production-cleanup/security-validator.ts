import { readFileSync, existsSync } from "fs";
import { join, relative } from "path";
import { glob } from "glob";
import { defaultCleanupConfig, type CleanupConfig } from "./config";

export interface SecurityAnalysis {
  environmentVariables: EnvironmentAnalysis;
  supabaseSecrets: SupabaseSecurityAnalysis;
  codeSecurityIssues: CodeSecurityIssue[];
  contentSecurityPolicy: CSPAnalysis;
  summary: SecuritySummary;
}

export interface EnvironmentAnalysis {
  requiredPublicVars: VariableStatus[];
  requiredPrivateVars: VariableStatus[];
  forbiddenPatterns: ForbiddenPatternMatch[];
  recommendations: string[];
}

export interface VariableStatus {
  name: string;
  required: boolean;
  present: boolean;
  value?: string;
  secure: boolean;
}

export interface ForbiddenPatternMatch {
  file: string;
  line: number;
  pattern: string;
  match: string;
  severity: "low" | "medium" | "high";
}

export interface SupabaseSecurityAnalysis {
  rlsPolicies: RLSPolicyCheck[];
  serviceRoleUsage: ServiceRoleUsageCheck[];
  publicKeyExposure: PublicKeyExposureCheck[];
  edgeFunctionSecrets: EdgeFunctionSecretCheck[];
  recommendations: string[];
}

export interface RLSPolicyCheck {
  table: string;
  hasRLS: boolean;
  policies: string[];
  issues: string[];
}

export interface ServiceRoleUsageCheck {
  file: string;
  line: number;
  context: string;
  isClientSide: boolean;
  severity: "low" | "medium" | "high";
}

export interface PublicKeyExposureCheck {
  file: string;
  line: number;
  keyType: "anon" | "service_role" | "url";
  isProperlyScoped: boolean;
}

export interface EdgeFunctionSecretCheck {
  functionName: string;
  secrets: string[];
  missingSecrets: string[];
  recommendations: string[];
}

export interface CodeSecurityIssue {
  file: string;
  line: number;
  type:
    | "hardcoded-secret"
    | "sql-injection"
    | "xss-vulnerability"
    | "insecure-random";
  severity: "low" | "medium" | "high";
  description: string;
  suggestion: string;
}

export interface CSPAnalysis {
  hasCSP: boolean;
  directives: CSPDirective[];
  issues: string[];
  recommendations: string[];
}

export interface CSPDirective {
  name: string;
  value: string;
  secure: boolean;
}

export interface SecuritySummary {
  totalIssues: number;
  highSeverityIssues: number;
  environmentIssues: number;
  supabaseIssues: number;
  codeIssues: number;
  cspIssues: number;
  overallScore: number;
}

/**
 * Security validator for Supabase and Next.js applications
 */
export class SecurityValidator {
  private config: CleanupConfig;
  private projectRoot: string;

  constructor(
    config: CleanupConfig = defaultCleanupConfig,
    projectRoot?: string
  ) {
    this.config = config;
    this.projectRoot = projectRoot || process.cwd();
  }

  /**
   * Perform comprehensive security analysis
   */
  async validateSecurity(): Promise<SecurityAnalysis> {
    const [
      environmentVariables,
      supabaseSecrets,
      codeSecurityIssues,
      contentSecurityPolicy,
    ] = await Promise.all([
      this.analyzeEnvironmentVariables(),
      this.analyzeSupabaseSecurity(),
      this.analyzeCodeSecurity(),
      this.analyzeContentSecurityPolicy(),
    ]);

    const summary = this.generateSecuritySummary(
      environmentVariables,
      supabaseSecrets,
      codeSecurityIssues,
      contentSecurityPolicy
    );

    return {
      environmentVariables,
      supabaseSecrets,
      codeSecurityIssues,
      contentSecurityPolicy,
      summary,
    };
  }

  /**
   * Analyze environment variables
   */
  async analyzeEnvironmentVariables(): Promise<EnvironmentAnalysis> {
    const requiredPublicVars: VariableStatus[] = [];
    const requiredPrivateVars: VariableStatus[] = [];
    const forbiddenPatterns: ForbiddenPatternMatch[] = [];

    // Check required public variables
    for (const varName of this.config.security.environmentVariables
      .requiredPublicVars) {
      const value = process.env[varName];
      requiredPublicVars.push({
        name: varName,
        required: true,
        present: !!value,
        value: value ? this.maskSensitiveValue(value) : undefined,
        secure: this.isSecurePublicVar(varName, value),
      });
    }

    // Check required private variables
    for (const varName of this.config.security.environmentVariables
      .requiredPrivateVars) {
      const value = process.env[varName];
      requiredPrivateVars.push({
        name: varName,
        required: true,
        present: !!value,
        secure: this.isSecurePrivateVar(varName, value),
      });
    }

    // Scan for forbidden patterns in code
    const sourceFiles = await this.findSourceFiles();
    for (const file of sourceFiles) {
      const matches = await this.scanFileForForbiddenPatterns(file);
      forbiddenPatterns.push(...matches);
    }

    const recommendations = this.generateEnvironmentRecommendations(
      requiredPublicVars,
      requiredPrivateVars,
      forbiddenPatterns
    );

    return {
      requiredPublicVars,
      requiredPrivateVars,
      forbiddenPatterns,
      recommendations,
    };
  }

  /**
   * Analyze Supabase security
   */
  async analyzeSupabaseSecurity(): Promise<SupabaseSecurityAnalysis> {
    const [
      rlsPolicies,
      serviceRoleUsage,
      publicKeyExposure,
      edgeFunctionSecrets,
    ] = await Promise.all([
      this.checkRLSPolicies(),
      this.checkServiceRoleUsage(),
      this.checkPublicKeyExposure(),
      this.checkEdgeFunctionSecrets(),
    ]);

    const recommendations = this.generateSupabaseRecommendations(
      rlsPolicies,
      serviceRoleUsage,
      publicKeyExposure,
      edgeFunctionSecrets
    );

    return {
      rlsPolicies,
      serviceRoleUsage,
      publicKeyExposure,
      edgeFunctionSecrets,
      recommendations,
    };
  }

  /**
   * Analyze code security issues
   */
  async analyzeCodeSecurity(): Promise<CodeSecurityIssue[]> {
    const sourceFiles = await this.findSourceFiles();
    const issues: CodeSecurityIssue[] = [];

    for (const file of sourceFiles) {
      try {
        const fileIssues = await this.scanFileForSecurityIssues(file);
        issues.push(...fileIssues);
      } catch (error) {
        console.warn(
          `Warning: Failed to scan ${file} for security issues:`,
          error
        );
      }
    }

    return issues;
  }

  /**
   * Analyze Content Security Policy
   */
  async analyzeContentSecurityPolicy(): Promise<CSPAnalysis> {
    const nextConfigPath = join(this.projectRoot, "next.config.js");
    let hasCSP = false;
    const directives: CSPDirective[] = [];
    const issues: string[] = [];

    if (existsSync(nextConfigPath)) {
      try {
        const content = readFileSync(nextConfigPath, "utf-8");
        hasCSP = content.includes("Content-Security-Policy");

        if (hasCSP) {
          // Parse CSP directives (simplified)
          const cspMatch = content.match(
            /Content-Security-Policy['"]\s*,\s*value:\s*['"]([^'"]+)['"]/i
          );
          if (cspMatch && cspMatch[1]) {
            const cspValue = cspMatch[1];
            const directivePairs = cspValue.split(";").map((d) => d.trim());

            directivePairs.forEach((pair) => {
              const [name, ...valueParts] = pair.split(" ");
              if (name) {
                const value = valueParts.join(" ");
                directives.push({
                  name: name.trim(),
                  value: value.trim(),
                  secure: this.isSecureCSPDirective(name.trim(), value.trim()),
                });
              }
            });
          }
        } else {
          issues.push("No Content Security Policy found in next.config.js");
        }
      } catch (error) {
        issues.push(`Failed to analyze next.config.js: ${error}`);
      }
    } else {
      issues.push("next.config.js not found");
    }

    const recommendations = this.generateCSPRecommendations(
      hasCSP,
      directives,
      issues
    );

    return {
      hasCSP,
      directives,
      issues,
      recommendations,
    };
  }

  /**
   * Check RLS policies
   */
  private async checkRLSPolicies(): Promise<RLSPolicyCheck[]> {
    // This would typically connect to Supabase to check actual policies
    // For now, we'll simulate based on common patterns
    const commonTables = [
      "profiles",
      "leave_requests",
      "teams",
      "notifications",
    ];
    const policies: RLSPolicyCheck[] = [];

    commonTables.forEach((table) => {
      policies.push({
        table,
        hasRLS: true, // Would be checked via Supabase API
        policies: [`${table}_policy`], // Would be actual policy names
        issues: [], // Would contain actual issues
      });
    });

    return policies;
  }

  /**
   * Check service role usage
   */
  private async checkServiceRoleUsage(): Promise<ServiceRoleUsageCheck[]> {
    const sourceFiles = await this.findSourceFiles();
    const usage: ServiceRoleUsageCheck[] = [];

    for (const file of sourceFiles) {
      try {
        const content = readFileSync(file, "utf-8");
        const lines = content.split("\n");

        lines.forEach((line, index) => {
          if (
            line.includes("SUPABASE_SERVICE_ROLE_KEY") ||
            line.includes("service_role")
          ) {
            const isClientSide = this.isClientSideFile(file);
            usage.push({
              file: relative(this.projectRoot, file),
              line: index + 1,
              context: line.trim(),
              isClientSide,
              severity: isClientSide ? "high" : "low",
            });
          }
        });
      } catch (error) {
        console.warn(
          `Warning: Failed to check service role usage in ${file}:`,
          error
        );
      }
    }

    return usage;
  }

  /**
   * Check public key exposure
   */
  private async checkPublicKeyExposure(): Promise<PublicKeyExposureCheck[]> {
    const sourceFiles = await this.findSourceFiles();
    const exposure: PublicKeyExposureCheck[] = [];

    for (const file of sourceFiles) {
      try {
        const content = readFileSync(file, "utf-8");
        const lines = content.split("\n");

        lines.forEach((line, index) => {
          // Check for anon key usage
          if (line.includes("SUPABASE_ANON_KEY")) {
            exposure.push({
              file: relative(this.projectRoot, file),
              line: index + 1,
              keyType: "anon",
              isProperlyScoped: line.includes("process.env.NEXT_PUBLIC_"),
            });
          }

          // Check for URL exposure
          if (line.includes("SUPABASE_URL")) {
            exposure.push({
              file: relative(this.projectRoot, file),
              line: index + 1,
              keyType: "url",
              isProperlyScoped: line.includes("process.env.NEXT_PUBLIC_"),
            });
          }
        });
      } catch (error) {
        console.warn(
          `Warning: Failed to check key exposure in ${file}:`,
          error
        );
      }
    }

    return exposure;
  }

  /**
   * Check Edge Function secrets
   */
  private async checkEdgeFunctionSecrets(): Promise<EdgeFunctionSecretCheck[]> {
    const functionsDir = join(
      this.projectRoot,
      "../backend/supabase/functions"
    );
    const checks: EdgeFunctionSecretCheck[] = [];

    if (!existsSync(functionsDir)) {
      return checks;
    }

    try {
      const functionDirs = await glob("*/", { cwd: functionsDir });

      for (const dir of functionDirs) {
        const functionName = dir.replace("/", "");
        const indexPath = join(functionsDir, dir, "index.ts");

        if (existsSync(indexPath)) {
          const content = readFileSync(indexPath, "utf-8");
          const secrets = this.extractSecretsFromFunction(content);
          const missingSecrets = secrets.filter(
            (secret) => !process.env[secret]
          );

          checks.push({
            functionName,
            secrets,
            missingSecrets,
            recommendations: this.generateFunctionSecretRecommendations(
              functionName,
              missingSecrets
            ),
          });
        }
      }
    } catch (error) {
      console.warn("Warning: Failed to check Edge Function secrets:", error);
    }

    return checks;
  }

  /**
   * Scan file for forbidden patterns
   */
  private async scanFileForForbiddenPatterns(
    filePath: string
  ): Promise<ForbiddenPatternMatch[]> {
    const matches: ForbiddenPatternMatch[] = [];

    if (!existsSync(filePath)) {
      return matches;
    }

    try {
      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      const relativePath = relative(this.projectRoot, filePath);

      for (const pattern of this.config.security.environmentVariables
        .forbiddenPatterns) {
        const regex = new RegExp(pattern, "gi");

        lines.forEach((line, index) => {
          let match;
          while ((match = regex.exec(line)) !== null) {
            matches.push({
              file: relativePath,
              line: index + 1,
              pattern,
              match: match[0],
              severity: this.getForbiddenPatternSeverity(pattern, match[0]),
            });
          }
        });
      }
    } catch (error) {
      console.warn(
        `Warning: Failed to scan ${filePath} for forbidden patterns:`,
        error
      );
    }

    return matches;
  }

  /**
   * Scan file for security issues
   */
  private async scanFileForSecurityIssues(
    filePath: string
  ): Promise<CodeSecurityIssue[]> {
    const issues: CodeSecurityIssue[] = [];

    if (!existsSync(filePath)) {
      return issues;
    }

    try {
      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      const relativePath = relative(this.projectRoot, filePath);

      lines.forEach((line, index) => {
        // Check for hardcoded secrets
        if (/sk_live_|sk_test_|password\s*=\s*['"][^'"]+['"]/.test(line)) {
          issues.push({
            file: relativePath,
            line: index + 1,
            type: "hardcoded-secret",
            severity: "high",
            description: "Hardcoded secret detected",
            suggestion: "Move secret to environment variable",
          });
        }

        // Check for potential SQL injection
        if (/\$\{.*\}.*SELECT|SELECT.*\$\{.*\}/.test(line)) {
          issues.push({
            file: relativePath,
            line: index + 1,
            type: "sql-injection",
            severity: "high",
            description: "Potential SQL injection vulnerability",
            suggestion: "Use parameterized queries or prepared statements",
          });
        }

        // Check for XSS vulnerabilities
        if (/dangerouslySetInnerHTML|innerHTML\s*=/.test(line)) {
          issues.push({
            file: relativePath,
            line: index + 1,
            type: "xss-vulnerability",
            severity: "medium",
            description: "Potential XSS vulnerability",
            suggestion: "Sanitize user input before rendering",
          });
        }

        // Check for insecure random
        if (/Math\.random\(\)/.test(line)) {
          issues.push({
            file: relativePath,
            line: index + 1,
            type: "insecure-random",
            severity: "low",
            description: "Insecure random number generation",
            suggestion:
              "Use crypto.getRandomValues() for security-sensitive operations",
          });
        }
      });
    } catch (error) {
      console.warn(
        `Warning: Failed to scan ${filePath} for security issues:`,
        error
      );
    }

    return issues;
  }

  /**
   * Helper methods
   */
  private maskSensitiveValue(value: string): string {
    if (value.length <= 8) {
      return "*".repeat(value.length);
    }
    return (
      value.substring(0, 4) +
      "*".repeat(value.length - 8) +
      value.substring(value.length - 4)
    );
  }

  private isSecurePublicVar(name: string, value?: string): boolean {
    if (!value) return false;

    // Public vars should start with NEXT_PUBLIC_
    if (!name.startsWith("NEXT_PUBLIC_")) return false;

    // Should not contain sensitive patterns
    const sensitivePatterns = ["secret", "key", "password", "token"];
    return !sensitivePatterns.some(
      (pattern) =>
        name.toLowerCase().includes(pattern) ||
        value.toLowerCase().includes(pattern)
    );
  }

  private isSecurePrivateVar(name: string, value?: string): boolean {
    if (!value) return false;

    // Private vars should NOT start with NEXT_PUBLIC_
    if (name.startsWith("NEXT_PUBLIC_")) return false;

    // Should have sufficient length for secrets
    return value.length >= 32;
  }

  private isClientSideFile(filePath: string): boolean {
    const clientSidePatterns = [
      "/components/",
      "/pages/",
      "/app/",
      "/hooks/",
      "/utils/",
    ];

    return clientSidePatterns.some((pattern) => filePath.includes(pattern));
  }

  private getForbiddenPatternSeverity(
    pattern: string,
    match: string
  ): "low" | "medium" | "high" {
    if (pattern.includes("sk_live_") || match.includes("password")) {
      return "high";
    }
    if (pattern.includes("secret") || pattern.includes("key")) {
      return "medium";
    }
    return "low";
  }

  private isSecureCSPDirective(name: string, value: string): boolean {
    const secureDirectives = {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https:"],
      "connect-src": ["'self'"],
      "font-src": ["'self'"],
      "object-src": ["'none'"],
      "media-src": ["'self'"],
      "frame-src": ["'none'"],
    };

    const allowedValues =
      secureDirectives[name as keyof typeof secureDirectives];
    if (!allowedValues) return true;

    return allowedValues.some((allowed) => value.includes(allowed));
  }

  private extractSecretsFromFunction(content: string): string[] {
    const secrets: string[] = [];
    const secretPattern = /Deno\.env\.get\(['"]([^'"]+)['"]\)/g;
    let match;

    while ((match = secretPattern.exec(content)) !== null) {
      if (match[1]) {
        secrets.push(match[1]);
      }
    }

    return secrets;
  }

  private generateEnvironmentRecommendations(
    publicVars: VariableStatus[],
    privateVars: VariableStatus[],
    forbiddenPatterns: ForbiddenPatternMatch[]
  ): string[] {
    const recommendations: string[] = [];

    const missingPublic = publicVars.filter((v) => !v.present);
    if (missingPublic.length > 0) {
      recommendations.push(
        `Set missing public variables: ${missingPublic.map((v) => v.name).join(", ")}`
      );
    }

    const missingPrivate = privateVars.filter((v) => !v.present);
    if (missingPrivate.length > 0) {
      recommendations.push(
        `Set missing private variables: ${missingPrivate.map((v) => v.name).join(", ")}`
      );
    }

    const highSeverityPatterns = forbiddenPatterns.filter(
      (p) => p.severity === "high"
    );
    if (highSeverityPatterns.length > 0) {
      recommendations.push(
        `⚠️  Remove ${highSeverityPatterns.length} hardcoded secrets from code`
      );
    }

    return recommendations;
  }

  private generateSupabaseRecommendations(
    rlsPolicies: RLSPolicyCheck[],
    serviceRoleUsage: ServiceRoleUsageCheck[],
    publicKeyExposure: PublicKeyExposureCheck[],
    edgeFunctionSecrets: EdgeFunctionSecretCheck[]
  ): string[] {
    const recommendations: string[] = [];

    const clientSideServiceRole = serviceRoleUsage.filter(
      (u) => u.isClientSide
    );
    if (clientSideServiceRole.length > 0) {
      recommendations.push(
        `⚠️  Remove service role key from ${clientSideServiceRole.length} client-side files`
      );
    }

    const improperKeyExposure = publicKeyExposure.filter(
      (e) => !e.isProperlyScoped
    );
    if (improperKeyExposure.length > 0) {
      recommendations.push(
        `Fix ${improperKeyExposure.length} improperly scoped Supabase keys`
      );
    }

    const functionsWithMissingSecrets = edgeFunctionSecrets.filter(
      (f) => f.missingSecrets.length > 0
    );
    if (functionsWithMissingSecrets.length > 0) {
      recommendations.push(
        `Set missing secrets for ${functionsWithMissingSecrets.length} Edge Functions`
      );
    }

    return recommendations;
  }

  private generateCSPRecommendations(
    hasCSP: boolean,
    directives: CSPDirective[],
    issues: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (!hasCSP) {
      recommendations.push(
        "Implement Content Security Policy in next.config.js"
      );
    }

    const insecureDirectives = directives.filter((d) => !d.secure);
    if (insecureDirectives.length > 0) {
      recommendations.push(
        `Secure ${insecureDirectives.length} CSP directives`
      );
    }

    if (issues.length > 0) {
      recommendations.push(...issues);
    }

    return recommendations;
  }

  private generateFunctionSecretRecommendations(
    functionName: string,
    missingSecrets: string[]
  ): string[] {
    if (missingSecrets.length === 0) {
      return [`✅ All secrets configured for ${functionName}`];
    }

    return [
      `Set missing secrets for ${functionName}: ${missingSecrets.join(", ")}`,
      `Run: supabase secrets set ${missingSecrets.map((s) => `${s}=<value>`).join(" ")}`,
    ];
  }

  private generateSecuritySummary(
    env: EnvironmentAnalysis,
    supabase: SupabaseSecurityAnalysis,
    code: CodeSecurityIssue[],
    csp: CSPAnalysis
  ): SecuritySummary {
    const environmentIssues =
      env.forbiddenPatterns.length +
      env.requiredPublicVars.filter((v) => !v.present).length +
      env.requiredPrivateVars.filter((v) => !v.present).length;

    const supabaseIssues =
      supabase.serviceRoleUsage.filter((u) => u.isClientSide).length +
      supabase.publicKeyExposure.filter((e) => !e.isProperlyScoped).length +
      supabase.edgeFunctionSecrets.reduce(
        (sum, f) => sum + f.missingSecrets.length,
        0
      );

    const codeIssues = code.length;
    const cspIssues = csp.issues.length;

    const totalIssues =
      environmentIssues + supabaseIssues + codeIssues + cspIssues;
    const highSeverityIssues =
      env.forbiddenPatterns.filter((p) => p.severity === "high").length +
      supabase.serviceRoleUsage.filter((u) => u.severity === "high").length +
      code.filter((i) => i.severity === "high").length;

    const overallScore = Math.max(
      0,
      100 - totalIssues * 5 - highSeverityIssues * 10
    );

    return {
      totalIssues,
      highSeverityIssues,
      environmentIssues,
      supabaseIssues,
      codeIssues,
      cspIssues,
      overallScore,
    };
  }

  private async findSourceFiles(): Promise<string[]> {
    try {
      const patterns = [
        "**/*.{ts,tsx,js,jsx}",
        "!node_modules/**",
        "!.next/**",
        "!**/*.test.*",
        "!**/*.spec.*",
      ];

      return await glob(patterns, {
        cwd: this.projectRoot,
        absolute: true,
      });
    } catch (error) {
      console.warn("Warning: Failed to find source files:", error);
      return [];
    }
  }
}
