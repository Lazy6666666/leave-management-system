#!/usr/bin/env node

/**
 * Create Test Users Script
 * 
 * This script creates test users with different roles for development/testing.
 * It uses the Supabase Admin API to create users and set up their profiles.
 * 
 * Usage:
 *   node scripts/create-test-users.js
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.local
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from backend/.env.local
function loadEnv() {
  const envPath = path.join(__dirname, '../backend/.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: backend/.env.local not found');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });

  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Test users configuration
const TEST_USERS = [
  {
    email: 'admin@test.com',
    password: 'Test123!',
    full_name: 'Admin User',
    role: 'admin',
    department: 'Management'
  },
  {
    email: 'hr@test.com',
    password: 'Test123!',
    full_name: 'HR Manager',
    role: 'hr',
    department: 'Human Resources'
  },
  {
    email: 'manager@test.com',
    password: 'Test123!',
    full_name: 'Department Manager',
    role: 'manager',
    department: 'Engineering'
  },
  {
    email: 'employee1@test.com',
    password: 'Test123!',
    full_name: 'John Doe',
    role: 'employee',
    department: 'Engineering'
  },
  {
    email: 'employee2@test.com',
    password: 'Test123!',
    full_name: 'Jane Smith',
    role: 'employee',
    department: 'Marketing'
  },
  {
    email: 'employee3@test.com',
    password: 'Test123!',
    full_name: 'Bob Johnson',
    role: 'employee',
    department: 'Sales'
  }
];

// Helper function to make HTTPS requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Create a user via Supabase Admin API
async function createUser(userData) {
  try {
    console.log(`\n📝 Creating user: ${userData.email}`);
    
    // Create user in auth.users
    const authUser = await makeRequest('POST', '/auth/v1/admin/users', {
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name
      }
    });

    console.log(`✅ Auth user created with ID: ${authUser.id}`);

    // Update profile with role and department
    await makeRequest('PATCH', `/rest/v1/profiles?id=eq.${authUser.id}`, {
      full_name: userData.full_name,
      role: userData.role,
      department: userData.department
    });

    console.log(`✅ Profile updated with role: ${userData.role}`);

    return authUser;
  } catch (error) {
    if (error.message.includes('already been registered')) {
      console.log(`⚠️  User ${userData.email} already exists`);
      return null;
    }
    throw error;
  }
}

// Initialize leave balances for a user
async function initializeLeaveBalances(userId) {
  try {
    console.log(`📊 Initializing leave balances for user ${userId}`);
    
    // Get all active leave types
    const leaveTypes = await makeRequest('GET', '/rest/v1/leave_types?is_active=eq.true&select=id,default_allocation_days');
    
    const currentYear = new Date().getFullYear();
    
    // Create leave balance for each leave type
    for (const leaveType of leaveTypes) {
      await makeRequest('POST', '/rest/v1/leave_balances', {
        employee_id: userId,
        leave_type_id: leaveType.id,
        allocated_days: leaveType.default_allocation_days,
        used_days: 0,
        carried_forward_days: 0,
        year: currentYear
      });
    }
    
    console.log(`✅ Leave balances initialized (${leaveTypes.length} types)`);
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      console.log(`⚠️  Leave balances already exist for user ${userId}`);
    } else {
      throw error;
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting test user creation...\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`👥 Creating ${TEST_USERS.length} test users\n`);
  console.log('=' .repeat(60));

  const createdUsers = [];

  for (const userData of TEST_USERS) {
    try {
      const user = await createUser(userData);
      if (user) {
        await initializeLeaveBalances(user.id);
        createdUsers.push({ ...userData, id: user.id });
      }
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('\n✨ Test user creation complete!\n');
  
  if (createdUsers.length > 0) {
    console.log('📋 Created Users Summary:\n');
    console.log('Email                    | Role      | Password   | Department');
    console.log('-'.repeat(70));
    
    TEST_USERS.forEach(user => {
      const email = user.email.padEnd(24);
      const role = user.role.padEnd(9);
      const password = user.password.padEnd(10);
      console.log(`${email} | ${role} | ${password} | ${user.department}`);
    });
    
    console.log('\n💡 You can now login with any of these credentials at:');
    console.log(`   ${env.APP_URL || 'http://localhost:3000'}/login\n`);
  } else {
    console.log('⚠️  No new users were created (they may already exist)\n');
  }
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
