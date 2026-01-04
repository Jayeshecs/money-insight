@echo off
REM Setup and verify Angular client

echo Setting up MoneyInsight Client...
echo ==============================

REM Check if we're in the client directory
if not exist package.json (
    echo Error: package.json not found. Run this script from src\client directory.
    exit /b 1
)

REM Install dependencies
echo.
echo Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install dependencies
    exit /b 1
)

REM Check for WASM package
echo.
echo Checking for WASM package...
if not exist src\app\wasm (
    echo WASM package not found.
    echo Run from project root:
    echo    cd src\engine
    echo    wasm-pack build --target web --release
    echo    xcopy pkg ..\client\src\app\wasm\ /E /I /Y
    exit /b 1
) else (
    echo WASM package found
)

REM Verify Angular CLI
echo.
echo Verifying Angular CLI...
where ng >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Angular CLI not found globally.
    echo Install with: npm install -g @angular/cli@18
) else (
    ng version --quiet
)

REM Test build
echo.
echo Testing build...
call npm run build -- --configuration development
if %ERRORLEVEL% NEQ 0 (
    echo Build failed. Check errors above.
    exit /b 1
)

echo.
echo Setup complete!
echo.
echo Next steps:
echo   npm start    - Start development server
echo   npm test     - Run tests
