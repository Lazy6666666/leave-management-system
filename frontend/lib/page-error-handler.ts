/**
 * Page Error Handler
 * 
 * Provides utilities for handling page-level errors including
 * 404, unauthorized access, and forbidden access with redirects.
 */

import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { logError, logWarning } from './error-logger'
import { AuthenticationError, AuthorizationError, NotFoundError } from './errors'
import { showAuthError, showAuthorizationError } from './toast'

// ============================================================================
// Page Error Types
// ============================================================================

export type PageErrorType = '404' | '401' | '403' | '500'

export interface PageErrorOptions {
  redirectTo?: string
  showToast?: boolean
  logError?: boolean
  returnUrl?: string
}

// ============================================================================
// 404 Not Found Handler
// ============================================================================

/**
 * Handle 404 errors with optional redirect
 */
export function handle404(
  router: ReturnType<typeof useRouter>,
  options: PageErrorOptions = {}
): void {
  const {
    redirectTo = '/404',
    showToast = false,
    logError: shouldLog = true,
  } = options

  if (shouldLog) {
    logError(new NotFoundError('Page'), {
      path: router.asPath,
      context: 'page_404',
    })
  }

  if (redirectTo) {
    router.push(redirectTo)
  }
}

/**
 * Hook to handle 404 errors
 */
export function use404Handler(
  condition: boolean,
  options: PageErrorOptions = {}
): void {
  const router = useRouter()

  useEffect(() => {
    if (condition) {
      handle404(router, options)
    }
  }, [condition, router])
}

// ============================================================================
// 401 Unauthorized Handler
// ============================================================================

/**
 * Handle unauthorized access with redirect to login
 */
export function handleUnauthorized(
  router: ReturnType<typeof useRouter>,
  options: PageErrorOptions = {}
): void {
  const {
    redirectTo = '/login',
    showToast: shouldShowToast = true,
    logError: shouldLog = true,
    returnUrl,
  } = options

  const error = new AuthenticationError('Please log in to continue')

  if (shouldLog) {
    logError(error, {
      path: router.asPath,
      context: 'page_unauthorized',
    })
  }

  if (shouldShowToast) {
    showAuthError(error)
  }

  const finalReturnUrl = returnUrl || router.asPath
  const redirectUrl = `${redirectTo}?returnUrl=${encodeURIComponent(finalReturnUrl)}`

  router.push(redirectUrl)
}

/**
 * Hook to handle unauthorized access
 */
export function useUnauthorizedHandler(
  isAuthenticated: boolean,
  isLoading: boolean = false,
  options: PageErrorOptions = {}
): void {
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      handleUnauthorized(router, options)
    }
  }, [isAuthenticated, isLoading, router])
}

// ============================================================================
// 403 Forbidden Handler
// ============================================================================

/**
 * Handle forbidden access with redirect to dashboard
 */
export function handleForbidden(
  router: ReturnType<typeof useRouter>,
  options: PageErrorOptions = {}
): void {
  const {
    redirectTo = '/dashboard',
    showToast: shouldShowToast = true,
    logError: shouldLog = true,
  } = options

  const error = new AuthorizationError('You do not have permission to access this page')

  if (shouldLog) {
    logWarning('Forbidden access attempt', {
      path: router.asPath,
      context: 'page_forbidden',
    })
  }

  if (shouldShowToast) {
    showAuthorizationError(error)
  }

  router.push(redirectTo)
}

/**
 * Hook to handle forbidden access based on role
 */
export function useForbiddenHandler(
  userRole: string | undefined,
  allowedRoles: string[],
  isLoading: boolean = false,
  options: PageErrorOptions = {}
): void {
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && userRole && !allowedRoles.includes(userRole)) {
      handleForbidden(router, options)
    }
  }, [userRole, allowedRoles, isLoading, router])
}

// ============================================================================
// Combined Authorization Handler
// ============================================================================

export interface AuthorizationCheck {
  isAuthenticated: boolean
  userRole?: string
  allowedRoles?: string[]
  isLoading?: boolean
}

/**
 * Hook to handle both authentication and authorization
 */
export function useAuthorizationHandler(
  check: AuthorizationCheck,
  options: PageErrorOptions = {}
): void {
  const router = useRouter()
  const {
    isAuthenticated,
    userRole,
    allowedRoles,
    isLoading = false,
  } = check

  useEffect(() => {
    if (isLoading) {
      return
    }

    // Check authentication first
    if (!isAuthenticated) {
      handleUnauthorized(router, options)
      return
    }

    // Check authorization if roles are specified
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      handleForbidden(router, options)
      return
    }
  }, [isAuthenticated, userRole, allowedRoles, isLoading, router])
}

