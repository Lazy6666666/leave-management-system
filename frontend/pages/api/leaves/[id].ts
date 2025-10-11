import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase-server'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Leave request ID is required' })
  }

  // Only allow PATCH, GET, and DELETE methods
  if (req.method !== 'PATCH' && req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
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

    // GET - Fetch leave request
    if (req.method === 'GET') {
      const { data: leave, error: fetchError } = await supabase
        .from('leaves')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        return res.status(404).json({ error: 'Leave request not found' })
      }

      // Check if user has access (own request or manager/admin)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isOwner = leave.requester_id === user.id
      const isManagerOrAdmin = profile?.role === 'manager' || profile?.role === 'admin' || profile?.role === 'hr'

      if (!isOwner && !isManagerOrAdmin) {
        return res.status(403).json({ error: 'Access denied' })
      }

      return res.status(200).json(leave)
    }

    // PATCH - Update leave request
    if (req.method === 'PATCH') {
      const { leave_type_id, start_date, end_date, reason } = req.body

      // Validate required fields
      if (!leave_type_id || !start_date || !end_date || !reason) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Fetch existing leave request
      const { data: existingLeave, error: fetchError } = await supabase
        .from('leaves')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        return res.status(404).json({ error: 'Leave request not found' })
      }

      // Check if user is the owner
      if (existingLeave.requester_id !== user.id) {
        return res.status(403).json({ error: 'You can only edit your own leave requests' })
      }

      // Check if request is pending
      if (existingLeave.status !== 'pending') {
        return res.status(400).json({ 
          error: 'Only pending leave requests can be edited' 
        })
      }

      // Validate dates
      const startDate = new Date(start_date)
      const endDate = new Date(end_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (startDate < today) {
        return res.status(400).json({ error: 'Start date cannot be in the past' })
      }

      if (endDate < startDate) {
        return res.status(400).json({ error: 'End date must be on or after start date' })
      }

      // Calculate days count
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

      // Update leave request with audit trail
      const { data: updatedLeave, error: updateError } = await supabase
        .from('leaves')
        .update({
          leave_type_id,
          start_date,
          end_date,
          reason,
          days_count: diffDays,
          last_modified_at: new Date().toISOString(),
          last_modified_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
        return res.status(500).json({ error: 'Failed to update leave request' })
      }

      return res.status(200).json({
        message: 'Leave request updated successfully',
        data: updatedLeave,
      })
    }

    // DELETE - Delete leave request
    if (req.method === 'DELETE') {
      // Fetch existing leave request
      const { data: existingLeave, error: fetchError } = await supabase
        .from('leaves')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) {
        return res.status(404).json({ error: 'Leave request not found' })
      }

      // Check if user is the owner
      if (existingLeave.requester_id !== user.id) {
        return res.status(403).json({ error: 'You can only delete your own leave requests' })
      }

      // Check if request is pending
      if (existingLeave.status !== 'pending') {
        return res.status(400).json({
          error: 'Only pending leave requests can be deleted'
        })
      }

      // Delete associated documents first (if any)
      const { error: docsDeleteError } = await supabase
        .from('leave_documents')
        .delete()
        .eq('leave_request_id', id)

      if (docsDeleteError) {
        console.error('Error deleting documents:', docsDeleteError)
        // Continue with leave deletion even if document deletion fails
      }

      // Delete the leave request
      const { error: deleteError } = await supabase
        .from('leaves')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Delete error:', deleteError)
        return res.status(500).json({ error: 'Failed to delete leave request' })
      }

      return res.status(200).json({
        message: 'Leave request deleted successfully',
      })
    }
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
