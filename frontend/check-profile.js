const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ofkcmmwibufljpemmdde.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma2NtbXdpYnVmbGpwZW1tZGRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODIxNDUyNywiZXhwIjoyMDQzNzkwNTI3fQ.VIBgjZvuJWYG0YbTRqTQdDJSgCRTikJxXzZpMU-6oPE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  console.log('=== CHECKING USER PROFILES ===\n');

  // Get all test users
  const testEmails = [
    'admin@test.com',
    'hr@test.com',
    'manager@test.com',
    'employee1@test.com',
    'employee2@test.com',
    'employee3@test.com'
  ];

  for (const email of testEmails) {
    // Get user from auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      console.log(`❌ ${email}: User not found in auth.users`);
      continue;
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name, department, manager_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log(`❌ ${email}:`, profileError.message);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Has profile: NO`);
    } else {
      console.log(`✅ ${email}:`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Role: ${profile.role || 'NOT SET'}`);
      console.log(`   Full Name: ${profile.full_name || 'NOT SET'}`);
      console.log(`   Department: ${profile.department || 'NOT SET'}`);
    }
    console.log('');
  }
}

checkProfiles().catch(console.error);
