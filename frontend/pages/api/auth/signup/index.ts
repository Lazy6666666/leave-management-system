import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase-server';
import type { RegisterPayload } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
  }

  try {
    const { email, password, confirmPassword, fullName, department, role }: RegisterPayload = req.body;

    // Validation
    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Email, password, and full name are required' }
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Passwords do not match' }
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters' }
      });
    }

    const supabase = createClient(req, res);

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          department: department || null,
        },
      },
    });

    if (authError) {
      return res.status(400).json({
        error: { code: 'AUTH_SIGNUP_ERROR', message: authError.message }
      });
    }

    if (!authData.user) {
      return res.status(400).json({
        error: { code: 'AUTH_SIGNUP_ERROR', message: 'Failed to create user' }
      });
    }

    // Update profile with role and department
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        department: department || null,
        role: role || 'employee',
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't fail the signup if profile update fails
    }

    return res.status(201).json({
      user: authData.user,
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
    });
  }
}
