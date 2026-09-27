@echo off
echo ============================================================
echo   Elanjai Buildos - Database Reset
echo   This will DELETE all data except demo user accounts!
echo ============================================================
echo.
echo Demo users that will be PRESERVED:
echo   - admin@demo.com   (ADMIN)
echo   - owner@demo.com   (OWNER)
echo   - manager@demo.com (SITE_MANAGER)
echo   - client@demo.com  (CLIENT)
echo.
echo ALL sites, collections, expenses, quotations, settings,
echo material_spent, and non-demo users will be DELETED.
echo.

set /p CONFIRM=Are you sure? Type YES to confirm: 
if /I not "%CONFIRM%"=="YES" (
    echo.
    echo Cancelled. No changes were made.
    pause
    exit /b 0
)

echo.
echo Running reset script...
echo.

"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -proot elanjai_dev < "%~dp0reset-data.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo   SUCCESS: Database has been reset!
    echo   Demo users have been preserved.
    echo   Restart the backend to re-initialize demo user passwords.
    echo ============================================================
) else (
    echo.
    echo ============================================================
    echo   ERROR: Database reset failed!
    echo   Make sure MySQL is running and credentials are correct.
    echo   (root/root on localhost:3306)
    echo ============================================================
)

echo.
pause
