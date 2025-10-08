import { useQuery } from '@tanstack/react-query';
import { getBrowserClient } from '@/lib/supabase-client';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'employee' | 'manager' | 'admin' | 'hr';
  department?: string | null;
  photo_url?: string | null;
}

async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const supabase = getBrowserClient();
  if (!supabase) throw new Error('Supabase client not available');

  try {
    const { data, error } = await supabase
      .rpc('get_user_profile_with_email', { p_user_id: userId })
      .single();

    if (error && error.code !== '404') {
      throw error;
    }

    if (data) {
      return {
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        role: data.role as 'employee' | 'manager' | 'admin' | 'hr',
        department: data.department,
        photo_url: data.photo_url,
      };
    }
  } catch (rpcError) {
    console.warn('RPC call failed, attempting direct fetch:', rpcError);
  }

  // Fallback: direct fetch from profiles table and get email from auth.user()
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role, department, photo_url')
    .eq('id', userId)
    .single();

  if (profileError) {
    throw profileError;
  }

  const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser();

  if (authUserError) {
    throw authUserError;
  }

  return {
    id: profileData.id,
    full_name: profileData.full_name,
    email: authUser?.email || '',
    role: profileData.role as 'employee' | 'manager' | 'admin' | 'hr',
    department: profileData.department,
    photo_url: profileData.photo_url,
  };
}

export function useUserProfile(userId?: string | null) {
  return useQuery<UserProfile>({
    queryKey: ['userProfile', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId, // Only run the query if userId is available
  });
}
