@echo off
REM Quick Load Test Validation Script (Windows)
REM Runs a short load test to verify the configuration

echo 🚀 Running Quick Load Test Validation
echo ===================================

REM Check if we're in the right directory
if not exist "load-tests" (
    echo ❌ Error: load-tests directory not found
    echo Please run this script from the test-scripts directory
    exit /b 1
)

REM Run a quick test (10 seconds, 1 user per second)
echo 🧪 Running quick authentication load test...
artillery run --quiet --target "http://localhost:3000" "load-tests\auth-load-test.yml"

if %errorlevel% equ 0 (
    echo ✅ Quick load test completed successfully
    echo 🎉 Load test environment is properly configured!
) else (
    echo ❌ Quick load test failed
    echo Please check your Artillery installation and test configurations
    exit /b 1
)