/**
 * Performance Optimization Utilities
 * 
 * Provides utilities for code splitting, lazy loading, memoization,
 * and performance monitoring.
 */

import * as React from 'react'
import dynamic from 'next/dynamic'
import { startPerformanceMeasure } from './error-logger'

// ============================================================================
// Code Splitting & Lazy Loading
// ============================================================================

/**
 * Lazy load a component with loading fallback
 */
export function lazyLoadComponent<T extends React.ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  return dynamic(importFn, {
    loading: () => (fallback || <div>Loading...</div>) as React.ReactElement,
    ssr: false,
  })
}

/**
 * Lazy load admin pages (code splitting for admin routes)
 */
export const lazyLoadAdminPage = <T extends React.ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>
) => {
  return lazyLoadComponent(importFn, <AdminPageLoader />)
}

/**
 * Lazy load report visualizations
 */
export const lazyLoadReportChart = <T extends React.ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>
) => {
  return lazyLoadComponent(importFn, <ChartLoader />)
}

// ============================================================================
// Loading Components
// ============================================================================

function AdminPageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Loading admin page...</p>
      </div>
    </div>
  )
}

function ChartLoader() {
  return (
    <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Loading chart...</p>
      </div>
    </div>
  )
}

// ============================================================================
// Memoization Utilities
// ============================================================================

/**
 * Memoize a function with custom cache key
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  getCacheKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = getCacheKey ? getCacheKey(...args) : JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn(...args)
    cache.set(key, result as ReturnType<T>)

    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      if (firstKey) cache.delete(firstKey)
    }

    return result
  }) as T
}

/**
 * Memoize async function with TTL
 */
export function memoizeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  ttlMs: number = 60000,
  getCacheKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, { value: Awaited<ReturnType<T>>; expires: number }>()

  return (async (...args: Parameters<T>) => {
    const key = getCacheKey ? getCacheKey(...args) : JSON.stringify(args)
    const now = Date.now()

    const cached = cache.get(key)
    if (cached && cached.expires > now) {
      return cached.value
    }

    const result = await fn(...args)
    cache.set(key, {
      value: result as Awaited<ReturnType<T>>,
      expires: now + ttlMs,
    })

    // Cleanup expired entries
    for (const [k, v] of cache.entries()) {
      if (v.expires <= now) {
        cache.delete(k)
      }
    }

    return result
  }) as T
}

/**
 * React hook for memoizing expensive calculations
 */
export function useExpensiveCalculation<T>(
  calculate: () => T,
  deps: React.DependencyList
): T {
  return React.useMemo(() => {
    const endMeasure = startPerformanceMeasure('expensive_calculation')
    const result = calculate()
    endMeasure()
    return result
  }, deps)
}

// ============================================================================
// Debounce & Throttle
// ============================================================================

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delayMs)
  }
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastCall >= delayMs) {
      lastCall = now
      fn(...args)
    }
  }
}

/**
 * React hook for debounced value
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => clearTimeout(timeoutId)
  }, [value, delayMs])

  return debouncedValue
}

/**
 * React hook for debounced callback
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delayMs: number
): T {
  const callbackRef = React.useRef(callback)

  React.useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return React.useMemo(
    () => debounce((...args: unknown[]) => callbackRef.current(...(args as Parameters<T>)), delayMs),
    [delayMs]
  ) as T
}

// ============================================================================
// Image Optimization
// ============================================================================

/**
 * Compress image file on client-side
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 1,
  maxWidthOrHeight: number = 1920
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = (height * maxWidthOrHeight) / width
            width = maxWidthOrHeight
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = (width * maxWidthOrHeight) / height
            height = maxWidthOrHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob with quality adjustment
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })

            resolve(compressedFile)
          },
          file.type,
          0.8 // Quality: 0.8 = 80%
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Check if file should be compressed
 */
export function shouldCompressFile(file: File): boolean {
  const MAX_SIZE = 2 * 1024 * 1024 // 2MB
  const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/png']

  return file.size > MAX_SIZE && COMPRESSIBLE_TYPES.includes(file.type)
}

