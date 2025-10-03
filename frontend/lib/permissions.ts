import type { SupabaseClient } from '@supabase/supabase-js'

import type { UserRole } from '@/types'

export interface UserProfileRole {
  id: string
  role: UserRole
  department?: string | null
}

export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfileRole | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, department')
    .eq('id', userId)
    .single<UserProfileRole>()

  if (error) {
    return null
  }

  return data
}

export function hasRequiredRole(role: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(role)
}

export function isAdminOrHr(role: UserRole): boolean {
  return hasRequiredRole(role, ['admin', 'hr'])
}

export function isManagerOrHigher(role: UserRole): boolean {
  return hasRequiredRole(role, ['manager', 'admin', 'hr'])
}
