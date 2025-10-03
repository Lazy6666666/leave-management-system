# Quick Start: Create Test Users

## ✅ Recommended Method (Easiest)

### Step 1: Open the SQL File
Double-click: `scripts/open-sql-file.cmd`

Or manually open: `scripts/seed-test-users-direct.sql`

### Step 2: Copy the SQL Content
Select all (Ctrl+A) and copy (Ctrl+C) the entire file content.

### Step 3: Run in Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Login if needed

2. **Select Your Project**
   - Click on your project: `ofkcmmwibufljpemmdde`

3. **Open SQL Editor**
   - Click **"SQL Editor"** in the left sidebar
   - Or go directly to: https://supabase.com/dashboard/project/ofkcmmwibufljpemmdde/sql

4. **Create New Query**
   - Click **"New Query"** button

5. **Paste and Run**
   - Paste the SQL content (Ctrl+V)
   - Click **"Run"** button (or press Ctrl+Enter)

6. **Verify Success**
   - You should see messages like:
     ```
     NOTICE: 🚀 Creating test users...
     NOTICE: Created user admin@test.com with ID ...
     NOTICE: ✅ Test users created successfully!
     ```

## 🎉 Done!

You now have 6 test users ready to use:

| Email | Password | Role | Department |
|-------|----------|------|------------|
| **admin@test.com** | Test123! | admin | Management |
| **hr@test.com** | Test123! | hr | Human Resources |
| **manager@test.com** | Test123! | manager | Engineering |
| **employee1@test.com** | Test123! | employee | Engineering |
| **employee2@test.com** | Test123! | employee | Marketing |
| **employee3@test.com** | Test123! | employee | Sales |

## 🚀 Next Steps

1. **Start the frontend:**
   ```bash
   npm run dev
   ```

2. **Login:**
   - Go to: http://localhost:3000/login
   - Use any of the test user credentials above

3. **Test different roles:**
   - Login as **admin@test.com** to see admin features
   - Login as **manager@test.com** to approve leave requests
   - Login as **employee1@test.com** to submit leave requests

## 🔧 Troubleshooting

### If you see "User already exists"
This is normal! The script will update existing users with the correct roles. Just verify you can login.

### If you get permission errors
Make sure you're logged into the correct Supabase project in the dashboard.

### To reset everything
Go to: **Authentication → Users** in Supabase Dashboard and delete users with `@test.com` emails, then run the SQL again.

## 📚 More Information

See `scripts/README.md` for alternative methods and detailed documentation.