// ============================================================================
// Pagination Utilities
// ============================================================================

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Calculate pagination state
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationState {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

/**
 * React hook for pagination
 */
export function usePagination(initialLimit: number = 10) {
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(initialLimit)

  const goToPage = React.useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const nextPage = React.useCallback(() => {
    setPage((prev) => prev + 1)
  }, [])

  const prevPage = React.useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1))
  }, [])

  const changeLimit = React.useCallback((newLimit: number) => {
    setLimit(newLimit)
    setPage(1) // Reset to first page when changing limit
  }, [])

  const reset = React.useCallback(() => {
    setPage(1)
    setLimit(initialLimit)
  }, [initialLimit])

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    goToPage,
    nextPage,
    prevPage,
    changeLimit,
    reset,
  }
}

// ============================================================================
// Virtual Scrolling Utilities
// ============================================================================

export interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

/**
 * Calculate visible items for virtual scrolling
 */
export function calculateVisibleItems(
  scrollTop: number,
  totalItems: number,
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 3 } = options

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  return {
    startIndex,
    endIndex,
    visibleItems: endIndex - startIndex + 1,
    offsetY: startIndex * itemHeight,
  }
}

/**
 * React hook for virtual scrolling
 */
export function useVirtualScroll(
  totalItems: number,
  options: VirtualScrollOptions
) {
  const [scrollTop, setScrollTop] = React.useState(0)

  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    },
    []
  )

  const visible = React.useMemo(
    () => calculateVisibleItems(scrollTop, totalItems, options),
    [scrollTop, totalItems, options]
  )

  return {
    ...visible,
    handleScroll,
    totalHeight: totalItems * options.itemHeight,
  }
}

// ============================================================================
// React Query Cache Configuration
// ============================================================================

export const CACHE_TIMES = {
  /** 1 minute - for frequently changing data */
  SHORT: 60 * 1000,
  /** 5 minutes - for moderately changing data */
  MEDIUM: 5 * 60 * 1000,
  /** 15 minutes - for slowly changing data */
  LONG: 15 * 60 * 1000,
  /** 1 hour - for rarely changing data */
  VERY_LONG: 60 * 60 * 1000,
} as const

/**
 * Get cache configuration for different data types
 */
export function getCacheConfig(type: 'leave-requests' | 'documents' | 'calendar' | 'reports' | 'leave-types') {
  switch (type) {
    case 'leave-requests':
      return {
        staleTime: CACHE_TIMES.SHORT,
        cacheTime: CACHE_TIMES.MEDIUM,
      }
    case 'documents':
      return {
        staleTime: CACHE_TIMES.MEDIUM,
        cacheTime: CACHE_TIMES.LONG,
      }
    case 'calendar':
      return {
        staleTime: CACHE_TIMES.MEDIUM,
        cacheTime: CACHE_TIMES.LONG,
      }
    case 'reports':
      return {
        staleTime: CACHE_TIMES.LONG,
        cacheTime: CACHE_TIMES.VERY_LONG,
      }
    case 'leave-types':
      return {
        staleTime: CACHE_TIMES.VERY_LONG,
        cacheTime: CACHE_TIMES.VERY_LONG,
      }
    default:
      return {
        staleTime: CACHE_TIMES.MEDIUM,
        cacheTime: CACHE_TIMES.LONG,
      }
  }
}

// ============================================================================
// Performance Monitoring
// ============================================================================

/**
 * Measure component render time
 */
export function useRenderTime(componentName: string) {
  const renderCount = React.useRef(0)

  React.useEffect(() => {
    renderCount.current++
  })

  React.useEffect(() => {
    const endMeasure = startPerformanceMeasure(`${componentName}_render`)
    return () => {
      endMeasure({
        component: componentName,
        renderCount: renderCount.current,
      })
    }
  }, [componentName])
}

/**
 * Detect slow renders
 */
export function useSlowRenderDetection(componentName: string, thresholdMs: number = 16) {
  React.useEffect(() => {
    const startTime = performance.now()

    return () => {
      const renderTime = performance.now() - startTime
      if (renderTime > thresholdMs) {
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
      }
    }
  })
}
