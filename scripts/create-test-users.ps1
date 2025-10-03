# Create Test Users Script (PowerShell)
# 
# This script creates test users with different roles for development/testing.
# It uses the Supabase Admin API to create users and set up their profiles.
# 
# Usage:
#   .\scripts\create-test-users.ps1

$ErrorActionPreference = "Stop"

# Load environment variables from backend/.env.local
function Load-Env {
    $envPath = Join-Path $PSScriptRoot "..\backend\.env.local"
    
    if (-not (Test-Path $envPath)) {
        Write-Host "❌ Error: backend/.env.local not found" -ForegroundColor Red
        exit 1
    }

    $env = @{}
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $env[$key] = $value
        }
    }

    return $env
}

$env = Load-Env
$SUPABASE_URL = $env['SUPABASE_URL']
$SERVICE_ROLE_KEY = $env['SUPABASE_SERVICE_ROLE_KEY']

if (-not $SUPABASE_URL -or -not $SERVICE_ROLE_KEY) {
    Write-Host "❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Red
    exit 1
}

# Test users configuration
$TEST_USERS = @(
    @{
        email = 'admin@test.com'
        password = 'Test123!'
        full_name = 'Admin User'
        role = 'admin'
        department = 'Management'
    },
    @{
        email = 'hr@test.com'
        password = 'Test123!'
        full_name = 'HR Manager'
        role = 'hr'
        department = 'Human Resources'
    },
    @{
        email = 'manager@test.com'
        password = 'Test123!'
        full_name = 'Department Manager'
        role = 'manager'
        department = 'Engineering'
    },
    @{
        email = 'employee1@test.com'
        password = 'Test123!'
        full_name = 'John Doe'
        role = 'employee'
        department = 'Engineering'
    },
    @{
        email = 'employee2@test.com'
        password = 'Test123!'
        full_name = 'Jane Smith'
        role = 'employee'
        department = 'Marketing'
    },
    @{
        email = 'employee3@test.com'
        password = 'Test123!'
        full_name = 'Bob Johnson'
        role = 'employee'
        department = 'Sales'
    }
)

# Helper function to make API requests
function Invoke-SupabaseRequest {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body = $null
    )

    $uri = "$SUPABASE_URL$Path"
    $headers = @{
        'Content-Type' = 'application/json'
        'apikey' = $SERVICE_ROLE_KEY
        'Authorization' = "Bearer $SERVICE_ROLE_KEY"
    }

    $params = @{
        Uri = $uri
        Method = $Method
        Headers = $headers
    }

    if ($Body) {
        $params['Body'] = ($Body | ConvertTo-Json -Depth 10)
    }

    try {
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        throw $_
    }
}

# Create a user via Supabase Admin API
function New-TestUser {
    param([hashtable]$UserData)

    try {
        Write-Host "`n📝 Creating user: $($UserData.email)" -ForegroundColor Cyan
        
        # Create user in auth.users
        $authUser = Invoke-SupabaseRequest -Method POST -Path '/auth/v1/admin/users' -Body @{
            email = $UserData.email
            password = $UserData.password
            email_confirm = $true
            user_metadata = @{
                full_name = $UserData.full_name
            }
        }

        Write-Host "✅ Auth user created with ID: $($authUser.id)" -ForegroundColor Green

        # Update profile with role and department
        Invoke-SupabaseRequest -Method PATCH -Path "/rest/v1/profiles?id=eq.$($authUser.id)" -Body @{
            full_name = $UserData.full_name
            role = $UserData.role
            department = $UserData.department
        } | Out-Null

        Write-Host "✅ Profile updated with role: $($UserData.role)" -ForegroundColor Green

        return $authUser
    } catch {
        if ($_.Exception.Message -match 'already been registered') {
            Write-Host "⚠️  User $($UserData.email) already exists" -ForegroundColor Yellow
            return $null
        }
        throw $_
    }
}

# Initialize leave balances for a user
function Initialize-LeaveBalances {
    param([string]$UserId)

    try {
        Write-Host "📊 Initializing leave balances for user $UserId" -ForegroundColor Cyan
        
        # Get all active leave types
        $leaveTypes = Invoke-SupabaseRequest -Method GET -Path '/rest/v1/leave_types?is_active=eq.true&select=id,default_allocation_days'
        
        $currentYear = (Get-Date).Year
        
        # Create leave balance for each leave type
        foreach ($leaveType in $leaveTypes) {
            Invoke-SupabaseRequest -Method POST -Path '/rest/v1/leave_balances' -Body @{
                employee_id = $UserId
                leave_type_id = $leaveType.id
                allocated_days = $leaveType.default_allocation_days
                used_days = 0
                carried_forward_days = 0
                year = $currentYear
            } | Out-Null
        }
        
        Write-Host "✅ Leave balances initialized ($($leaveTypes.Count) types)" -ForegroundColor Green
    } catch {
        if ($_.Exception.Message -match 'duplicate key') {
            Write-Host "⚠️  Leave balances already exist for user $UserId" -ForegroundColor Yellow
        } else {
            throw $_
        }
    }
}

# Main execution
Write-Host "🚀 Starting test user creation...`n" -ForegroundColor Cyan
Write-Host "📍 Supabase URL: $SUPABASE_URL"
Write-Host "👥 Creating $($TEST_USERS.Count) test users`n"
Write-Host ("=" * 60)

$createdUsers = @()

foreach ($userData in $TEST_USERS) {
    try {
        $user = New-TestUser -UserData $userData
        if ($user) {
            Initialize-LeaveBalances -UserId $user.id
            $createdUsers += $userData
        }
    } catch {
        Write-Host "❌ Error creating user $($userData.email): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n$("=" * 60)"
Write-Host "`n✨ Test user creation complete!`n" -ForegroundColor Green

if ($createdUsers.Count -gt 0) {
    Write-Host "📋 Created Users Summary:`n"
    Write-Host "Email                    | Role      | Password   | Department"
    Write-Host ("-" * 70)
    
    foreach ($user in $TEST_USERS) {
        $email = $user.email.PadRight(24)
        $role = $user.role.PadRight(9)
        $password = $user.password.PadRight(10)
        Write-Host "$email | $role | $password | $($user.department)"
    }
    
    Write-Host "`n💡 You can now login with any of these credentials at:"
    $appUrl = if ($env['APP_URL']) { $env['APP_URL'] } else { 'http://localhost:3000' }
    Write-Host "   $appUrl/login`n" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  No new users were created (they may already exist)`n" -ForegroundColor Yellow
}
