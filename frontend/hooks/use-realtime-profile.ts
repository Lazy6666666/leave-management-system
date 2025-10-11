import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getBrowserClient } from '@/lib/supabase-client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type ProfilePayload = RealtimePostgresChangesPayload<Database['public']['Tables']['profiles']['Row']>

/**
 * Hook to subscribe to real-time profile updates
 * Automatically invalidates user profile queries when profiles table changes
 *
 * @param userId - The user ID to watch for updates
 * @returns void
 */
export function useRealtimeProfile(userId?: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const supabase = getBrowserClient()
    if (!supabase) return

    let channel: RealtimeChannel | null = null

    const setupRealtimeSubscription = async () => {
      try {
        // Subscribe to profile changes for this specific user
        channel = supabase
          .channel(`profile-changes-${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${userId}` // Only watch this user's profile
            },
            (payload: ProfilePayload) => {
              console.log('Profile change detected:', payload)

              // Invalidate all queries related to this user's profile
              queryClient.invalidateQueries({ queryKey: ['userProfile', userId] })

              // Also invalidate admin-users query if role changed
              if (payload.eventType === 'UPDATE' && payload.new && 'role' in payload.new) {
                queryClient.invalidateQueries({ queryKey: ['admin-users'] })
                queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
              }
            }
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              console.log(`Realtime subscription active for user: ${userId}`)
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Failed to subscribe to profile changes')
            }
          })
      } catch (error) {
        console.error('Error setting up realtime subscription:', error)
      }
    }

    setupRealtimeSubscription()

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        console.log(`Cleaning up realtime subscription for user: ${userId}`)
        supabase.removeChannel(channel)
      }
    }
  }, [userId, queryClient])
}
