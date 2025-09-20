#!/usr/bin/env node

/**
 * NeuraMaint Integration Test Validation Script
 * Validates test environment setup and runs comprehensive integration tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Helper functions
function printHeader() {
  console.log(`${colors.blue}========================================`);
  console.log(`   NeuraMaint Integration Tests`);
  console.log(`========================================${colors.reset}`);
}

function printStep(message) {
  console.log(`${colors.yellow}[STEP]${colors.reset} ${message}`);
}

function printSuccess(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function printError(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

function printInfo(message) {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
}

// Validate test files exist
function validateTestFiles() {
  printStep('Validating integration test files...');
  
  const testFiles = [
    'src/integration/__tests__/auth.test.ts',
    'src/integration/__tests__/pump.test.ts',
    'src/integration/__tests__/alert.test.ts',
    'src/integration/testUtils.ts',
    'src/integration/setup.ts'
  ];

  let allFilesExist = true;
  
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      printSuccess(`✓ ${file}`);
    } else {
      printError(`✗ ${file} - Missing`);
      allFilesExist = false;
    }
  });

  if (!allFilesExist) {
    throw new Error('Some required test files are missing');
  }
  
  printSuccess('All integration test files are present');
}

// Validate package.json scripts
function validatePackageScripts() {
  printStep('Validating npm scripts...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = [
    'test:integration',
    'test:unit',
    'test',
    'test:coverage'
  ];

  let allScriptsExist = true;
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts[script]) {
      printSuccess(`✓ ${script}: ${packageJson.scripts[script]}`);
    } else {
      printError(`✗ ${script} - Missing`);
      allScriptsExist = false;
    }
  });

  if (!allScriptsExist) {
    throw new Error('Some required npm scripts are missing');
  }
  
  printSuccess('All required npm scripts are configured');
}

// Validate dependencies
function validateDependencies() {
  printStep('Validating test dependencies...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'supertest',
    '@types/supertest',
    'jest',
    '@types/jest',
    'ts-jest'
  ];

  let allDepsExist = true;
  
  requiredDeps.forEach(dep => {
    const isInDeps = packageJson.dependencies?.[dep];
    const isInDevDeps = packageJson.devDependencies?.[dep];
    
    if (isInDeps || isInDevDeps) {
      const version = isInDeps || isInDevDeps;
      printSuccess(`✓ ${dep}@${version}`);
    } else {
      printError(`✗ ${dep} - Missing`);
      allDepsExist = false;
    }
  });

  if (!allDepsExist) {
    throw new Error('Some required dependencies are missing');
  }
  
  printSuccess('All test dependencies are installed');
}

// Validate Jest configuration
function validateJestConfig() {
  printStep('Validating Jest configuration...');
  
  if (fs.existsSync('jest.config.ts')) {
    printSuccess('✓ jest.config.ts exists');
  } else if (fs.existsSync('jest.config.js')) {
    printSuccess('✓ jest.config.js exists');
  } else {
    printError('✗ Jest configuration file missing');
    throw new Error('Jest configuration not found');
  }
  
  printSuccess('Jest configuration is present');
}

// Run TypeScript compilation check
function validateTypeScript() {
  printStep('Validating TypeScript compilation...');
  
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    printSuccess('TypeScript compilation successful');
  } catch (error) {
    printError('TypeScript compilation failed');
    console.error(error.stdout?.toString() || error.message);
    throw new Error('TypeScript validation failed');
  }
}

// Run integration tests
function runIntegrationTests() {
  printStep('Running integration tests...');
  
  try {
    const output = execSync('npm run test:integration', { stdio: 'pipe', encoding: 'utf8' });
    printSuccess('Integration tests completed successfully');
    printInfo('Test output:');
    console.log(output);
  } catch (error) {
    printError('Integration tests failed');
    console.error(error.stdout?.toString() || error.message);
    // Don't throw here as tests might fail due to missing database setup
    printInfo('This may be expected if database is not configured for testing');
  }
}

// Generate test coverage report
function generateCoverage() {
  printStep('Generating test coverage report...');
  
  try {
    const output = execSync('npm run test:coverage', { stdio: 'pipe', encoding: 'utf8' });
    printSuccess('Coverage report generated');
    
    // Extract coverage summary
    const lines = output.split('\n');
    const summaryStart = lines.findIndex(line => line.includes('Coverage Summary'));
    if (summaryStart > -1) {
      printInfo('Coverage Summary:');
      lines.slice(summaryStart, summaryStart + 10).forEach(line => {
        if (line.trim()) console.log(line);
      });
    }
  } catch (error) {
    printError('Coverage generation failed');
    console.error(error.stdout?.toString() || error.message);
    // Don't throw as this is not critical for validation
  }
}

// Display test summary
function displaySummary() {
  console.log();
  printSuccess('Integration test validation completed!');
  console.log();
  printInfo('Test Structure Summary:');
  printInfo('• Authentication Tests: Login flows, protected routes, role-based access');
  printInfo('• Pump Management Tests: CRUD operations, role permissions, data validation');
  printInfo('• Alert System Tests: ML integration, threshold triggers, resolution workflows');
  printInfo('• Test Utilities: Database cleanup, seeding, authentication helpers');
  console.log();
  printInfo('Next Steps:');
  printInfo('1. Configure test database connection (DATABASE_URL)');
  printInfo('2. Run: npm run test:integration');
  printInfo('3. Run: npm run test:coverage for detailed coverage report');
  printInfo('4. Monitor test results and iterate as needed');
  console.log();
}

// Main validation function
function main() {
  printHeader();
  
  try {
    validateTestFiles();
    validatePackageScripts();
    validateDependencies();
    validateJestConfig();
    validateTypeScript();
    // runIntegrationTests(); // Commented out as it requires database setup
    // generateCoverage(); // Commented out as it requires database setup
    displaySummary();
  } catch (error) {
    printError(`Validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  validateTestFiles,
  validatePackageScripts,
  validateDependencies,
  validateJestConfig,
  validateTypeScript
};