import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, relative, dirname } from 'path'
import { glob } from 'glob'
import { execSync } from 'child_process'
import { defaultCleanupConfig, type CleanupConfig } from './config'

export interface PerformanceAnalysis {
  file: string
  issues: PerformanceIssue[]
  recommendations: string[]
  score: number
}

export interface PerformanceIssue {
  type: 'bundle-size' | 'code-splitting' | 'image-optimization' | 'font-loading' | 'server-component'
  severity: 'low' | 'medium' | 'high'
  description: string
  line?: number
  suggestion: string
}

export interface BundleAnalysis {
  totalSize: number
  chunks: ChunkInfo[]
  recommendations: string[]
}

export interface ChunkInfo {
  name: string
  size: number
  modules: string[]
  isLarge: boolean
}

export interface OptimizationResult {
  file: string
  optimizations: Optimization[]
  newCode: string
  estimatedSavings: number
}

export interface Optimization {
  type: string
  description: string
  before: string
  after: string
}

/**
 * Performance optimizer for Next.js applications
 */
export class PerformanceOptimizer {
  private config: CleanupConfig
  private projectRoot: string

  constructor(config: CleanupConfig = defaultCleanupConfig, projectRoot?: string) {
    this.config = config
    this.projectRoot = projectRoot || process.cwd()
  }

  /**
   * Analyze application performance
   */
  async analyzePerformance(): Promise<{
    components: PerformanceAnalysis[]
    bundle: BundleAnalysis
    summary: {
      totalIssues: number
      highSeverityIssues: number
      averageScore: number
      recommendations: string[]
    }
  }> {
    const [components, bundle] = await Promise.all([
      this.analyzeComponents(),
      this.analyzeBundleSize()
    ])

    const totalIssues = components.reduce((sum, c) => sum + c.issues.length, 0)
    const highSeverityIssues = components.reduce(
      (sum, c) => sum + c.issues.filter(i => i.severity === 'high').length, 
      0
    )
    const averageScore = components.length > 0 
      ? components.reduce((sum, c) => sum + c.score, 0) / components.length 
      : 100

    const recommendations = this.generateGlobalRecommendations(components, bundle)

    return {
      components,
      bundle,
      summary: {
        totalIssues,
        highSeverityIssues,
        averageScore,
        recommendations
      }
    }
  }

  /**
   * Analyze components for performance issues
   */
  async analyzeComponents(): Promise<PerformanceAnalysis[]> {
    const componentFiles = await this.findComponentFiles()
    const analyses: PerformanceAnalysis[] = []

    for (const file of componentFiles) {
      try {
        const analysis = await this.analyzeComponent(file)
        if (analysis) {
          analyses.push(analysis)
        }
      } catch (error) {
        console.warn(`Warning: Failed to analyze ${file}:`, error)
      }
    }

    return analyses
  }

  /**
   * Analyze a specific component
   */
  async analyzeComponent(filePath: string): Promise<PerformanceAnalysis | null> {
    if (!existsSync(filePath)) {
      return null
    }

    const content = readFileSync(filePath, 'utf-8')
    const relativePath = relative(this.projectRoot, filePath)
    const issues: PerformanceIssue[] = []

    // Check for server/client component boundaries
    issues.push(...this.checkServerClientBoundaries(content))

    // Check for code splitting opportunities
    issues.push(...this.checkCodeSplitting(content))

    // Check for image optimization
    issues.push(...this.checkImageOptimization(content))

    // Check for font optimization
    issues.push(...this.checkFontOptimization(content))

    // Check for bundle size issues
    issues.push(...this.checkBundleIssues(content))

    const recommendations = this.generateComponentRecommendations(issues)
    const score = this.calculatePerformanceScore(issues)

    return {
      file: relativePath,
      issues,
      recommendations,
      score
    }
  }

  /**
   * Optimize components for performance
   */
  async optimizeComponents(analyses: PerformanceAnalysis[]): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = []

    for (const analysis of analyses) {
      if (analysis.issues.length > 0) {
        const result = await this.optimizeComponent(analysis)
        if (result) {
          results.push(result)
        }
      }
    }

