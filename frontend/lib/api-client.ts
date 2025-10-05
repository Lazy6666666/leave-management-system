/**
 * API Client with Error Handling
 * 
 * Provides a centralized API client with built-in error handling,
 * retry logic, and type safety for making API requests.
 */

import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ErrorCode,
  logError,
  withRetry,
} from './errors'

// ============================================================================
// Types
// ============================================================================

export interface ApiClientConfig {
  baseUrl?: string
  headers?: Record<string, string>
  timeout?: number
  retries?: number
}

export interface RequestConfig extends RequestInit {
  timeout?: number
  retries?: number
  skipErrorHandling?: boolean
}

export interface ApiResponse<T> {
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
}

// ============================================================================
// API Client Class
// ============================================================================

export class ApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>
  private timeout: number
  private retries: number

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || ''
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    }
    this.timeout = config.timeout || 30000 // 30 seconds
    this.retries = config.retries || 3
  }

  /**
   * Make a GET request
   */
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' })
  }

  /**
   * Make a POST request
   */
  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Make a PUT request
   */
  async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' })
  }

  /**
   * Make a request with error handling and retry logic
   */
  private async request<T>(url: string, config: RequestConfig = {}): Promise<T> {
    const fullUrl = this.baseUrl + url
    const timeout = config.timeout || this.timeout
    const retries = config.retries !== undefined ? config.retries : this.retries
    const skipErrorHandling = config.skipErrorHandling || false

    // Prepare headers
    const headers = {
      ...this.defaultHeaders,
      ...config.headers,
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      ...config,
      headers,
    }

    // Create request function with timeout
    const makeRequest = async (): Promise<T> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        const response = await fetch(fullUrl, {
          ...fetchOptions,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Handle response
        if (!response.ok) {
          await this.handleErrorResponse(response, skipErrorHandling)
        }

        // Parse response
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const data = await response.json()
          return data.data !== undefined ? data.data : data
        }

        // Return empty object for 204 No Content
        if (response.status === 204) {
          return {} as T
        }

        // Return text for non-JSON responses
        return (await response.text()) as unknown as T
      } catch (error) {
        clearTimeout(timeoutId)

        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          throw new AppError(
            ErrorCode.TIMEOUT_ERROR,
            `Request timeout after ${timeout}ms`,
            408
          )
        }

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new AppError(
            ErrorCode.NETWORK_ERROR,
            'Network error. Please check your connection',
            0
          )
        }

        throw error
      }
    }

    // Execute with retry logic
    try {
      if (retries > 0 && config.method !== 'POST') {
        // Don't retry POST requests by default to avoid duplicate submissions
        return await withRetry(makeRequest, {
          maxRetries: retries,
          delayMs: 1000,
          backoff: 'exponential',
          onRetry: (attempt, error) => {
            logError(error, {
              context: 'api_client_retry',
              attempt,
              url: fullUrl,
              method: config.method,
            })
          },
        })
      }

      return await makeRequest()
    } catch (error) {
      // Log the error
      logError(error, {
        context: 'api_client_error',
        url: fullUrl,
        method: config.method,
        status: error instanceof AppError ? error.statusCode : undefined,
      })

      throw error
    }
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(
    response: Response,
    skipErrorHandling: boolean
  ): Promise<never> {
    let errorData: { 
      message?: string; 
      code?: string; 
      error?: { 
        message?: string; 
        code?: string; 
        details?: Record<string, unknown> 
      } 
    }

    try {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        errorData = await response.json()
      } else {
        errorData = { error: { message: await response.text() } }
      }
    } catch {
      errorData = { error: { message: response.statusText } }
    }

    const errorMessage =
      errorData?.error?.message ||
      errorData?.message ||
      `Request failed with status ${response.status}`
    const errorCode =
      errorData?.error?.code || this.getErrorCodeFromStatus(response.status)
    const errorDetails = errorData?.error?.details

    // Skip error handling if requested (for custom handling)
    if (skipErrorHandling) {
      throw new Error(errorMessage)
    }

    // Map status codes to error types
    switch (response.status) {
      case 400:
        throw new ValidationError(errorMessage, errorDetails)
      case 401:
        throw new AuthenticationError(errorMessage, errorDetails)
      case 403:
        throw new AuthorizationError(errorMessage, errorDetails)
      case 404:
        throw new NotFoundError('Resource', errorDetails)
      case 409:
        throw new AppError(
          ErrorCode.DATABASE_CONSTRAINT,
          errorMessage,
          409,
          errorDetails
        )
      case 429:
        throw new AppError(
          ErrorCode.RATE_LIMIT_EXCEEDED,
          errorMessage,
          429,
          errorDetails
        )
      case 500:
      case 502:
      case 503:
      case 504:
        throw new AppError(
          ErrorCode.INTERNAL_ERROR,
          errorMessage,
          response.status,
          errorDetails
        )
      default:
        throw new AppError(errorCode as ErrorCode, errorMessage, response.status, errorDetails)
    }
  }

  /**
   * Get error code from HTTP status
   */
  private getErrorCodeFromStatus(status: number): ErrorCode {
    switch (status) {
      case 400:
        return ErrorCode.VALIDATION_ERROR
      case 401:
        return ErrorCode.AUTH_UNAUTHORIZED
      case 403:
        return ErrorCode.AUTH_FORBIDDEN
      case 404:
        return ErrorCode.DATABASE_NOT_FOUND
      case 429:
        return ErrorCode.RATE_LIMIT_EXCEEDED
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorCode.INTERNAL_ERROR
      default:
        return ErrorCode.INTERNAL_ERROR
    }
  }
}

// ============================================================================
// Default API Client Instance
// ============================================================================

export const apiClient = new ApiClient({
  baseUrl: '/api',
  timeout: 30000,
  retries: 3,
})

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Make a GET request
 */
export async function get<T>(url: string, config?: RequestConfig): Promise<T> {
  return apiClient.get<T>(url, config)
}

/**
 * Make a POST request
 */
export async function post<T>(
  url: string,
  data?: unknown,
  config?: RequestConfig
): Promise<T> {
  return apiClient.post<T>(url, data, config)
}

/**
 * Make a PUT request
 */
export async function put<T>(
  url: string,
  data?: unknown,
  config?: RequestConfig
): Promise<T> {
  return apiClient.put<T>(url, data, config)
}

/**
 * Make a PATCH request
 */
export async function patch<T>(
  url: string,
  data?: unknown,
  config?: RequestConfig
): Promise<T> {
  return apiClient.patch<T>(url, data, config)
}

/**
 * Make a DELETE request
 */
export async function del<T>(url: string, config?: RequestConfig): Promise<T> {
  return apiClient.delete<T>(url, config)
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate the number of business days (weekdays) between two dates
 * @param startDate - Start date in YYYY-MM-DD format or Date object
 * @param endDate - End date in YYYY-MM-DD format or Date object
 * @returns Number of business days (excluding weekends)
 */
export function calculateBusinessDays(
  startDate: string | Date,
  endDate: string | Date
): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  // Swap dates if start is after end
  let fromDate = new Date(start)
  let toDate = new Date(end)
  if (fromDate > toDate) {
    ;[fromDate, toDate] = [toDate, fromDate]
  }

  let businessDays = 0
  const currentDate = new Date(fromDate)

  // Iterate through each day and count weekdays
  while (currentDate <= toDate) {
    const dayOfWeek = currentDate.getDay()
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return businessDays
}
