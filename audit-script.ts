#!/usr/bin/env node

/**
 * Repository Audit Script
 * Scans entire repository and produces inventory JSON
 * Following PLAN.md requirements for comprehensive refactoring
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

interface FileInventory {
  path: string;
  language: string;
  size: number;
  lastModified: string;
  testPresence: boolean;
  importGraph: string[];
  notes: string[];
  anyUsage: boolean;
  deprecatedAPIs: string[];
  duplicateCode: boolean;
}

interface RepositoryInventory {
  files: FileInventory[];
  summary: {
    totalFiles: number;
    filesWithAny: number;
    filesWithTests: number;
    languages: Record<string, number>;
    outdatedDependencies: string[];
    accessibilityIssues: number;
    totalSize: number;
  };
}

function getLanguageFromExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const langMap: Record<string, string> = {
    '.tsx': 'TypeScript',
    '.ts': 'TypeScript',
    '.jsx': 'JavaScript',
    '.js': 'JavaScript',
    '.json': 'JSON',
    '.md': 'Markdown',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.html': 'HTML',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.sql': 'SQL',
    '.py': 'Python',
    '.sh': 'Shell',
    '.env': 'Environment',
  };
  return langMap[ext] || 'Unknown';
}

function detectAnyUsage(content: string): boolean {
  return /\bany\b/.test(content) && !/\/\/.*any|\/\*.*any|\*.*any/.test(content);
}

function detectTestFiles(filePath: string): boolean {
  const testPatterns = [
    /\.test\.(ts|tsx|js|jsx)$/,
    /\.spec\.(ts|tsx|js|jsx)$/,
    /__tests__/,
    /\.test\./,
    /\.spec\./,
  ];

  return testPatterns.some(pattern =>
    typeof pattern === 'string' ? pattern.includes('__tests__') && filePath.includes(pattern) : pattern.test(filePath)
  );
}

function scanDirectory(dirPath: string, inventory: FileInventory[] = []): FileInventory[] {
  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== '.next') {
        scanDirectory(fullPath, inventory);
      } else if (stat.isFile()) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const language = getLanguageFromExtension(fullPath);
        const hasTests = detectTestFiles(fullPath);
        const hasAny = detectAnyUsage(content);

        inventory.push({
          path: fullPath,
          language,
          size: stat.size,
          lastModified: stat.mtime.toISOString(),
          testPresence: hasTests,
          importGraph: [], // Would need more complex analysis
          notes: [],
          anyUsage: hasAny,
          deprecatedAPIs: [],
          duplicateCode: false,
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }

  return inventory;
}

function generateInventory(): RepositoryInventory {
  console.log('🔍 Starting repository audit...');

  const rootPath = process.cwd();
  const files = scanDirectory(rootPath);

  // Calculate summary statistics
  const filesWithAny = files.filter(f => f.anyUsage).length;
  const filesWithTests = files.filter(f => f.testPresence).length;
  const languages = files.reduce((acc, file) => {
    acc[file.language] = (acc[file.language] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  const summary = {
    totalFiles: files.length,
    filesWithAny,
    filesWithTests,
    languages,
    outdatedDependencies: [], // Would need package.json analysis
    accessibilityIssues: 0, // Would need accessibility scanning
    totalSize,
  };

  return { files, summary };
}

// Generate and save inventory
const inventory = generateInventory();
const outputPath = path.join(process.cwd(), 'repository-inventory.json');

fs.writeFileSync(outputPath, JSON.stringify(inventory, null, 2));
console.log(`✅ Repository audit complete! Inventory saved to ${outputPath}`);
console.log(`📊 Summary: ${inventory.summary.totalFiles} files, ${inventory.summary.filesWithAny} with 'any' usage`);
