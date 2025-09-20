#!/bin/bash

# Load Test Execution Script for NeuraMaint
# This script runs all load tests in sequence

echo "🚀 Starting NeuraMaint Load Test Suite"
echo "======================================"

# Check if artillery is installed
if ! command -v artillery &> /dev/null
then
    echo "❌ Artillery is not installed. Please install it with: npm install -g artillery"
    exit 1
fi

# Define test files
TEST_FILES=(
    "auth-load-test.yml"
    "dashboard-load-test.yml"
    "equipment-load-test.yml"
    "sensor-readings-load-test.yml"
    "alerts-load-test.yml"
)

# Create results directory
mkdir -p results

# Run each test
for test_file in "${TEST_FILES[@]}"; do
    echo ""
    echo "🧪 Running load test: $test_file"
    echo "──────────────────────────────────────"
    
    # Run the test and save results
    artillery run "load-tests/$test_file" \
        --output "results/${test_file%.yml}-report.json" \
        --quiet
    
    # Generate HTML report
    artillery report "results/${test_file%.yml}-report.json" \
        --output "results/${test_file%.yml}-report.html"
    
    echo "✅ Completed: $test_file"
    echo ""
done

echo "🎉 All load tests completed!"
echo "📊 Reports saved in the results directory"
echo ""
echo "📁 To view results:"
echo "   - Open the HTML reports in your browser"
echo "   - Or run: artillery report results/*-report.json"