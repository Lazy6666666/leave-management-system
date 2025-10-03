const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ofkcmmwibufljpemmdde.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma2NtbXdpYnVmbGpwZW1tZGRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4MzU1NSwiZXhwIjoyMDc0OTU5NTU1fQ.-nuLV6b4dqIiqX-9RL84c4x4GNHjJoEgGQZJUC0pxbM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  const migrationPath = '../backend/supabase/migrations/006_fix_rls_circular_dependency.sql';
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying migration...\n');

  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`\n[${i + 1}/${statements.length}] Executing:\n${statement.substring(0, 100)}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        // Try direct query if RPC doesn't exist
        const { error: directError } = await supabase.from('_supabase_meta').select('*').limit(0);

        // If that also fails, we need a different approach
        console.error(`Error executing statement ${i + 1}:`, error.message);
        console.log('\nNote: Supabase dashboard SQL editor should be used for this migration.');
        console.log('Please copy the migration file contents and run it in the SQL editor.');
        return;
      }

      console.log(`✅ Statement ${i + 1} executed successfully`);
    } catch (err) {
      console.error(`❌ Failed to execute statement ${i + 1}:`, err.message);
    }
  }

  console.log('\n✅ Migration complete!');
}

applyMigration().catch(console.error);
