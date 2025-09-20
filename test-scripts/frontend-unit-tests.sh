#!/bin/bash

# Frontend Unit Tests Execution Script
# Run with: ./frontend-unit-tests.sh

echo "🧪 Starting Frontend Unit Tests"
echo "==============================="

# Navigate to frontend directory
cd ../frontend

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
fi

# Run unit tests with coverage
echo "🚀 Running unit tests with coverage..."
npm run test:coverage

# Check if tests passed
if [ $? -eq 0 ]; then
  echo "✅ Frontend unit tests completed successfully"
else
  echo "❌ Frontend unit tests failed"
  exit 1
fi

echo "🎉 Frontend tests completed!"