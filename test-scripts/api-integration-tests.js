// API Integration Tests Execution Script
// Run with: node api-integration-tests.js

const { spawn } = require('child_process');
const path = require('path');

// Function to run a command and return a promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running: ${command} ${args.join(' ')}\n`);
    
    const process = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

// Function to run tests with error handling
async function runTestsWithErrorHandling(testName, command, args, options = {}) {
  console.log(`\n🧪 Running ${testName} Tests`);
  console.log('═'.repeat(50));
  
  try {
    await runCommand(command, args, options);
    console.log(`\n✅ ${testName} tests completed successfully`);
    return true;
  } catch (error) {
    console.log(`\n❌ ${testName} tests failed: ${error.message}`);
    return false;
  }
}

// Main function to run API integration tests
async function runApiIntegrationTests() {
  console.log('🧪 API Integration Test Suite');
  console.log('=============================');
  
  const startTime = new Date();
  
  // Track test results
  const testResults = [];
  
  try {
    // 1. Run authentication tests
    const authTestsPassed = await runTestsWithErrorHandling(
      'Authentication',
      'node',
      ['test-auth-enhanced.js'],
      { cwd: path.join(__dirname, '../backend') }
    );
    testResults.push({ name: 'Authentication Tests', passed: authTestsPassed });
    
    // 2. Run dashboard tests
    const dashboardTestsPassed = await runTestsWithErrorHandling(
      'Dashboard',
      'node',
      ['test-dashboard.js'],
      { cwd: path.join(__dirname, '../backend') }
    );
    testResults.push({ name: 'Dashboard Tests', passed: dashboardTestsPassed });
    
    // 3. Run equipment management tests
    const equipmentTestsPassed = await runTestsWithErrorHandling(
      'Equipment Management',
      'node',
      ['test-equipment.js'],
      { cwd: path.join(__dirname, '../backend') }
    );
    testResults.push({ name: 'Equipment Tests', passed: equipmentTestsPassed });
    
    // 4. Run sensor CRUD tests
    const sensorTestsPassed = await runTestsWithErrorHandling(
      'Sensor CRUD',
      'node',
      ['test-sensor-crud.js'],
      { cwd: path.join(__dirname, '../backend') }
    );
    testResults.push({ name: 'Sensor CRUD Tests', passed: sensorTestsPassed });
    
    // 5. Run alert system tests
    const alertTestsPassed = await runTestsWithErrorHandling(
      'Alert System',
      'node',
      ['test-alert-system.js'],
      { cwd: path.join(__dirname, '../backend') }
    );
    testResults.push({ name: 'Alert System Tests', passed: alertTestsPassed });
    
    // 6. Run reading processing tests
    const readingTestsPassed = await runTestsWithErrorHandling(
      'Reading Processing',
      'node',
      ['test-reading-processing.js'],
      { cwd: path.join(__dirname, '../backend') }
    );
    testResults.push({ name: 'Reading Processing Tests', passed: readingTestsPassed });
    
    // 7. Run simulator tests
    const simulatorTestsPassed = await runTestsWithErrorHandling(
      'Simulator',
      'node',
      ['test-simulator.js'],
      { cwd: path.join(__dirname, '../backend') }
    );
    testResults.push({ name: 'Simulator Tests', passed: simulatorTestsPassed });
    
    // 8. Run security tests
    const securityTestsPassed = await runTestsWithErrorHandling(
      'Security',
      'node',
      ['test-security.js'],
      { cwd: path.join(__dirname, '../backend') }
    );
    testResults.push({ name: 'Security Tests', passed: securityTestsPassed });
    
  } catch (error) {
    console.log(`\n❌ Test execution error: ${error.message}`);
  }
  
  // Calculate final results
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000; // in seconds
  
  console.log('\n🏁 API Integration Test Summary');
  console.log('==============================');
  console.log(`⏱️  Total duration: ${duration.toFixed(2)} seconds\n`);
  
  let passedTests = 0;
  let totalTests = testResults.length;
  
  testResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.passed) passedTests++;
  });
  
  console.log(`\n📊 Overall Results: ${passedTests}/${totalTests} test suites passed`);
  
  const percentage = (passedTests / totalTests) * 100;
  console.log(`📈 Success Rate: ${percentage.toFixed(1)}%`);
  
  if (percentage === 100) {
    console.log('\n🏆 All API integration test suites passed! 🎉');
  } else if (percentage >= 80) {
    console.log('\n✅ Good test coverage overall');
  } else {
    console.log('\n⚠️  Consider improving test coverage');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Review any failed test outputs above');
  console.log('   2. Fix identified issues');
  console.log('   3. Re-run tests to confirm fixes');
}

// Run all tests
runApiIntegrationTests().catch(error => {
  console.error('❌ Fatal error running tests:', error.message);
  process.exit(1);
});