    return results
  }

  /**
   * Optimize a specific component
   */
  private async optimizeComponent(analysis: PerformanceAnalysis): Promise<OptimizationResult | null> {
    const filePath = join(this.projectRoot, analysis.file)
    if (!existsSync(filePath)) {
      return null
    }

    const content = readFileSync(filePath, 'utf-8')
    const optimizations: Optimization[] = []
    let newContent = content
    let estimatedSavings = 0

    // Apply optimizations based on issues
    for (const issue of analysis.issues) {
      const optimization = this.applyOptimization(newContent, issue)
      if (optimization) {
        optimizations.push(optimization)
        newContent = optimization.after
        estimatedSavings += this.estimateSavings(issue)
      }
    }

    if (optimizations.length === 0) {
      return null
    }

    return {
      file: analysis.file,
      optimizations,
      newCode: newContent,
      estimatedSavings
    }
  }

  /**
   * Analyze bundle size
   */
  async analyzeBundleSize(): Promise<BundleAnalysis> {
    try {
      // Run Next.js build with bundle analyzer
      const buildOutput = execSync('npm run analyze', { 
        cwd: this.projectRoot,
        encoding: 'utf-8',
        timeout: 120000 // 2 minutes timeout
      })

      // Parse build output for bundle information
      const chunks = this.parseBuildOutput(buildOutput)
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
      const recommendations = this.generateBundleRecommendations(chunks)

      return {
        totalSize,
        chunks,
        recommendations
      }
    } catch (error) {
      console.warn('Warning: Failed to analyze bundle size:', error)
      return {
        totalSize: 0,
        chunks: [],
        recommendations: ['Unable to analyze bundle size - ensure build process works correctly']
      }
    }
  }

  /**
   * Check server/client component boundaries
   */
  private checkServerClientBoundaries(content: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = []

    // Check for unnecessary 'use client' directives
    if (content.includes("'use client'") || content.includes('"use client"')) {
      const hasClientOnlyFeatures = this.hasClientOnlyFeatures(content)
      
      if (!hasClientOnlyFeatures) {
        issues.push({
          type: 'server-component',
          severity: 'medium',
          description: 'Component uses "use client" but may not need client-side features',
          suggestion: 'Consider removing "use client" directive to make this a Server Component'
        })
      }
    }

    // Check for server components that should be client components
    if (!content.includes('use client') && this.shouldBeClientComponent(content)) {
      issues.push({
        type: 'server-component',
        severity: 'low',
        description: 'Component uses client-side features but is not marked as client component',
        suggestion: 'Add "use client" directive at the top of the file'
      })
    }

    return issues
  }

  /**
   * Check for code splitting opportunities
   */
  private checkCodeSplitting(content: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = []

    // Check for large imports that could be dynamically loaded
    const heavyImports = [
      'recharts',
      'react-pdf',
      'monaco-editor',
      '@monaco-editor',
      'react-ace',
      'codemirror',
    ]

    heavyImports.forEach(lib => {
      if (content.includes(`from '${lib}'`) || content.includes(`from "${lib}"`)) {
        issues.push({
          type: 'code-splitting',
          severity: 'medium',
          description: `Heavy library "${lib}" is imported statically`,
          suggestion: `Consider dynamic import: const ${lib.replace(/[^a-zA-Z]/g, '')} = dynamic(() => import('${lib}'))`
        })
      }
    })

    // Check for missing dynamic imports for conditional components
    if (content.includes('Modal') && !content.includes('dynamic')) {
      issues.push({
        type: 'code-splitting',
        severity: 'low',
        description: 'Modal component could be dynamically loaded',
        suggestion: 'Consider using dynamic import for modal components that are conditionally rendered'
      })
    }

    return issues
  }

  /**
   * Check for image optimization issues
   */
  private checkImageOptimization(content: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = []

    // Check for regular img tags instead of Next.js Image
    const imgTagRegex = /<img\s+[^>]*src=/g
    const imgMatches = content.match(imgTagRegex)
    
    if (imgMatches) {
      issues.push({
        type: 'image-optimization',
        severity: 'high',
        description: `Found ${imgMatches.length} <img> tag(s) that should use Next.js Image component`,
        suggestion: 'Replace <img> tags with Next.js Image component for automatic optimization'
      })
    }

    // Check for missing Image import when img tags are present
    if (imgMatches && !content.includes('from "next/image"')) {
      issues.push({
        type: 'image-optimization',
        severity: 'medium',
        description: 'Missing Next.js Image import',
        suggestion: 'Import Image from "next/image" and replace img tags'
      })
    }

    return issues
  }

  /**
   * Check for font optimization issues
   */
  private checkFontOptimization(content: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = []

    // Check for Google Fonts loaded via link tags or CSS imports
    if (content.includes('fonts.googleapis.com') || content.includes('@import url')) {
      issues.push({
        type: 'font-loading',
        severity: 'medium',
        description: 'Fonts loaded via external links instead of next/font',
        suggestion: 'Use next/font for automatic font optimization and better performance'
      })
    }

    // Check for missing font optimization
    if (content.includes('font-family') && !content.includes('next/font')) {
      issues.push({
        type: 'font-loading',
        severity: 'low',
        description: 'Custom fonts detected without next/font optimization',
        suggestion: 'Consider using next/font for font optimization'
      })
    }

    return issues
  }

  /**
   * Check for bundle size issues
   */
  private checkBundleIssues(content: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = []

    // Check for large libraries
    const largeLibraries = [
      'lodash',
      'moment',
      'rxjs',
      'three',
      'babylonjs',
    ]

    largeLibraries.forEach(lib => {
      if (content.includes(`'${lib}'`) || content.includes(`"${lib}"`)) {
        issues.push({
          type: 'bundle-size',
          severity: 'medium',
          description: `Large library "${lib}" detected`,
          suggestion: `Consider alternatives or tree-shaking for ${lib}`
        })
      }
    })

    // Check for entire lodash imports
    if (content.includes("import _ from 'lodash'")) {
      issues.push({
        type: 'bundle-size',
        severity: 'high',
        description: 'Entire lodash library imported',
        suggestion: 'Import specific lodash functions instead: import { debounce } from "lodash"'
      })
    }

    return issues
  }

  /**
   * Check if component has client-only features
   */
  private hasClientOnlyFeatures(content: string): boolean {
    const clientFeatures = [
      'useState',
      'useEffect',
      'useCallback',
      'useMemo',
      'useRef',
      'onClick',
      'onChange',
      'onSubmit',
      'addEventListener',
      'window.',
      'document.',
      'localStorage',
      'sessionStorage',
    ]

    return clientFeatures.some(feature => content.includes(feature))
  }

  /**
   * Check if component should be a client component
   */
  private shouldBeClientComponent(content: string): boolean {
    return this.hasClientOnlyFeatures(content)
  }

  /**
   * Apply optimization to content
   */
  private applyOptimization(content: string, issue: PerformanceIssue): Optimization | null {
    switch (issue.type) {
      case 'image-optimization':
        return this.optimizeImages(content)
      case 'code-splitting':
        return this.addDynamicImports(content)
      case 'bundle-size':
        return this.optimizeBundleSize(content)
      case 'server-component':
        return this.optimizeServerComponent(content)
      default:
        return null
    }
  }

  /**
   * Optimize images in content
   */
  private optimizeImages(content: string): Optimization | null {
    const imgRegex = /<img\s+([^>]*)src=["']([^"']+)["']([^>]*)>/g
    let hasChanges = false
    
    const optimized = content.replace(imgRegex, (match, beforeSrc, src, afterSrc) => {
      hasChanges = true
      return `<Image${beforeSrc}src="${src}"${afterSrc} />`
    })

    if (!hasChanges) {
      return null
    }

    // Add Image import if not present
    let finalContent = optimized
    if (!content.includes('from "next/image"')) {
      finalContent = `import Image from "next/image"\n${optimized}`
    }

    return {
      type: 'image-optimization',
      description: 'Replaced img tags with Next.js Image component',
      before: content,
      after: finalContent
    }
  }

  /**
   * Add dynamic imports
   */
  private addDynamicImports(content: string): Optimization | null {
    // This is a simplified example - real implementation would be more sophisticated
    const heavyImports = ['recharts', 'react-pdf']
    let hasChanges = false
    let optimized = content

    heavyImports.forEach(lib => {
      const importRegex = new RegExp(`import\\s+.*from\\s+['"]${lib}['"]`, 'g')
      if (importRegex.test(content)) {
        optimized = `import dynamic from 'next/dynamic'\n${optimized}`
        hasChanges = true
      }
    })

    if (!hasChanges) {
      return null
    }

    return {
      type: 'code-splitting',
      description: 'Added dynamic imports for heavy libraries',
      before: content,
      after: optimized
    }
  }

  /**
   * Optimize bundle size
   */
  private optimizeBundleSize(content: string): Optimization | null {
    // Replace full lodash import with specific imports
    const lodashRegex = /import\s+_\s+from\s+['"]lodash['"]/g
    
    if (lodashRegex.test(content)) {
      const optimized = content.replace(
        lodashRegex,
        '// Import specific lodash functions instead of the entire library\n// import { debounce, throttle } from "lodash"'
      )

      return {
        type: 'bundle-size',
        description: 'Optimized lodash imports',
        before: content,
        after: optimized
      }
    }

    return null
  }

  /**
   * Optimize server component
   */
  private optimizeServerComponent(content: string): Optimization | null {
    // Remove unnecessary 'use client' directive
    if (content.includes("'use client'") && !this.hasClientOnlyFeatures(content)) {
      const optimized = content.replace(/'use client'\s*\n?/g, '')
      
      return {
        type: 'server-component',
        description: 'Removed unnecessary "use client" directive',
        before: content,
        after: optimized
      }
    }

    return null
  }

  /**
   * Estimate performance savings
   */
  private estimateSavings(issue: PerformanceIssue): number {
    const savingsMap = {
      'bundle-size': 50000, // 50KB
      'code-splitting': 30000, // 30KB
      'image-optimization': 20000, // 20KB
      'font-loading': 10000, // 10KB
      'server-component': 5000, // 5KB
    }

    return savingsMap[issue.type] || 0
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(issues: PerformanceIssue[]): number {
    const maxScore = 100
    const penalties = {
      high: 20,
      medium: 10,
      low: 5
    }

    const totalPenalty = issues.reduce((sum, issue) => sum + penalties[issue.severity], 0)
    return Math.max(0, maxScore - totalPenalty)
  }

  /**
   * Parse build output for bundle information
   */
  private parseBuildOutput(output: string): ChunkInfo[] {
    // This is a simplified parser - real implementation would parse webpack stats
    const chunks: ChunkInfo[] = []
    
    // Look for chunk information in build output
    const chunkRegex = /(\S+)\s+(\d+(?:\.\d+)?)\s*(kB|MB)/g
    let match

    while ((match = chunkRegex.exec(output)) !== null) {
      const [, name, sizeStr, unit] = match
      if (!name || !sizeStr) continue
      
      const size = parseFloat(sizeStr) * (unit === 'MB' ? 1024 * 1024 : 1024)
      
      chunks.push({
        name,
        size,
        modules: [], // Would be populated from detailed analysis
        isLarge: size > 100 * 1024 // 100KB threshold
      })
    }

    return chunks
  }

  /**
   * Generate bundle recommendations
   */
  private generateBundleRecommendations(chunks: ChunkInfo[]): string[] {
    const recommendations: string[] = []
    
    const largeChunks = chunks.filter(chunk => chunk.isLarge)
    if (largeChunks.length > 0) {
      recommendations.push(`${largeChunks.length} chunks are larger than 100KB - consider code splitting`)
    }

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0)
    if (totalSize > 1024 * 1024) { // 1MB
      recommendations.push('Total bundle size exceeds 1MB - consider optimization strategies')
    }

    return recommendations
  }

  /**
   * Generate component recommendations
   */
  private generateComponentRecommendations(issues: PerformanceIssue[]): string[] {
    const recommendations: string[] = []
    
    const highSeverityIssues = issues.filter(issue => issue.severity === 'high')
    if (highSeverityIssues.length > 0) {
      recommendations.push(`Address ${highSeverityIssues.length} high-priority performance issues`)
    }

    const bundleIssues = issues.filter(issue => issue.type === 'bundle-size')
    if (bundleIssues.length > 0) {
      recommendations.push('Optimize bundle size by using tree-shaking and specific imports')
    }

    const imageIssues = issues.filter(issue => issue.type === 'image-optimization')
    if (imageIssues.length > 0) {
      recommendations.push('Use Next.js Image component for automatic image optimization')
    }

    return recommendations
  }

  /**
   * Generate global recommendations
   */
  private generateGlobalRecommendations(
    components: PerformanceAnalysis[], 
    bundle: BundleAnalysis
  ): string[] {
    const recommendations: string[] = []
    
    const totalIssues = components.reduce((sum, c) => sum + c.issues.length, 0)
    if (totalIssues > 0) {
      recommendations.push(`Address ${totalIssues} performance issues across ${components.length} components`)
    }

    recommendations.push(...bundle.recommendations)

    return recommendations
  }

  /**
   * Find all component files
   */
  private async findComponentFiles(): Promise<string[]> {
    const patterns = [
      'components/**/*.{tsx,jsx}',
      'pages/**/*.{tsx,jsx}',
      'app/**/*.{tsx,jsx}',
    ]

    const files: string[] = []

    for (const pattern of patterns) {
      try {
        const found = await glob(pattern, {
          cwd: this.projectRoot,
          absolute: true,
          ignore: [
            'node_modules/**',
            '.next/**',
            '**/*.test.*',
            '**/*.spec.*',
          ]
        })
        files.push(...found)
      } catch (error) {
        console.warn(`Warning: Failed to scan pattern ${pattern}:`, error)
      }
    }

    return Array.from(new Set(files))
  }
}