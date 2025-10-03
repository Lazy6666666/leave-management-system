# Run Seed Test Users Script (PowerShell)
# 
# This script executes the SQL file to create test users
# 
# Usage:
#   .\scripts\run-seed-users.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Seeding test users to Supabase..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCli) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Supabase CLI first:" -ForegroundColor Yellow
    Write-Host "  npm install -g supabase" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or use the SQL file directly in Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "  1. Go to https://supabase.com/dashboard" -ForegroundColor Cyan
    Write-Host "  2. Select your project" -ForegroundColor Cyan
    Write-Host "  3. Go to SQL Editor" -ForegroundColor Cyan
    Write-Host "  4. Copy and paste the contents of scripts/seed-test-users-direct.sql" -ForegroundColor Cyan
    Write-Host "  5. Click 'Run'" -ForegroundColor Cyan
    exit 1
}

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptDir "seed-test-users-direct.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Using SQL file: $sqlFile" -ForegroundColor Gray
Write-Host ""

# Load environment variables
$envPath = Join-Path $scriptDir "..\backend\.env.local"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Extract project ref from Supabase URL
$supabaseUrl = $env:SUPABASE_URL
if ($supabaseUrl -match 'https://([^.]+)\.supabase\.co') {
    $projectRef = $matches[1]
    Write-Host "📍 Project: $projectRef" -ForegroundColor Gray
    Write-Host ""
}

try {
    # Run the SQL file
    Write-Host "⚙️  Executing SQL script..." -ForegroundColor Cyan
    
    # Use psql if available, otherwise provide instructions
    $psql = Get-Command psql -ErrorAction SilentlyContinue
    
    if ($psql) {
        # Get database password from env
        $dbPassword = $env:SUPABASE_DB_PASSWORD
        if (-not $dbPassword) {
            Write-Host "⚠️  SUPABASE_DB_PASSWORD not found in .env.local" -ForegroundColor Yellow
            Write-Host "Please enter your database password:" -ForegroundColor Yellow
            $securePassword = Read-Host -AsSecureString
            $dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
            )
        }
        
        $env:PGPASSWORD = $dbPassword
        & psql -h "db.$projectRef.supabase.co" -p 5432 -d postgres -U postgres -f $sqlFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Test users created successfully!" -ForegroundColor Green
        } else {
            throw "psql command failed with exit code $LASTEXITCODE"
        }
    } else {
        Write-Host "⚠️  psql not found. Please run the SQL manually:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Option 1: Use Supabase Dashboard" -ForegroundColor Cyan
        Write-Host "  1. Go to https://supabase.com/dashboard/project/$projectRef/sql" -ForegroundColor Gray
        Write-Host "  2. Click 'New Query'" -ForegroundColor Gray
        Write-Host "  3. Copy and paste the contents of:" -ForegroundColor Gray
        Write-Host "     $sqlFile" -ForegroundColor White
        Write-Host "  4. Click 'Run'" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option 2: Use Supabase CLI" -ForegroundColor Cyan
        Write-Host "  supabase db execute --file $sqlFile --project-ref $projectRef" -ForegroundColor Gray
        Write-Host ""
        
        # Open the SQL file in default editor
        Write-Host "Opening SQL file..." -ForegroundColor Cyan
        Start-Process $sqlFile
    }
    
    Write-Host ""
    Write-Host "📋 Test User Credentials:" -ForegroundColor Cyan
    Write-Host "  admin@test.com      | Password: Test123! | Role: admin" -ForegroundColor White
    Write-Host "  hr@test.com         | Password: Test123! | Role: hr" -ForegroundColor White
    Write-Host "  manager@test.com    | Password: Test123! | Role: manager" -ForegroundColor White
    Write-Host "  employee1@test.com  | Password: Test123! | Role: employee" -ForegroundColor White
    Write-Host "  employee2@test.com  | Password: Test123! | Role: employee" -ForegroundColor White
    Write-Host "  employee3@test.com  | Password: Test123! | Role: employee" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Login at: http://localhost:3000/login" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run the SQL file manually in Supabase Dashboard" -ForegroundColor Yellow
    exit 1
}
