/**
 * Redirect Utilities
 * 
 * Provides utilities for handling redirects for 404, unauthorized access,
 * and other navigation scenarios.
 */

import type { NextRouter } from 'next/router'
import { showAuthError, showAuthorizationError, toast } from './toast'

// ============================================================================
// Redirect Functions
// ============================================================================

/**
 * Redirect to 404 page
 */
export function redirectTo404(router: NextRouter, message?: string): void {
  if (message) {
    toast.error('Page Not Found', {
      description: message,
      duration: 5000,
    })
  }
  
  router.push('/404')
}

/**
 * Redirect to login page
 */
export function redirectToLogin(
  router: NextRouter,
  returnUrl?: string,
  message?: string
): void {
  if (message) {
    showAuthError(new Error(message))
  }
  
  const url = returnUrl 
    ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
    : '/login'
  
  router.push(url)
}

/**
 * Redirect to unauthorized page
 */
export function redirectToUnauthorized(
  router: NextRouter,
  message?: string
): void {
  if (message) {
    showAuthorizationError(new Error(message))
  }
  
  router.push('/unauthorized')
}

/**
 * Redirect to dashboard
 */
export function redirectToDashboard(router: NextRouter): void {
  router.push('/dashboard')
}

/**
 * Redirect back or to fallback
 */
export function redirectBack(
  router: NextRouter,
  fallback: string = '/dashboard'
): void {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(fallback)
  }
}

// ============================================================================
// Server-Side Redirect Helpers
// ============================================================================

/**
 * Create redirect object for getServerSideProps
 */
export function createRedirect(destination: string, permanent: boolean = false) {
  return {
    redirect: {
      destination,
      permanent,
    },
  }
}

/**
 * Create 404 not found object for getServerSideProps
 */
export function createNotFound() {
  return {
    notFound: true,
  }
}

/**
 * Create login redirect for getServerSideProps
 */
export function createLoginRedirect(returnUrl?: string) {
  const destination = returnUrl
    ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
    : '/login'
  
  return createRedirect(destination)
}

/**
 * Create unauthorized redirect for getServerSideProps
 */
export function createUnauthorizedRedirect() {
  return createRedirect('/unauthorized')
}

// ============================================================================
// Route Guards
// ============================================================================

/**
 * Check if user is authenticated (client-side)
 */
export async function requireAuth(
  router: NextRouter,
  checkAuth: () => Promise<boolean>
): Promise<boolean> {
  const isAuthenticated = await checkAuth()
  
  if (!isAuthenticated) {
    redirectToLogin(router, router.asPath, 'Please log in to continue')
    return false
  }
  
  return true
}

/**
 * Check if user has required role (client-side)
 */
export async function requireRole(
  router: NextRouter,
  checkRole: () => Promise<boolean>,
  requiredRole: string
): Promise<boolean> {
  const hasRole = await checkRole()
  
  if (!hasRole) {
    redirectToUnauthorized(
      router,
      `This page requires ${requiredRole} access`
    )
    return false
  }
  
  return true
}

/**
 * Check if resource exists (client-side)
 */
export async function requireResource(
  router: NextRouter,
  checkResource: () => Promise<boolean>,
  resourceName: string = 'Resource'
): Promise<boolean> {
  const exists = await checkResource()
  
  if (!exists) {
    redirectTo404(router, `${resourceName} not found`)
    return false
  }
  
  return true
}

// ============================================================================
// URL Utilities
// ============================================================================

/**
 * Get return URL from query params
 */
export function getReturnUrl(router: NextRouter): string | null {
  const { returnUrl } = router.query
  
  if (typeof returnUrl === 'string') {
    // Validate return URL to prevent open redirect
    if (isValidReturnUrl(returnUrl)) {
      return returnUrl
    }
  }
  
  return null
}

/**
 * Validate return URL to prevent open redirect attacks
 */
export function isValidReturnUrl(url: string): boolean {
  try {
    // Must be relative URL or same origin
    if (url.startsWith('/')) {
      return true
    }
    
    const parsed = new URL(url, window.location.origin)
    return parsed.origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * Build URL with query params
 */
export function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean>
): string {
  if (!params || Object.keys(params).length === 0) {
    return path
  }
  
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value))
  })
  
  return `${path}?${searchParams.toString()}`
}

// ============================================================================
// Navigation Guards Hook
// ============================================================================

export interface NavigationGuardOptions {
  requireAuth?: boolean
  requireRole?: string | string[]
  onUnauthorized?: () => void
  onForbidden?: () => void
}

/**
 * Hook for navigation guards
 */
export function useNavigationGuard(
  router: NextRouter,
  options: NavigationGuardOptions
) {
  const {
    requireAuth: needsAuth,
    requireRole: neededRole,
    onUnauthorized,
    onForbidden,
  } = options

  return {
    checkAccess: async (
      isAuthenticated: boolean,
      userRole?: string
    ): Promise<boolean> => {
      // Check authentication
      if (needsAuth && !isAuthenticated) {
        onUnauthorized?.()
        redirectToLogin(router, router.asPath)
        return false
      }

      // Check role
      if (neededRole && userRole) {
        const allowedRoles = Array.isArray(neededRole) ? neededRole : [neededRole]
        
        if (!allowedRoles.includes(userRole)) {
          onForbidden?.()
          redirectToUnauthorized(router)
          return false
        }
      }

      return true
    },
  }
}
