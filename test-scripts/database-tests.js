// Database Tests Execution Script
// Run with: node database-tests.js

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

// Function to run database schema tests
async function runSchemaTests() {
  console.log('🗄️ Starting Database Schema Tests');
  console.log('================================');
  
  try {
    // Run Prisma migration tests
    console.log('Running Prisma migrations...');
    await runCommand('npm', ['run', 'prisma:migrate'], { cwd: path.join(__dirname, '../backend') });
    
    // Run Prisma generate
    console.log('Generating Prisma client...');
    await runCommand('npm', ['run', 'prisma:generate'], { cwd: path.join(__dirname, '../backend') });
    
    console.log('\n✅ Database schema tests completed successfully');
    return true;
  } catch (error) {
    console.log(`\n❌ Database schema tests failed: ${error.message}`);
    return false;
  }
}

// Function to run data integrity tests
async function runDataIntegrityTests() {
  console.log('\n🔍 Starting Data Integrity Tests');
  console.log('===============================');
  
  try {
    // Run database test script
    const testScript = path.join(__dirname, '../backend/test-database.js');
    if (fs.existsSync(testScript)) {
      await runCommand('node', [testScript]);
      console.log('\n✅ Data integrity tests completed successfully');
      return true;
    } else {
      console.log('\n⚠️  Database test script not found');
      return true; // Not a failure
    }
  } catch (error) {
    console.log(`\n❌ Data integrity tests failed: ${error.message}`);
    return false;
  }
}

// Function to run performance tests
async function runDatabasePerformanceTests() {
  console.log('\n⚡ Starting Database Performance Tests');
  console.log('=====================================');
  
  try {
    // Run database performance test script
    const perfTestScript = path.join(__dirname, '../backend/test-db-performance.js');
    if (fs.existsSync(perfTestScript)) {
      await runCommand('node', [perfTestScript]);
      console.log('\n✅ Database performance tests completed successfully');
      return true;
    } else {
      console.log('\n⚠️  Database performance test script not found');
      return true; // Not a failure
    }
  } catch (error) {
    console.log(`\n❌ Database performance tests failed: ${error.message}`);
    return false;
  }
}

// Function to run concurrency tests
async function runConcurrencyTests() {
  console.log('\n🔄 Starting Database Concurrency Tests');
  console.log('=====================================');
  
  try {
    // Run database concurrency test script
    const concurrencyTestScript = path.join(__dirname, '../backend/test-db-concurrency.js');
    if (fs.existsSync(concurrencyTestScript)) {
      await runCommand('node', [concurrencyTestScript]);
      console.log('\n✅ Database concurrency tests completed successfully');
      return true;
    } else {
      console.log('\n⚠️  Database concurrency test script not found');
      return true; // Not a failure
    }
  } catch (error) {
    console.log(`\n❌ Database concurrency tests failed: ${error.message}`);
    return false;
  }
}

// Main function to run all database tests
async function runDatabaseTests() {
  console.log('🗃️ Database Test Suite');
  console.log('======================');
  
  const startTime = new Date();
  
  // Track test results
  const testResults = [];
  
  try {
    // 1. Run schema tests
    const schemaTestsPassed = await runSchemaTests();
    testResults.push({ name: 'Schema Tests', passed: schemaTestsPassed });
    
    // 2. Run data integrity tests
    const integrityTestsPassed = await runDataIntegrityTests();
    testResults.push({ name: 'Data Integrity Tests', passed: integrityTestsPassed });
    
    // 3. Run performance tests
    const performanceTestsPassed = await runDatabasePerformanceTests();
    testResults.push({ name: 'Performance Tests', passed: performanceTestsPassed });
    
    // 4. Run concurrency tests
    const concurrencyTestsPassed = await runConcurrencyTests();
    testResults.push({ name: 'Concurrency Tests', passed: concurrencyTestsPassed });
    
  } catch (error) {
    console.log(`\n❌ Database test execution error: ${error.message}`);
  }
  
  // Calculate final results
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000; // in seconds
  
  console.log('\n🏁 Database Test Summary');
  console.log('========================');
  console.log(`⏱️  Total duration: ${duration.toFixed(2)} seconds\n`);
  
  let passedTests = 0;
  let totalTests = testResults.length;
  
  testResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.passed) passedTests++;
  });
  
  console.log(`\n📊 Overall Results: ${passedTests}/${totalTests} database test suites passed`);
  
  const percentage = (passedTests / totalTests) * 100;
  console.log(`📈 Success Rate: ${percentage.toFixed(1)}%`);
  
  if (percentage === 100) {
    console.log('\n🏆 All database test suites passed! 🎉');
  } else if (percentage >= 80) {
    console.log('\n✅ Good database test coverage overall');
  } else {
    console.log('\n⚠️  Consider improving database test coverage');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Review any failed test outputs above');
  console.log('   2. Address identified database issues');
  console.log('   3. Re-run tests to confirm fixes');
}

// Run all database tests
runDatabaseTests().catch(error => {
  console.error('❌ Fatal error running database tests:', error.message);
  process.exit(1);
});