import { getBrowserClient } from './supabase-client';

interface LeaveUpdatePayload {
  eventType: string;
  new: any;
  old: any;
  errors: any;
}

// Function to handle real-time updates for leave requests
const handleLeaveUpdate = (payload: LeaveUpdatePayload) => {
  console.log('Realtime leave update received:', payload);
  // In a real application, this would dispatch to a state management system
  // or trigger a UI re-render.
};

// Function to subscribe to leave request changes
export const subscribeToLeaveRequests = (userId?: string, department?: string) => {
  const supabase = getBrowserClient();

  if (!supabase) {
    console.error('Supabase client not available for real-time subscriptions.');
    return null;
  }

  let channel = supabase.channel('leave_requests_channel');

  // Basic subscription to all leave request changes
  channel = channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'leaves' },
    handleLeaveUpdate
  );

  // TODO: Implement more granular filtering based on userId and department
  // This would involve creating specific RLS policies for real-time or more complex channel logic

  channel.subscribe((status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED') => {
    if (status === 'SUBSCRIBED') {
      console.log('Subscribed to leave requests channel');
    } else if (status === 'CHANNEL_ERROR') {
      console.error('Error subscribing to leave requests channel');
    }
  });

  return channel;
};

// Function to unsubscribe from a channel
export const unsubscribeFromChannel = (channel: any) => {
  const supabase = getBrowserClient();
  if (supabase && channel) {
    supabase.removeChannel(channel);
    console.log('Unsubscribed from channel', channel.topic);
  }
};