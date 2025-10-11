import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase-server';
import { getUserProfile, isAdminOrHr } from '@/lib/permissions';
import { TypedSupabaseClient } from '@/lib/types';
import type { TablesUpdate } from '@/lib/database.types';

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

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Leave type ID is required' }
      });
    }

    if (req.method === 'PATCH') {
      return handlePatch(req, res, supabase, id);
    } else if (req.method === 'DELETE') {
      return handleDelete(req, res, supabase, id);
    } else {
      return res.status(405).json({
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
      });
    }
  } catch (error) {
    console.error('Leave type API error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
    });
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse, supabase: TypedSupabaseClient, id: string) {
  const { name, description, default_allocation_days, is_active } = req.body;

  // Build update object
  const updates: TablesUpdate<'leave_types'> = {};

  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Leave type name cannot be empty' }
      });
    }

    // Check for duplicate name (excluding current record)
    const { data: existing } = await supabase
      .from('leave_types')
      .select('id')
      .ilike('name', name.trim())
      .neq('id', id)
      .single();

    if (existing) {
      return res.status(400).json({
        error: { code: 'DUPLICATE_ERROR', message: 'A leave type with this name already exists' }
      });
    }

    updates.name = name.trim();
  }

  if (description !== undefined) {
    updates.description = description?.trim() || null;
  }

  if (default_allocation_days !== undefined) {
    if (default_allocation_days < 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Default allocation days must be a positive number' }
      });
    }
    updates.default_allocation_days = default_allocation_days;
  }

  if (is_active !== undefined) {
    updates.is_active = is_active;
  }

  // Update leave type
  const { data, error } = await supabase
    .from('leave_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Leave type not found' }
      });
    }
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: error.message }
    });
  }

  return res.status(200).json({
    leave_type: data,
    message: 'Leave type updated successfully',
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, supabase: TypedSupabaseClient, id: string) {
  // Check if leave type is in use
  const { count, error: countError } = await supabase
    .from('leaves')
    .select('id', { count: 'exact', head: true })
    .eq('leave_type_id', id);

  if (countError) {
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: countError.message }
    });
  }

  if (count && count > 0) {
    return res.status(400).json({
      error: {
        code: 'IN_USE_ERROR',
        message: `Cannot delete leave type. It is currently used in ${count} leave request(s). Consider deactivating it instead.`
      }
    });
  }

  // Delete leave type
  const { error } = await supabase
    .from('leave_types')
    .delete()
    .eq('id', id);

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Leave type not found' }
      });
    }
    return res.status(400).json({
      error: { code: 'DATABASE_ERROR', message: error.message }
    });
  }

  return res.status(200).json({
    message: 'Leave type deleted successfully',
  });
}
