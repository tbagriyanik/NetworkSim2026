@echo off
echo Installing dependencies for Network Simulator...
echo.
echo This will install:
echo - zustand (state management)
echo - @dnd-kit/core (drag and drop)
echo - @dnd-kit/modifiers (DnD modifiers)
echo.
echo Starting installation...
echo.

cd /d %~dp0

npm install zustand @dnd-kit/core @dnd-kit/modifiers

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Installation completed successfully!
    echo ========================================
    echo.
    You can now run: npm run dev
    echo.
) else (
    echo.
    echo ========================================
    echo Installation failed!
    echo ========================================
    echo.
    Please try:
    echo 1. Check your internet connection
    echo 2. Run as Administrator if needed
    echo 3. Try: npm cache clean --force
    echo.
)

pause
