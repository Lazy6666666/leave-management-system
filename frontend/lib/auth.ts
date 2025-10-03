import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase-server';

export async function getUser(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await getUser(request);

  if (!user) {
    return {
      error: NextResponse.json(
        { error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      ),
      user: null,
    };
  }

  return { error: null, user };
}
