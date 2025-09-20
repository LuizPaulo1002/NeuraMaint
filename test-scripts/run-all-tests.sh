#!/bin/bash

# Master Test Execution Script
# Run with: ./run-all-tests.sh

echo "🧪 NeuraMaint Comprehensive Test Suite"
echo "====================================="

# Create test results directory
mkdir -p ../test-results

# Run backend unit tests
echo "🚀 Running Backend Unit Tests..."
./backend-unit-tests.sh
if [ $? -ne 0 ]; then
  echo "❌ Backend unit tests failed"
  exit 1
fi

# Run frontend unit tests
echo "🚀 Running Frontend Unit Tests..."
./frontend-unit-tests.sh
if [ $? -ne 0 ]; then
  echo "❌ Frontend unit tests failed"
  exit 1
fi

# Run ML service tests
echo "🚀 Running ML Service Tests..."
python ml-service-tests.py
if [ $? -ne 0 ]; then
  echo "❌ ML service tests failed"
  exit 1
fi

# Run API integration tests
echo "🚀 Running API Integration Tests..."
node api-integration-tests.js
if [ $? -ne 0 ]; then
  echo "❌ API integration tests failed"
  exit 1
fi

# Run performance tests
echo "🚀 Running Performance Tests..."
node performance-tests.js
if [ $? -ne 0 ]; then
  echo "❌ Performance tests failed"
  exit 1
fi

# Run security tests
echo "🚀 Running Security Tests..."
node security-tests.js
if [ $? -ne 0 ]; then
  echo "❌ Security tests failed"
  exit 1
fi

# Run database tests
echo "🚀 Running Database Tests..."
node database-tests.js
if [ $? -ne 0 ]; then
  echo "❌ Database tests failed"
  exit 1
fi

echo "🎉 All test suites completed successfully!"
echo "📊 Test results are available in the test-results directory"