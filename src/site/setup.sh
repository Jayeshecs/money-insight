#!/bin/bash

echo "Setting up Ventio Marketing Website..."
echo "======================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✓ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. npm start          - Start development server"
    echo "   2. npm run build:prod - Build for production"
    echo ""
    echo "📝 Documentation:"
    echo "   - README.md           - Full documentation"
    echo "   - SETUP_COMPLETE.md   - Quick start guide"
    echo ""
    echo "🎨 Customize content in:"
    echo "   src/app/core/services/content.service.ts"
    echo ""
    echo "Happy coding! 💙"
else
    echo ""
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi
