@echo off
echo Setting up Ventio Marketing Website...
echo =======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Node.js is not installed. Please install Node.js 18+ first.
    echo   Download from: https://nodejs.org/
    exit /b 1
)

echo * Node.js version:
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X npm is not installed.
    exit /b 1
)

echo * npm version:
npm --version
echo.

REM Install dependencies
echo Installing dependencies...
call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Setup complete!
    echo.
    echo Next steps:
    echo    1. npm start          - Start development server
    echo    2. npm run build:prod - Build for production
    echo.
    echo Documentation:
    echo    - README.md           - Full documentation
    echo    - SETUP_COMPLETE.md   - Quick start guide
    echo.
    echo Customize content in:
    echo    src/app/core/services/content.service.ts
    echo.
    echo Happy coding!
) else (
    echo.
    echo Installation failed. Please check the error messages above.
    exit /b 1
)
