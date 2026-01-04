#!/bin/bash
# E2E Test Runner for Story #001

echo "================================================"
echo "MoneyInsight E2E Test Suite - Story #001"
echo "================================================"
echo ""

# Check if Angular server is running
if ! curl -s http://localhost:4200 > /dev/null 2>&1; then
    echo "❌ Angular dev server is not running on port 4200"
    echo "Please start the server first:"
    echo "  cd ../../src/client && ng serve"
    exit 1
fi

echo "✓ Angular server is running"
echo ""

# Run Playwright tests
echo "Running Playwright tests..."
echo ""

npx playwright test --reporter=line

echo ""
echo "================================================"
echo "Test run complete. Check test-results/ for details."
echo "================================================"