// ============================================================================
// Server-Side Props Helpers
// ============================================================================

/**
 * Create redirect response for getServerSideProps
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
 * Create 404 response for getServerSideProps
 */
export function createNotFound() {
  return {
    notFound: true,
  }
}

/**
 * Handle authentication in getServerSideProps
 */
export function handleServerAuth(
  isAuthenticated: boolean,
  currentPath: string
) {
  if (!isAuthenticated) {
    return createRedirect(`/login?returnUrl=${encodeURIComponent(currentPath)}`)
  }
  return null
}

/**
 * Handle authorization in getServerSideProps
 */
export function handleServerAuthz(
  userRole: string | undefined,
  allowedRoles: string[]
) {
  if (!userRole || !allowedRoles.includes(userRole)) {
    return createRedirect('/dashboard')
  }
  return null
}

/**
 * Combined server-side auth check
 */
export function handleServerAuthCheck(
  isAuthenticated: boolean,
  userRole: string | undefined,
  allowedRoles: string[],
  currentPath: string
) {
  // Check authentication
  const authResult = handleServerAuth(isAuthenticated, currentPath)
  if (authResult) {
    return authResult
  }

  // Check authorization
  const authzResult = handleServerAuthz(userRole, allowedRoles)
  if (authzResult) {
    return authzResult
  }

  return null
}

// ============================================================================
// Error Page Components Helpers
// ============================================================================

export interface ErrorPageData {
  statusCode: PageErrorType
  title: string
  message: string
  action?: {
    label: string
    href: string
  }
}

/**
 * Get error page data based on status code
 */
export function getErrorPageData(statusCode: PageErrorType): ErrorPageData {
  switch (statusCode) {
    case '404':
      return {
        statusCode: '404',
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist or has been moved.',
        action: {
          label: 'Go to Dashboard',
          href: '/dashboard',
        },
      }

    case '401':
      return {
        statusCode: '401',
        title: 'Unauthorized',
        message: 'You need to log in to access this page.',
        action: {
          label: 'Go to Login',
          href: '/login',
        },
      }

    case '403':
      return {
        statusCode: '403',
        title: 'Access Denied',
        message: 'You do not have permission to access this page.',
        action: {
          label: 'Go to Dashboard',
          href: '/dashboard',
        },
      }

    case '500':
      return {
        statusCode: '500',
        title: 'Server Error',
        message: 'An unexpected error occurred. Please try again later.',
        action: {
          label: 'Go to Dashboard',
          href: '/dashboard',
        },
      }

    default:
      return {
        statusCode: '500',
        title: 'Error',
        message: 'An unexpected error occurred.',
        action: {
          label: 'Go to Dashboard',
          href: '/dashboard',
        },
      }
  }
}

// ============================================================================
// Route Protection Utilities
// ============================================================================

export interface RouteProtectionConfig {
  requireAuth: boolean
  allowedRoles?: string[]
  redirectOnFail?: string
}

/**
 * Create a route protection hook
 */
export function createRouteProtection(config: RouteProtectionConfig) {
  return function useRouteProtection(
    isAuthenticated: boolean,
    userRole: string | undefined,
    isLoading: boolean = false
  ): void {
    const router = useRouter()

    useEffect(() => {
      if (isLoading) {
        return
      }

      // Check authentication
      if (config.requireAuth && !isAuthenticated) {
        const returnUrl = router.asPath
        const redirectUrl = config.redirectOnFail || '/login'
        router.push(`${redirectUrl}?returnUrl=${encodeURIComponent(returnUrl)}`)
        return
      }

      // Check authorization
      if (
        config.allowedRoles &&
        userRole &&
        !config.allowedRoles.includes(userRole)
      ) {
        const redirectUrl = config.redirectOnFail || '/dashboard'
        router.push(redirectUrl)
        return
      }
    }, [isAuthenticated, userRole, isLoading, router])
  }
}

/**
 * Common route protections
 */
export const routeProtections = {
  /** Requires authentication only */
  authenticated: createRouteProtection({
    requireAuth: true,
  }),

  /** Requires manager or admin role */
  manager: createRouteProtection({
    requireAuth: true,
    allowedRoles: ['manager', 'admin'],
  }),

  /** Requires admin role */
  admin: createRouteProtection({
    requireAuth: true,
    allowedRoles: ['admin'],
  }),

  /** Requires employee role (any authenticated user) */
  employee: createRouteProtection({
    requireAuth: true,
    allowedRoles: ['employee', 'manager', 'admin'],
  }),
}
