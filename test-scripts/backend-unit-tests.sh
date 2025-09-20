#!/bin/bash

# Backend Unit Tests Execution Script
# Run with: ./backend-unit-tests.sh

echo "🧪 Starting Backend Unit Tests"
echo "=============================="

# Navigate to backend directory
cd ../backend

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  npm install
fi

# Run unit tests with coverage
echo "🚀 Running unit tests with coverage..."
npm run test:coverage

# Check if tests passed
if [ $? -eq 0 ]; then
  echo "✅ Unit tests completed successfully"
else
  echo "❌ Unit tests failed"
  exit 1
fi

# Run integration tests
echo "🚀 Running integration tests..."
npm run test:integration:coverage

# Check if integration tests passed
if [ $? -eq 0 ]; then
  echo "✅ Integration tests completed successfully"
else
  echo "❌ Integration tests failed"
  exit 1
fi

echo "🎉 All backend tests completed!"