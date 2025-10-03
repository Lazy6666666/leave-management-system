import { getBrowserClient } from '@/lib/supabase-client'

const supabase = getBrowserClient()

export interface LeaveRequestData {
  leave_type_id: string
  start_date: string
  end_date: string
  reason?: string
  metadata?: Record<string, any>
}

export interface LeaveResponse {
  id: string
  requester_id: string
  start_date: string
  end_date: string
  leave_type_id: string
  days_count: number
  reason?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  approver_id?: string
  comments?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export class ApiClient {
  // Authentication
  static async signUp(data: {
    email: string
    password: string
    fullName: string
    department?: string
  }) {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error.message)
    }

    return response.json()
  }

  static async signIn(data: { email: string; password: string }) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error.message)
    }

    return response.json()
  }

  // Leave Management
  static async getLeaves(filters?: {
    status?: string
    limit?: number
    offset?: number
  }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const response = await fetch(`/api/leaves?${params}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error.message)
    }

    return response.json()
  }

  static async createLeaveRequest(data: LeaveRequestData) {
    const response = await fetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error.message)
    }

    return response.json()
  }

  static async approveLeave(id: string, comments?: string) {
    const response = await fetch('/api/leaves/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'approved', comments }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error.message)
    }

    return response.json()
  }

  static async rejectLeave(id: string, comments?: string) {
    const response = await fetch('/api/leaves/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'rejected', comments }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error.message)
    }

    return response.json()
  }

  // Utility functions
  static calculateBusinessDays(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    let businessDays = 0

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Not Sunday or Saturday
        businessDays++
      }
    }

    return businessDays
  }
}

// Export utility function separately for easier testing
export function calculateBusinessDays(startDate: string, endDate: string): number {
  return ApiClient.calculateBusinessDays(startDate, endDate)
}

export default ApiClient
