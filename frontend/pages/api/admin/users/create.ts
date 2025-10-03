import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } })
  }

  try {
    // Create authenticated supabase client
    const supabase = createServerSupabaseClient({ req, res })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } })
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return res.status(403).json({ error: { message: 'Profile not found' } })
    }

    // Check if user is admin or HR
    if (profile.role !== 'admin' && profile.role !== 'hr') {
      return res.status(403).json({ error: { message: 'Insufficient permissions' } })
    }

    const { email, fullName, department, role } = req.body

    // Validate input
    if (!email || !fullName || !department || !role) {
      return res.status(400).json({ 
        error: { message: 'Missing required fields: email, fullName, department, role' } 
      })
    }

    // Validate role
    const validRoles = ['employee', 'manager', 'hr']
    if (profile.role === 'admin') {
      validRoles.push('admin')
    }
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: { message: 'Invalid role' } })
    }

    // Create service role client for admin operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create the user account
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-12), // Temporary password
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        department,
        role
      }
    })

    if (createError) {
      return res.status(400).json({ error: { message: createError.message } })
    }

    // Update the profile with the correct role
    const { error: profileUpdateError } = await adminSupabase
      .from('profiles')
      .update({
        full_name: fullName,
        department,
        role
      })
      .eq('id', newUser.user.id)

    if (profileUpdateError) {
      console.error('Profile update error:', profileUpdateError)
      // Don't fail the request, just log the error
    }

    // Send password reset email so user can set their own password
    const { error: resetError } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    if (resetError) {
      console.error('Password reset email error:', resetError)
      // Don't fail the request, just log the error
    }

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name: fullName,
        department,
        role
      }
    })

  } catch (error) {
    console.error('Create user error:', error)
    return res.status(500).json({ 
      error: { message: 'Internal server error' } 
    })
  }
}