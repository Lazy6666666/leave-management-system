import type { UserRole } from '@/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  fullName: string
  email: string
  password: string
  department?: string
  role?: UserRole
}
