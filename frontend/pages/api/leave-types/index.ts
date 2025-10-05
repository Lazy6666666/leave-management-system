import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase-server';
import { getUserProfile, isAdminOrHr } from '@/lib/permissions';
import type { LeaveType } from '@/types';
import { TypedSupabaseClient } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({
        error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' }
      });
    }

    const profile = await getUserProfile(supabase, user.id);
    
    if (!profile || !isAdminOrHr(profile.role)) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Admin or HR role required' }
      });
    }

    if (req.method === 'GET') {
      return handleGet(req, res, supabase);
    } else if (req.method === 'POST') {
      return handlePost(req, res, supabase);
    } else {
      return res.status(405).json({
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
      });
    }
  } catch (error) {
    console.error('Leave types API error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, supabase: TypedSupabaseClient) {
  const { include_inactive } = req.query;
  
  let query = supabase
    .from('leave_types')
    .select('*')
    .order('name', { ascending: true });

  // By default, only show active leave types
  if (include_inactive !== 'true') {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: error.message }
    });
  }

  return res.status(200).json({
    leave_types: data ?? [],
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, supabase: TypedSupabaseClient) {
  const { name, description, default_allocation_days, is_active = true } = req.body;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Leave type name is required'
      }
    });
  }

  if (default_allocation_days === undefined || default_allocation_days < 0) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Default allocation days must be a positive number'
      }
    });
  }

  // Check for duplicate name
  const { data: existing } = await supabase
    .from('leave_types')
    .select('id')
    .ilike('name', name.trim())
    .single();

  if (existing) {
    return res.status(400).json({
      error: {
        code: 'DUPLICATE_ERROR',
        message: 'A leave type with this name already exists'
      }
    });
  }

  // Create leave type
  const { data, error } = await supabase
    .from('leave_types')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      default_allocation_days,
      is_active,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: error.message }
    });
  }

  return res.status(201).json({
    leave_type: data,
    message: 'Leave type created successfully',
  });
}
