# Next.js Production Cleanup

This module provides comprehensive cleanup functionality for Next.js applications, specifically designed to remove development artifacts and build files before production deployment.

## Features

### 🏗️ Build Directory Cleanup

- Removes `.next/` build output directory
- Cleans `.turbo/` Turborepo cache
- Removes `.vercel/` deployment artifacts
- Handles both root and `frontend/` subdirectory structures

### 🧪 Development File Cleanup

- Test files: `*.test.*`, `*.spec.*`
- Storybook files: `*.stories.*`
- Test directories: `__tests__/`, `e2e/`, `coverage/`
- Playwright artifacts: `.playwright/`

### 🗂️ Temporary File Cleanup

- Log files: `*.log`, `debug.log`, `error.log`
- Cache files: `*.cache`, `.eslintcache`
- Build info: `*.tsbuildinfo`
- System files: `.DS_Store`, `Thumbs.db`
- NPM/Yarn logs: `npm-debug.log*`, `yarn-debug.log*`, `yarn-error.log*`

## Usage

### Basic Usage

```typescript
import { NextJSCleaner } from "./nextjs-cleaner";

const cleaner = new NextJSCleaner();

// Dry run - see what would be removed
const report = await cleaner.generateReport();
console.log(`Would remove ${report.removed.length} files`);

// Actual cleanup
const result = await cleaner.cleanup();
console.log(
  `Removed ${result.removed.length} files, freed ${cleaner.formatBytes(result.totalSize)}`
);
```

### CLI Usage

```bash
# Generate report only
npx tsx frontend/lib/production-cleanup/cleanup-cli.ts --report

# Dry run - see what would be removed
npx tsx frontend/lib/production-cleanup/cleanup-cli.ts --dry-run

# Actual cleanup
npx tsx frontend/lib/production-cleanup/cleanup-cli.ts

# Demo functionality
npx tsx frontend/lib/production-cleanup/demo-cleanup.ts
```

### Integration with Artifact Scanner

```typescript
import { ArtifactScanner } from "./artifact-scanner";

const scanner = new ArtifactScanner();

// Generate comprehensive cleanup report
const report = await scanner.generateCleanupReport();

// Execute Next.js specific cleanup
const result = await scanner.executeNextJSCleanup(false);
```

## API Reference

### NextJSCleaner Class

#### Constructor

```typescript
new NextJSCleaner(projectRoot?: string)
```

#### Methods

##### `cleanup(dryRun?: boolean): Promise<NextJSCleanupResult>`

Executes the complete cleanup process.

##### `generateReport(): Promise<NextJSCleanupResult>`

Generates a report without removing files (equivalent to `cleanup(true)`).

##### `checkArtifacts(): Promise<ArtifactStatus>`

Checks for the existence of build directories and counts development files.

##### `formatBytes(bytes: number): string`

Utility method to format byte sizes in human-readable format.

### Types

```typescript
interface NextJSCleanupResult {
  removed: string[];
  errors: Array<{ file: string; error: string }>;
  totalSize: number;
  summary: {
    buildDirectories: number;
    testFiles: number;
    storyFiles: number;
    tempFiles: number;
    logFiles: number;
  };
}
```

## Configuration

The cleanup patterns are defined in `config.ts`:

```typescript
export const defaultCleanupConfig = {
  filePatterns: {
    nextjsSpecific: [
      ".next/**",
      ".turbo/**",
      ".vercel/**",
      // ... more patterns
    ],
    remove: [
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.stories.*",
      // ... more patterns
    ],
    preserve: [
      "README.md",
      "package.json",
      // ... critical files
    ],
  },
};
```

## Safety Features

### Preserved Files

Critical files are automatically preserved:

- `README.md`
- `package.json`, `package-lock.json`
- Configuration files: `tsconfig.json`, `next.config.js`, etc.
- Environment examples: `.env.example`

### Error Handling

- Graceful handling of permission errors
- Detailed error reporting
- Safe directory traversal (ignores `node_modules`, `.git`)

### Dry Run Mode

Always test with dry run mode first:

```bash
npx tsx frontend/lib/production-cleanup/cleanup-cli.ts --dry-run
```

## Examples

### Production Deployment Script

```bash
#!/bin/bash
# Pre-deployment cleanup
npx tsx frontend/lib/production-cleanup/cleanup-cli.ts

# Build application
npm run build

# Deploy
npm run deploy
```

### CI/CD Integration

```yaml
# .github/workflows/deploy.yml
- name: Clean development artifacts
  run: npx tsx frontend/lib/production-cleanup/cleanup-cli.ts

- name: Build application
  run: npm run build
```

## Testing

Run the test suite:

```bash
npm test -- frontend/lib/production-cleanup/__tests__/nextjs-cleaner.test.ts --run
```

## Requirements

- Node.js >= 18.0.0
- TypeScript support
- Dependencies: `glob`, `fs/promises`

## Best Practices

1. **Always use dry run first** to verify what will be removed
2. **Run in CI/CD** as part of your deployment pipeline
3. **Backup important files** before running cleanup
4. **Test thoroughly** in staging environment first
5. **Monitor disk space** savings to validate effectiveness

## Troubleshooting

### Permission Errors

If you encounter permission errors, ensure the process has write access to the directories being cleaned.

### Pattern Matching Issues

Use the `--report` flag to see exactly which files match the cleanup patterns.

### Large Directory Cleanup

For very large build directories, the cleanup may take some time. Monitor progress with verbose logging.
