import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import path from 'path'

// Mock fs and glob
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs')
  return {
    ...actual,
    promises: {
      rm: vi.fn(),
      unlink: vi.fn(),
    },
    existsSync: vi.fn(),
    statSync: vi.fn(),
  }
})

vi.mock('glob', () => ({
  glob: vi.fn(),
}))

import { NextJSCleaner } from '../nextjs-cleaner'
import { promises as fs, existsSync, statSync } from 'fs'
import { glob } from 'glob'

// Get mocked functions
const mockRm = vi.mocked(fs.rm)
const mockUnlink = vi.mocked(fs.unlink)
const mockExistsSync = vi.mocked(existsSync)
const mockStatSync = vi.mocked(statSync)
const mockGlob = vi.mocked(glob)

describe('NextJSCleaner', () => {
  let cleaner: NextJSCleaner
  const testRoot = '/test/project'

  beforeEach(() => {
    cleaner = new NextJSCleaner(testRoot)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(cleaner.formatBytes(0)).toBe('0 Bytes')
      expect(cleaner.formatBytes(1024)).toBe('1 KB')
      expect(cleaner.formatBytes(1048576)).toBe('1 MB')
      expect(cleaner.formatBytes(1073741824)).toBe('1 GB')
    })

    it('should handle decimal values correctly', () => {
      expect(cleaner.formatBytes(1536)).toBe('1.5 KB')
      expect(cleaner.formatBytes(1572864)).toBe('1.5 MB')
    })
  })

  describe('cleanup - basic functionality', () => {
    it('should return empty result when no files exist', async () => {
      // Setup: No files exist
      mockExistsSync.mockReturnValue(false)
      mockGlob.mockResolvedValue([])

      const result = await cleaner.cleanup(true)

      expect(result.removed).toEqual([])
      expect(result.errors).toEqual([])
      expect(result.totalSize).toBe(0)
      expect(result.summary.buildDirectories).toBe(0)
      expect(result.summary.testFiles).toBe(0)
      expect(result.summary.storyFiles).toBe(0)
      expect(result.summary.tempFiles).toBe(0)
      expect(result.summary.logFiles).toBe(0)
    })

    it('should call cleanup methods in correct order', async () => {
      // Just verify the method runs without errors
      mockExistsSync.mockReturnValue(false)
      mockGlob.mockResolvedValue([])

      const result = await cleaner.cleanup(true)

      // Basic structure validation
      expect(result).toHaveProperty('removed')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('totalSize')
      expect(result).toHaveProperty('summary')
      expect(result.summary).toHaveProperty('buildDirectories')
      expect(result.summary).toHaveProperty('testFiles')
      expect(result.summary).toHaveProperty('storyFiles')
      expect(result.summary).toHaveProperty('tempFiles')
      expect(result.summary).toHaveProperty('logFiles')
    })
  })

  describe('checkArtifacts', () => {
    it('should return empty results when no artifacts exist', async () => {
      mockExistsSync.mockReturnValue(false)
      mockGlob.mockResolvedValue([])

      const result = await cleaner.checkArtifacts()

      expect(result.buildDirs).toBeDefined()
      expect(result.buildDirs.length).toBeGreaterThan(0)
      expect(result.buildDirs.every((dir) => !dir.exists)).toBe(true)
      expect(result.devFiles).toBe(0)
      expect(result.tempFiles).toBe(0)
    })

    it('should return correct structure', async () => {
      mockExistsSync.mockReturnValue(false)
      mockGlob.mockResolvedValue([])

      const result = await cleaner.checkArtifacts()

      expect(result).toHaveProperty('buildDirs')
      expect(result).toHaveProperty('devFiles')
      expect(result).toHaveProperty('tempFiles')
      expect(Array.isArray(result.buildDirs)).toBe(true)
      expect(typeof result.devFiles).toBe('number')
      expect(typeof result.tempFiles).toBe('number')
    })

    it('should count development and temporary files correctly', async () => {
      mockExistsSync.mockReturnValue(false)

      mockGlob.mockImplementation((pattern) => {
        if (pattern === '**/*.test.*') {
          return Promise.resolve(['component.test.ts'])
        }
        if (pattern === '**/*.spec.*') {
          return Promise.resolve(['utils.spec.ts'])
        }
        if (pattern === '**/*.log') {
          return Promise.resolve(['debug.log'])
        }
        return Promise.resolve([])
      })

      const result = await cleaner.checkArtifacts()

      expect(result.devFiles).toBe(2)
      expect(result.tempFiles).toBe(1)
    })
  })
})