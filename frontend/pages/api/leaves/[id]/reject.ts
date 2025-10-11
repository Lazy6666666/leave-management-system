import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase-server'
import { getUserProfile, isManagerOrHigher } from '@/lib/permissions'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Leave request ID is required' })
  }

  try {
    const supabase = createClient(req, res)

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check if user is manager or admin
    const profile = await getUserProfile(supabase, user.id)
    
    if (!profile || !isManagerOrHigher(profile.role)) {
      return res.status(403).json({ error: 'Only managers and admins can reject leave requests' })
    }

    // Get rejection reason from request body
    const { reason } = req.body

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Rejection reason is required and must be at least 10 characters' 
      })
    }

    // Fetch existing leave request
    const { data: existingLeave, error: fetchError } = await supabase
      .from('leaves')
      .select('*, requester:employees!leaves_requester_id_fkey(id, name, department)')
      .eq('id', id)
      .single()

    if (fetchError) {
      return res.status(404).json({ error: 'Leave request not found' })
    }

    // Check if request is pending
    if (existingLeave.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Only pending leave requests can be rejected' 
      })
    }

    // For managers, verify they can reject this request (same department)
    if (profile.role === 'manager') {
      if (existingLeave.requester?.department !== profile.department) {
        return res.status(403).json({ 
          error: 'You can only reject leave requests from your department' 
        })
      }
    }

    // Reject leave request
    const { data: rejectedLeave, error: updateError } = await supabase
      .from('leaves')
      .update({
        status: 'rejected',
        approver_id: user.id,
        comments: reason,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        requester:employees!leaves_requester_id_fkey(id, name, department, photo_url),
        leave_type:leave_types(id, name, description),
        approver:employees!leaves_approver_id_fkey(id, name)
      `)
      .single()

    if (updateError) {
      console.error('Rejection error:', updateError)
      return res.status(500).json({ error: 'Failed to reject leave request' })
    }

    // TODO: Send notification to employee
    // This would integrate with the notification system

    return res.status(200).json({
      message: 'Leave request rejected successfully',
      data: rejectedLeave,
    })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
