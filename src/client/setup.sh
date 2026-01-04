#!/bin/bash
# Setup and verify Angular client

echo "🔧 MoneyInsight Client Setup"
echo "=============================="

# Check if we're in the client directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from src/client directory."
    exit 1
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check for WASM package
echo ""
echo "🔍 Checking for WASM package..."
if [ ! -d "src/app/wasm" ]; then
    echo "⚠️  WASM package not found."
    echo "    Run from project root:"
    echo "    cd src/engine && wasm-pack build --target web --release"
    echo "    cp -r pkg/ ../client/src/app/wasm/"
    exit 1
else
    echo "✅ WASM package found"
fi

# Verify Angular CLI
echo ""
echo "🔍 Verifying Angular CLI..."
if ! command -v ng &> /dev/null; then
    echo "⚠️  Angular CLI not found globally."
    echo "    Install with: npm install -g @angular/cli@18"
else
    echo "✅ Angular CLI: $(ng version --quiet 2>&1 | head -1)"
fi

# Test build
echo ""
echo "🏗️  Testing build..."
npm run build -- --configuration development

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "Next steps:"
    echo "  npm start    # Start development server"
    echo "  npm test     # Run tests"
    echo ""
else
    echo ""
    echo "❌ Build failed. Check errors above."
    exit 1
fi
