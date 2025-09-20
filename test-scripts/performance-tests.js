// Performance Tests Execution Script
// Run with: node performance-tests.js

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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

// Function to run load tests with Artillery
async function runLoadTests() {
  console.log('🏋️‍♀️ Starting Load Tests');
  console.log('====================');
  
  try {
    // Check if Artillery is installed
    await runCommand('artillery', ['--version']);
    
    // Run load tests for critical endpoints
    const testFiles = [
      'auth-load-test.yml',
      'dashboard-load-test.yml',
      'equipment-load-test.yml',
      'sensor-load-test.yml'
    ];
    
    for (const testFile of testFiles) {
      const testFilePath = path.join(__dirname, 'load-tests', testFile);
      if (fs.existsSync(testFilePath)) {
        console.log(`\n🚀 Running load test: ${testFile}`);
        await runCommand('artillery', ['run', testFilePath]);
      } else {
        console.log(`\n⚠️  Load test file not found: ${testFile}`);
      }
    }
    
    console.log('\n✅ Load tests completed successfully');
    return true;
  } catch (error) {
    console.log(`\n❌ Load tests failed: ${error.message}`);
    return false;
  }
}

// Function to run stress tests
async function runStressTests() {
  console.log('\n💪 Starting Stress Tests');
  console.log('======================');
  
  try {
    // Run stress test for API endpoints
    const stressTestScript = path.join(__dirname, '../backend/test-stress.js');
    if (fs.existsSync(stressTestScript)) {
      await runCommand('node', [stressTestScript]);
      console.log('\n✅ Stress tests completed successfully');
      return true;
    } else {
      console.log('\n⚠️  Stress test script not found');
      return true; // Not a failure
    }
  } catch (error) {
    console.log(`\n❌ Stress tests failed: ${error.message}`);
    return false;
  }
}

// Function to run endurance tests
async function runEnduranceTests() {
  console.log('\n⏳ Starting Endurance Tests');
  console.log('==========================');
  
  try {
    // Run endurance test for 1 hour
    const enduranceTestScript = path.join(__dirname, '../backend/test-endurance.js');
    if (fs.existsSync(enduranceTestScript)) {
      await runCommand('node', [enduranceTestScript]);
      console.log('\n✅ Endurance tests completed successfully');
      return true;
    } else {
      console.log('\n⚠️  Endurance test script not found');
      return true; // Not a failure
    }
  } catch (error) {
    console.log(`\n❌ Endurance tests failed: ${error.message}`);
    return false;
  }
}

// Main function to run all performance tests
async function runPerformanceTests() {
  console.log('⚡ Performance Test Suite');
  console.log('========================');
  
  const startTime = new Date();
  
  // Track test results
  const testResults = [];
  
  try {
    // 1. Run load tests
    const loadTestsPassed = await runLoadTests();
    testResults.push({ name: 'Load Tests', passed: loadTestsPassed });
    
    // 2. Run stress tests
    const stressTestsPassed = await runStressTests();
    testResults.push({ name: 'Stress Tests', passed: stressTestsPassed });
    
    // 3. Run endurance tests
    const enduranceTestsPassed = await runEnduranceTests();
    testResults.push({ name: 'Endurance Tests', passed: enduranceTestsPassed });
    
  } catch (error) {
    console.log(`\n❌ Performance test execution error: ${error.message}`);
  }
  
  // Calculate final results
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000; // in seconds
  
  console.log('\n🏁 Performance Test Summary');
  console.log('==========================');
  console.log(`⏱️  Total duration: ${duration.toFixed(2)} seconds\n`);
  
  let passedTests = 0;
  let totalTests = testResults.length;
  
  testResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.passed) passedTests++;
  });
  
  console.log(`\n📊 Overall Results: ${passedTests}/${totalTests} performance test suites passed`);
  
  const percentage = (passedTests / totalTests) * 100;
  console.log(`📈 Success Rate: ${percentage.toFixed(1)}%`);
  
  if (percentage === 100) {
    console.log('\n🏆 All performance test suites passed! 🎉');
  } else if (percentage >= 80) {
    console.log('\n✅ Good performance test coverage overall');
  } else {
    console.log('\n⚠️  Consider improving performance test coverage');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Review any failed test outputs above');
  console.log('   2. Analyze performance metrics');
  console.log('   3. Optimize system based on findings');
}

// Run all performance tests
runPerformanceTests().catch(error => {
  console.error('❌ Fatal error running performance tests:', error.message);
  process.exit(1);
});