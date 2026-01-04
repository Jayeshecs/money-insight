#!/bin/bash
# Build script for WASM engine

set -e

echo "🦀 Building MoneyInsight WASM Engine..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Navigate to engine directory
cd "$(dirname "$0")"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf pkg/
cargo clean

# Run tests
echo "🧪 Running native tests..."
cargo test

echo "📝 Note: WASM-specific tests require: wasm-pack test --headless --firefox"

# Build for production
echo "📦 Building WASM package (release)..."
wasm-pack build --target web --release

# Check if build succeeded
if [ -d "pkg" ]; then
    echo "✅ Build successful!"
    echo "📁 Output: pkg/"
    ls -lh pkg/
    
    echo ""
    echo "Next steps:"
    echo "1. Copy pkg/ to Angular project: cp -r pkg/ ../client/src/app/wasm/"
    echo "2. Import in TypeScript: import init, { WasmEngine } from './wasm/moneyinsight_wasm';"
else
    echo "❌ Build failed!"
    exit 1
fi
