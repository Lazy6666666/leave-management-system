import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase-server';
import { getUserProfile, isManagerOrHigher } from '@/lib/permissions';
import type { LeaveStatus } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
    });
  }

  try {
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({
        error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' }
      });
    }

    const profile = await getUserProfile(supabase, user.id);

    if (!profile || !isManagerOrHigher(profile.role)) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only managers and above can approve/reject leave requests'
        }
      });
    }

    const { leave_id, status, comments } = req.body;

    // Validation
    if (!leave_id || !status) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Leave ID and status are required' }
      });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Status must be approved or rejected' }
      });
    }

    // Get the leave request
    const { data: leave, error: leaveError } = await supabase
      .from('leaves')
      .select('*, requester:profiles!leaves_requester_id_fkey(id, manager_id)')
      .eq('id', leave_id)
      .single();

    if (leaveError || !leave) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Leave request not found' }
      });
    }

    // Check if user is authorized to approve this leave
    // Admin/HR can approve any leave, managers can approve their team's leaves
    const canApprove =
      profile.role === 'admin' ||
      profile.role === 'hr' ||
      (profile.role === 'manager' && leave.requester?.manager_id === user.id);

    if (!canApprove) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You are not authorized to approve this leave request'
        }
      });
    }

    // Check if leave is in pending status
    if (leave.status !== 'pending') {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: `Leave request is already ${leave.status}`
        }
      });
    }

    // Update leave request
    const { data: updatedLeave, error: updateError } = await supabase
      .from('leaves')
      .update({
        status: status as LeaveStatus,
        approver_id: user.id,
        comments: comments || null,
        approved_at: new Date().toISOString(),
      })
      .eq('id', leave_id)
      .select(`
        *,
        requester:profiles!leaves_requester_id_fkey(id, full_name, department, photo_url),
        leave_type:leave_types(id, name, description),
        approver:profiles!leaves_approver_id_fkey(id, full_name)
      `)
      .single();

    if (updateError) {
      return res.status(400).json({
        error: { code: 'DATABASE_ERROR', message: updateError.message }
      });
    }

    // Update leave balance if approved
    if (status === 'approved') {
      const { error: balanceError } = await supabase.rpc('update_leave_balance', {
        p_user_id: leave.requester_id,
        p_leave_type_id: leave.leave_type_id,
        p_days: leave.days_count,
      });

      if (balanceError) {
        console.error('Balance update error:', balanceError);
        // Don't fail the approval if balance update fails
      }
    }

    return res.status(200).json({
      leave: updatedLeave,
      message: `Leave request ${status} successfully`,
    });
  } catch (error) {
    console.error('Leave approval error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
    });
  }
}
