#!/bin/bash

# Quick Load Test Validation Script
# Runs a short load test to verify the configuration

echo "🚀 Running Quick Load Test Validation"
echo "==================================="

# Check if we're in the right directory
if [ ! -d "load-tests" ]; then
    echo "❌ Error: load-tests directory not found"
    echo "Please run this script from the test-scripts directory"
    exit 1
fi

# Run a quick test (10 seconds, 1 user per second)
echo "🧪 Running quick authentication load test..."
artillery run --quiet \
    --target "http://localhost:3000" \
    load-tests/auth-load-test.yml

if [ $? -eq 0 ]; then
    echo "✅ Quick load test completed successfully"
    echo "🎉 Load test environment is properly configured!"
else
    echo "❌ Quick load test failed"
    echo "Please check your Artillery installation and test configurations"
    exit 1
fi