#!/usr/bin/env node

/**
 * Simple Test User Seeder using Supabase REST API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment
function loadEnv() {
  const envPath = path.join(__dirname, '../backend/.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });
  
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// Read and execute SQL
const sqlContent = fs.readFileSync(path.join(__dirname, 'seed-test-users-direct.sql'), 'utf8');

const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);

const postData = JSON.stringify({ query: sqlContent });

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Prefer': 'return=representation'
  }
};

console.log('🚀 Executing SQL to create test users...\n');

const req = https.request(url, options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Test users created successfully!\n');
      console.log('📋 Test User Credentials:');
      console.log('  admin@test.com      | Password: Test123! | Role: admin');
      console.log('  hr@test.com         | Password: Test123! | Role: hr');
      console.log('  manager@test.com    | Password: Test123! | Role: manager');
      console.log('  employee1@test.com  | Password: Test123! | Role: employee');
      console.log('  employee2@test.com  | Password: Test123! | Role: employee');
      console.log('  employee3@test.com  | Password: Test123! | Role: employee');
      console.log('\n💡 Login at: http://localhost:3000/login\n');
    } else {
      console.error('❌ Error:', res.statusCode);
      console.error(body);
      console.log('\n📝 Please run the SQL manually in Supabase Dashboard:');
      console.log('   https://supabase.com/dashboard/project/ofkcmmwibufljpemmdde/sql');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\n📝 Please run the SQL manually in Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/ofkcmmwibufljpemmdde/sql');
});

req.write(postData);
req.end();
