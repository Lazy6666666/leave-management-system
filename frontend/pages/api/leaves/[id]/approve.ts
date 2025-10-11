import type { NextApiResponse } from 'next'
import {
  withMethods,
  withManagerAccess,
  type AuthorizedRequest,
} from '@/lib/api-middleware'
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
  handleSupabaseError,
} from '@/lib/errors'

async function approveLeaveHandler(
  req: AuthorizedRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    throw new ValidationError('Leave request ID is required')
  }

  // Fetch existing leave request
  const { data: existingLeave, error: fetchError } = await req.supabase
    .from('leaves')
    .select('*, requester:employees!leaves_requester_id_fkey(id, name, department)')
    .eq('id', id)
    .single()

  if (fetchError) {
    throw handleSupabaseError(fetchError)
  }

  if (!existingLeave) {
    throw new NotFoundError('Leave request')
  }

  // Check if request is pending
  if (existingLeave.status !== 'pending') {
    throw new ValidationError('Only pending leave requests can be approved')
  }

  // For managers, verify they can approve this request (same department)
  if (req.profile.role === 'manager') {
    if (existingLeave.requester?.department !== req.profile.department) {
      throw new AuthorizationError(
        'You can only approve leave requests from your department'
      )
    }
  }

  // Approve leave request
  const { data: approvedLeave, error: updateError } = await req.supabase
    .from('leaves')
    .update({
      status: 'approved',
      approver_id: req.user.id,
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
    throw handleSupabaseError(updateError)
  }

  // TODO: Send notification to employee
  // This would integrate with the notification system

  return res.status(200).json({
    message: 'Leave request approved successfully',
    data: approvedLeave,
  })
}

export default withMethods(['PATCH'], withManagerAccess(approveLeaveHandler))
