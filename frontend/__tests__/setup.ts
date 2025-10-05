/**
 * Test Setup Configuration
 * 
 * Global test setup for Vitest testing environment
 */

import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers)

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock pointer capture methods for Radix UI
Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || function() { return false }
Element.prototype.setPointerCapture = Element.prototype.setPointerCapture || function() {}
Element.prototype.releasePointerCapture = Element.prototype.releasePointerCapture || function() {}

// Mock scrollIntoView for Radix UI Select
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || function() {}

// Mock getBoundingClientRect for layout calculations
Element.prototype.getBoundingClientRect = Element.prototype.getBoundingClientRect || function() {
  return {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: function() {}
  }
}