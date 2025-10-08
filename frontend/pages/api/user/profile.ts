import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient as createServerClient } from '@/lib/supabase-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    const supabase = createServerClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const { data: profile, error } = await supabase
      .from('employees')
      .select('supabase_id, email, name, role, department, profile_image_url, is_active')
      .eq('supabase_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return res.status(400).json({ error: { code: 'DATABASE_ERROR', message: error.message } });
    }

    if (!profile) {
      return res.status(404).json({ error: { code: 'PROFILE_NOT_FOUND', message: 'User profile not found' } });
    }

    return res.status(200).json({
      id: profile.supabase_id,
      full_name: profile.name,
      email: profile.email,
      role: profile.role,
      department: profile.department,
      photo_url: profile.profile_image_url,
      is_active: profile.is_active,
    });
  } catch (error) {
    console.error('API error fetching user profile:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unexpected error',
      },
    });
  }
}
