/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'pages/api/**/*.ts',
        'lib/**/*.ts',
        'hooks/**/*.ts',
        'components/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/**',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        'lib/database.types.ts',
        'lib/production-cleanup/**',
        'scripts/**',
      ],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/components': path.resolve(__dirname, './components'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/types': path.resolve(__dirname, './types'),
      '@/app': path.resolve(__dirname, './pages'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@/ui': path.resolve(__dirname, './ui'),
    },
  },
  define: {
    global: 'globalThis',
  },
})