@echo off
echo.
echo ============================================================
echo   OPEN TEST USER SEED SQL FILE
echo ============================================================
echo.
echo This will open the SQL file in your default text editor.
echo.
echo INSTRUCTIONS:
echo   1. Copy the entire contents of the file
echo   2. Go to: https://supabase.com/dashboard
echo   3. Select your project
echo   4. Click "SQL Editor" in the left sidebar
echo   5. Click "New Query"
echo   6. Paste the SQL content
echo   7. Click "Run" (or press Ctrl+Enter)
echo.
echo ============================================================
echo.
pause
start "" "%~dp0seed-test-users-direct.sql"
