#!/bin/bash
# Quick validation script for HDFC Credit Card parser

cd /d/work/github/jayeshecs/money-insight/src/engine

echo "==================================="
echo "Testing HDFC Credit Card Parser"
echo "==================================="

echo ""
echo "Running Rust unit tests..."
cargo test --lib parsers::hdfc_credit::tests 2>&1 | grep -E "(test result:|Running|PASS|FAIL)"

echo ""
echo "==================================="
echo "Test Summary Complete"
echo "==================================="
