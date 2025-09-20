// Security Tests Execution Script
// Run with: node security-tests.js

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

// Function to run OWASP ZAP tests
async function runOwaspZapTests() {
  console.log('🕷️ Starting OWASP ZAP Security Tests');
  console.log('====================================');
  
  try {
    // Check if ZAP is installed
    await runCommand('zap-cli', ['--version']);
    
    // Start ZAP in daemon mode
    console.log('Starting ZAP daemon...');
    await runCommand('zap-cli', ['start', '--daemon']);
    
    // Run security tests
    console.log('Running security tests...');
    await runCommand('zap-cli', [
      'quick-scan',
      '--self-contained',
      '--spider',
      '--ajax-spider',
      '--recursive',
      '--exclude',
      '.*\\.(jpg|jpeg|png|gif|ico|css|js)',
      'http://localhost:3000'
    ]);
    
    // Stop ZAP
    console.log('Stopping ZAP daemon...');
    await runCommand('zap-cli', ['shutdown']);
    
    console.log('\n✅ OWASP ZAP tests completed successfully');
    return true;
  } catch (error) {
    console.log(`\n❌ OWASP ZAP tests failed: ${error.message}`);
    
    // Try to shutdown ZAP if it's still running
    try {
      await runCommand('zap-cli', ['shutdown']);
    } catch (shutdownError) {
      console.log('⚠️  Failed to shutdown ZAP daemon');
    }
    
    return false;
  }
}

// Function to run dependency security checks
async function runDependencySecurityChecks() {
  console.log('\n🔒 Starting Dependency Security Checks');
  console.log('=====================================');
  
  try {
    // Run npm audit for backend
    console.log('Checking backend dependencies...');
    await runCommand('npm', ['audit', '--audit-level=high'], { cwd: path.join(__dirname, '../backend') });
    
    // Run npm audit for frontend
    console.log('Checking frontend dependencies...');
    await runCommand('npm', ['audit', '--audit-level=high'], { cwd: path.join(__dirname, '../frontend') });
    
    console.log('\n✅ Dependency security checks completed successfully');
    return true;
  } catch (error) {
    console.log(`\n❌ Dependency security checks failed: ${error.message}`);
    return false;
  }
}

// Function to run code quality checks
async function runCodeQualityChecks() {
  console.log('\n🔍 Starting Code Quality Checks');
  console.log('==============================');
  
  try {
    // Run ESLint for backend
    console.log('Running ESLint on backend...');
    await runCommand('npm', ['run', 'lint'], { cwd: path.join(__dirname, '../backend') });
    
    // Run ESLint for frontend
    console.log('Running ESLint on frontend...');
    await runCommand('npm', ['run', 'lint'], { cwd: path.join(__dirname, '../frontend') });
    
    console.log('\n✅ Code quality checks completed successfully');
    return true;
  } catch (error) {
    console.log(`\n❌ Code quality checks failed: ${error.message}`);
    return false;
  }
}

// Function to run penetration tests
async function runPenetrationTests() {
  console.log('\n⚔️ Starting Penetration Tests');
  console.log('============================');
  
  try {
    // Check if nmap is installed
    await runCommand('nmap', ['--version']);
    
    // Run basic port scan
    console.log('Running port scan...');
    await runCommand('nmap', ['-p', '3000,3001,5000', 'localhost']);
    
    console.log('\n✅ Penetration tests completed successfully');
    return true;
  } catch (error) {
    console.log(`\n❌ Penetration tests failed: ${error.message}`);
    return false;
  }
}

// Main function to run all security tests
async function runSecurityTests() {
  console.log('🛡️ Security Test Suite');
  console.log('======================');
  
  const startTime = new Date();
  
  // Track test results
  const testResults = [];
  
  try {
    // 1. Run OWASP ZAP tests
    const owaspTestsPassed = await runOwaspZapTests();
    testResults.push({ name: 'OWASP ZAP Tests', passed: owaspTestsPassed });
    
    // 2. Run dependency security checks
    const dependencyTestsPassed = await runDependencySecurityChecks();
    testResults.push({ name: 'Dependency Security Checks', passed: dependencyTestsPassed });
    
    // 3. Run code quality checks
    const codeQualityTestsPassed = await runCodeQualityChecks();
    testResults.push({ name: 'Code Quality Checks', passed: codeQualityTestsPassed });
    
    // 4. Run penetration tests (if nmap is available)
    const penetrationTestsPassed = await runPenetrationTests();
    testResults.push({ name: 'Penetration Tests', passed: penetrationTestsPassed });
    
  } catch (error) {
    console.log(`\n❌ Security test execution error: ${error.message}`);
  }
  
  // Calculate final results
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000; // in seconds
  
  console.log('\n🏁 Security Test Summary');
  console.log('========================');
  console.log(`⏱️  Total duration: ${duration.toFixed(2)} seconds\n`);
  
  let passedTests = 0;
  let totalTests = testResults.length;
  
  testResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.passed) passedTests++;
  });
  
  console.log(`\n📊 Overall Results: ${passedTests}/${totalTests} security test suites passed`);
  
  const percentage = (passedTests / totalTests) * 100;
  console.log(`📈 Success Rate: ${percentage.toFixed(1)}%`);
  
  if (percentage === 100) {
    console.log('\n🏆 All security test suites passed! 🎉');
  } else if (percentage >= 80) {
    console.log('\n✅ Good security test coverage overall');
  } else {
    console.log('\n⚠️  Consider improving security test coverage');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Review any failed test outputs above');
  console.log('   2. Address identified security vulnerabilities');
  console.log('   3. Re-run tests to confirm fixes');
}

// Run all security tests
runSecurityTests().catch(error => {
  console.error('❌ Fatal error running security tests:', error.message);
  process.exit(1);
});