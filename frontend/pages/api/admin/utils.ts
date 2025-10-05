import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/auth'
import { getUserProfile, isAdminOrHr } from '@/lib/permissions'

interface AdminGuardSuccess {
  user: Awaited<ReturnType<typeof getUser>>
  profile: NonNullable<Awaited<ReturnType<typeof getUserProfile>>>
  adminClient: ReturnType<typeof createAdminClient>
  supabase: ReturnType<typeof createServerClient>
}

interface AdminGuardFailure {
  errorResponse: ReturnType<typeof NextResponse.json>
}

type AdminGuardResult = AdminGuardSuccess | AdminGuardFailure

export async function requireAdminOrHr(request: NextRequest | Request): Promise<AdminGuardResult> {
  const user = await getUser(request as NextRequest)

  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      ),
    }
  }

  const supabase = createServerClient()
  const profile = await getUserProfile(supabase, user.id)

  if (!profile || !isAdminOrHr(profile.role)) {
    return {
      errorResponse: NextResponse.json(
        { error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Access denied' } },
        { status: 403 }
      ),
    }
  }

  const adminClient = createAdminClient()

  return { user, profile, adminClient, supabase }
}

// Default export required for Next.js API route validation
export default function handler() {
  return new Response('Utility file - not a route', { status: 404 })
}
