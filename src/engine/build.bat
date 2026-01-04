@echo off
REM Build script for WASM engine on Windows

echo Building MoneyInsight WASM Engine...

REM Check if wasm-pack is installed
where wasm-pack >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo wasm-pack not found. Please install it first:
    echo curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf ^| sh
    exit /b 1
)

REM Navigate to engine directory
cd /d "%~dp0"

REM Clean previous builds
echo Cleaning previous builds...
if exist pkg rmdir /s /q pkg
cargo clean

REM Run tests
echo Running native tests...
cargo test
if %ERRORLEVEL% NEQ 0 (
    echo Tests failed!
    exit /b 1
)

echo.
echo Note: WASM-specific tests require: wasm-pack test --headless --firefox

REM Build for production
echo Building WASM package (release)...
wasm-pack build --target web --release

REM Check if build succeeded
if exist pkg (
    echo Build successful!
    echo Output: pkg\
    dir pkg
    
    echo.
    echo Next steps:
    echo 1. Copy pkg\ to Angular project
    echo 2. Import in TypeScript
) else (
    echo Build failed!
    exit /b 1
)
