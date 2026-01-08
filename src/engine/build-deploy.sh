#!/bin/bash
# Build script for WASM engine

set -e

echo "🦀 Building MoneyInsight WASM Engine..."

# Navigate to engine directory
cd "$(dirname "$0")"

# Build for production
echo "📦 Building WASM package (release)..."
wasm-pack build --target web --release

# Check if build succeeded
if [ -d "pkg" ]; then
    echo "✅ Build successful!"
    echo "📁 Output: pkg/"
    ls -lh pkg/
    
    echo ""
    echo "Copying pkg/ to Angular project: cp -r pkg/ ../client/src/app/wasm/"
    cp -r pkg/ ../client/src/app/wasm/
else
    echo "❌ Build failed!"
    exit 1
fi
