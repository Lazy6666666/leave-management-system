const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ofkcmmwibufljpemmdde.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma2NtbXdpYnVmbGpwZW1tZGRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODIxNDUyNywiZXhwIjoyMDQzNzkwNTI3fQ.VIBgjZvuJWYG0YbTRqTQdDJSgCRTikJxXzZpMU-6oPE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllUsers() {
  console.log('=== LISTING ALL USERS ===\n');

  // Get all users from auth
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Error listing users:', authError);
    return;
  }

  console.log(`Total users in auth.users: ${users.length}\n`);

  if (users.length === 0) {
    console.log('No users found. Need to create test users.');
    return;
  }

  for (const user of users) {
    console.log(`📧 ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.created_at}`);
    console.log(`   Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, department')
      .eq('id', user.id)
      .single();

    if (profile) {
      console.log(`   Profile: ✅ Role: ${profile.role}, Name: ${profile.full_name}`);
    } else {
      console.log(`   Profile: ❌ Missing`);
    }
    console.log('');
  }

  // Also check profiles table directly
  console.log('\n=== CHECKING PROFILES TABLE ===\n');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.error('Error listing profiles:', profilesError);
    return;
  }

  console.log(`Total profiles: ${profiles.length}`);
  for (const profile of profiles) {
    console.log(`   ${profile.id}: ${profile.role} - ${profile.full_name}`);
  }
}

listAllUsers().catch(console.error);
