import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getUserProfile, isAdminOrHr } from '@/lib/permissions';
import { createUserSchema } from '@/lib/schemas/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    const supabase = createServerClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const profile = await getUserProfile(supabase, user.id);

    if (!profile || !isAdminOrHr(profile.role)) {
      return res.status(403).json({ error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Access denied' } });
    }

    const parsed = createUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.flatten() } });
    }

    const { email, password, full_name, role, department, is_active } = parsed.data;

    const adminClient = createAdminClient();

    // 1. Create user in Supabase Auth
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email for admin-created users
      user_metadata: { full_name, department, role, is_active }, // Store initial profile data in user_metadata
    });

    if (authError) {
      return res.status(400).json({ error: { code: 'AUTH_ERROR', message: authError.message } });
    }

    if (!authUser.user) {
      return res.status(500).json({ error: { code: 'USER_CREATION_FAILED', message: 'Failed to create auth user' } });
    }

    // 2. Create profile in public.employees table
    // Note: The handle_new_user trigger in 001_initial_schema.sql creates a profile in the 'profiles' table.
    // However, we discovered the actual table is 'employees'.
    // We need to ensure the 'employees' table is populated correctly.
    // If the trigger is still creating in 'profiles', we might need to adjust the trigger or directly insert here.
    // For now, assuming the trigger is either updated or we need to insert directly into 'employees'.
    // Let's assume the trigger is not creating the 'employees' entry and we need to do it manually here.
    // We need to get the next available ID for the 'employees' table if it's not UUID based.
    // Re-checking the schema, 'employees.id' is bigint and default is nextval('employees_id_seq'::regclass).
    // 'employees.supabase_id' is uuid and references auth.users.id.
    // So, we should insert into employees using the authUser.user.id as supabase_id.

    const { error: profileInsertError } = await adminClient
      .from('employees')
      .insert({
        supabase_id: authUser.user.id,
        email: authUser.user.email,
        name: full_name,
        role,
        department,
        is_active,
      });

    if (profileInsertError) {
      // If profile creation fails, attempt to delete the auth user to prevent orphaned records
      await adminClient.auth.admin.deleteUser(authUser.user.id);
      return res.status(500).json({ error: { code: 'PROFILE_CREATION_FAILED', message: profileInsertError.message } });
    }

    // 3. Log audit event
    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      table_name: 'employees',
      record_id: authUser.user.id,
      action: 'INSERT',
      new_values: { email, full_name, role, department, is_active },
    });

    return res.status(200).json({ success: true, user_id: authUser.user.id });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unexpected error',
      },
    });
  }
}
