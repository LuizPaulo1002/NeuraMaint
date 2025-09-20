// Master test execution script for NeuraMaint
// Run with: node run-all-tests.js

const { spawn } = require('child_process');
const path = require('path');

// Function to run a command and return a promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running: ${command} ${args.join(' ')}\n`);
    
    const proc = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      stdio: 'inherit',
      shell: true
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    proc.on('error', (error) => {
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

// --- Server Control Functions ---

let backendServer;
let mlService;

// Function to start a server and return the process
function startServer(command, args, options) {
  console.log(`\n🔄 Starting server: ${command} ${args.join(' ')}`);
  const serverProcess = spawn(command, args, {
    cwd: options.cwd,
    shell: true,
    stdio: 'inherit', // Inherit stdio to see server logs
  });

  serverProcess.on('error', (err) => {
    console.error(`\n❌ Failed to start server: ${err.message}`);
  });

  console.log(`\n✅ Server process started with PID: ${serverProcess.pid}`);
  return serverProcess;
}

// Function to stop a server process
function stopServer(serverProcess, name) {
  if (serverProcess && !serverProcess.killed) {
    console.log(`\n🛑 Stopping ${name} server (PID: ${serverProcess.pid})...`);
    try {
      if (process.platform === "win32") {
        // Use taskkill on Windows
        spawn("taskkill", ["/pid", serverProcess.pid, '/f', '/t']);
      } else {
        // Use kill on other platforms
        process.kill(-serverProcess.pid, 'SIGKILL');
      }
      console.log(`\n✅ ${name} server stopped.`);
    } catch (e) {
      console.error(`\n❌ Error stopping ${name} server (PID: ${serverProcess.pid}): ${e.message}`);
      serverProcess.kill('SIGKILL'); // Fallback
    }
  }
}

// --- Main Test Execution ---

async function runAllTests() {
  console.log('🧪 NeuraMaint Comprehensive Test Suite');
  console.log('=====================================');
  
  const startTime = new Date();
  const testResults = [];

  try {
    // 1. Start servers
    backendServer = startServer('npm', ['run', 'dev'], { cwd: path.join(__dirname, 'backend') });
    mlService = startServer('python', ['app.py'], { cwd: path.join(__dirname, 'ml-service') });

    // Wait for servers to initialize (adjust time as needed)
    console.log('\n⏳ Waiting for servers to initialize...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
    console.log('\n✅ Servers should be ready. Starting tests...');

    // 2. Run unit tests (don't require servers)
    const unitTestsPassed = await runTestsWithErrorHandling(
      'Unit', 'npm', ['test'], { cwd: path.join(__dirname, 'backend') }
    );
    testResults.push({ name: 'Unit Tests', passed: unitTestsPassed });

    // 3. Run integration and other tests
    const integrationTests = [
      { name: 'Authentication', command: 'node', args: ['test-auth-enhanced.js'], cwd: path.join(__dirname, 'backend') },
      { name: 'Dashboard', command: 'node', args: ['test-dashboard.js'], cwd: path.join(__dirname, 'backend') },
      { name: 'Security', command: 'node', args: ['test-security.js'], cwd: path.join(__dirname, 'backend') },
      { name: 'ML Service', command: 'python', args: ['test_ml_service_enhanced.py'], cwd: path.join(__dirname, 'ml-service') },
      { name: 'Alert System', command: 'node', args: ['test-alert-system.js'], cwd: path.join(__dirname, 'backend') },
      { name: 'Pumps', command: 'node', args: ['test-pumps.js'], cwd: path.join(__dirname, 'backend') },
      { name: 'Sensor CRUD', command: 'node', args: ['test-sensor-crud.js'], cwd: path.join(__dirname, 'backend') },
      { name: 'Simulator', command: 'node', args: ['test-simulator.js'], cwd: path.join(__dirname, 'backend') },
      { name: 'Reading Processing', command: 'node', args: ['test-reading-processing.js'], cwd: path.join(__dirname, 'backend') }
    ];

    for (const test of integrationTests) {
      const passed = await runTestsWithErrorHandling(test.name, test.command, test.args, { cwd: test.cwd });
      testResults.push({ name: `${test.name} Tests`, passed });
    }

  } catch (error) {
    console.log(`\n❌ Test execution error: ${error.message}`);
  } finally {
    // 4. Stop servers
    stopServer(backendServer, 'Backend');
    stopServer(mlService, 'ML Service');
  }
  
  // Calculate final results
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;
  
  console.log('\n🏁 Test Execution Summary');
  console.log('========================');
  console.log(`⏱️  Total duration: ${duration.toFixed(2)} seconds\n`);
  
  let passedTests = 0;
  testResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.passed) passedTests++;
  });
  
  console.log(`\n📊 Overall Results: ${passedTests}/${testResults.length} test suites passed`);
  const percentage = testResults.length > 0 ? (passedTests / testResults.length) * 100 : 0;
  console.log(`📈 Success Rate: ${percentage.toFixed(1)}%`);
  
  if (percentage === 100) {
    console.log('\n🏆 All test suites passed! 🎉');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the logs.');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Review any failed test outputs above');
  console.log('   2. Fix identified issues');
  console.log('   3. Re-run tests to confirm fixes');
}

// Run all tests
runAllTests().catch(error => {
  console.error('❌ Fatal error running tests:', error.message);
  process.exit(1);
});
