@echo off
REM Load Test Execution Script for NeuraMaint (Windows)
REM This script runs all load tests in sequence

echo 🚀 Starting NeuraMaint Load Test Suite
echo ======================================

REM Check if artillery is installed
where artillery >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Artillery is not installed. Please install it with: npm install -g artillery
    exit /b 1
)

REM Create results directory
if not exist "results" mkdir "results"

REM Run each test
echo.
echo 🧪 Running authentication load test
echo ──────────────────────────────────────
artillery run "load-tests\auth-load-test.yml" --output "results\auth-load-test-report.json" --quiet
echo ✅ Completed: auth-load-test.yml
echo.

echo 🧪 Running dashboard load test
echo ──────────────────────────────────────
artillery run "load-tests\dashboard-load-test.yml" --output "results\dashboard-load-test-report.json" --quiet
echo ✅ Completed: dashboard-load-test.yml
echo.

echo 🧪 Running equipment load test
echo ──────────────────────────────────────
artillery run "load-tests\equipment-load-test.yml" --output "results\equipment-load-test-report.json" --quiet
echo ✅ Completed: equipment-load-test.yml
echo.

echo 🧪 Running sensor readings load test
echo ──────────────────────────────────────
artillery run "load-tests\sensor-readings-load-test.yml" --output "results\sensor-readings-load-test-report.json" --quiet
echo ✅ Completed: sensor-readings-load-test.yml
echo.

echo 🧪 Running alerts load test
echo ──────────────────────────────────────
artillery run "load-tests\alerts-load-test.yml" --output "results\alerts-load-test-report.json" --quiet
echo ✅ Completed: alerts-load-test.yml
echo.

echo 🎉 All load tests completed!
echo 📊 Reports saved in the results directory
echo.
echo 📁 To view results:
echo    - Open the HTML reports in your browser
echo    - Or run: artillery report results\*-report.json