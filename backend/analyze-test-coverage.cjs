// Test coverage analysis script for NeuraMaint backend
// Run with: node analyze-test-coverage.js

const fs = require('fs');
const path = require('path');

// Function to count lines in a file
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

// Function to get all files in a directory recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  try {
    const files = fs.readdirSync(dirPath);

    files.forEach(function(file) {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      } else {
        arrayOfFiles.push(filePath);
      }
    });

    return arrayOfFiles;
  } catch (error) {
    return arrayOfFiles;
  }
}

// Function to analyze test coverage
function analyzeTestCoverage() {
  console.log('🔍 Analyzing Test Coverage for NeuraMaint Backend\n');

  // Paths
  const srcPath = path.join(__dirname, 'src');
  const servicesPath = path.join(srcPath, 'services');
  const testsPath = path.join(servicesPath, '__tests__');
  
  // Count service files
  const serviceFiles = getAllFiles(servicesPath)
    .filter(file => file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.d.ts'));
  
  // Count test files
  const testFiles = getAllFiles(testsPath)
    .filter(file => file.endsWith('.test.ts'));
  
  console.log('📁 Source Analysis:');
  console.log(`   Service files: ${serviceFiles.length}`);
  console.log(`   Test files: ${testFiles.length}`);
  console.log();
  
  // Calculate lines of code
  let totalServiceLines = 0;
  let totalTestLines = 0;
  
  console.log('📄 Service Files:');
  serviceFiles.forEach(file => {
    const lines = countLines(file);
    totalServiceLines += lines;
    const relativePath = path.relative(srcPath, file);
    console.log(`   ${relativePath}: ${lines} lines`);
  });
  
  console.log(`\n📝 Total service code lines: ${totalServiceLines}`);
  console.log();
  
  console.log('🧪 Test Files:');
  testFiles.forEach(file => {
    const lines = countLines(file);
    totalTestLines += lines;
    const relativePath = path.relative(srcPath, file);
    console.log(`   ${relativePath}: ${lines} lines`);
  });
  
  console.log(`\n📝 Total test code lines: ${totalTestLines}`);
  console.log();
  
  // Calculate coverage ratio
  const coverageRatio = totalServiceLines > 0 ? (totalTestLines / totalServiceLines) * 100 : 0;
  
  console.log('📊 Coverage Analysis:');
  console.log(`   Test-to-code ratio: ${coverageRatio.toFixed(2)}%`);
  
  // Coverage assessment
  if (coverageRatio >= 70) {
    console.log('   ✅ Coverage meets target (>70%)');
  } else if (coverageRatio >= 60) {
    console.log('   ⚠️  Coverage meets minimum requirement (>60%)');
  } else {
    console.log('   ❌ Coverage below minimum requirement (<60%)');
  }
  
  console.log();
  
  // Identify services without tests
  console.log('📋 Services Coverage Status:');
  
  const servicesWithTests = new Set();
  testFiles.forEach(testFile => {
    const serviceName = path.basename(testFile, '.test.ts');
    servicesWithTests.add(serviceName);
  });
  
  serviceFiles.forEach(serviceFile => {
    const serviceName = path.basename(serviceFile, '.ts');
    const hasTest = servicesWithTests.has(serviceName);
    const status = hasTest ? '✅' : '❌';
    console.log(`   ${status} ${serviceName}`);
  });
  
  console.log();
  
  // Specific service analysis
  console.log('🔍 Detailed Service Analysis:');
  
  serviceFiles.forEach(serviceFile => {
    const serviceName = path.basename(serviceFile, '.ts');
    const serviceLines = countLines(serviceFile);
    
    // Find corresponding test file
    const testFile = testFiles.find(file => 
      path.basename(file, '.test.ts') === serviceName);
    
    let testLines = 0;
    if (testFile) {
      testLines = countLines(testFile);
    }
    
    const serviceCoverage = serviceLines > 0 ? (testLines / serviceLines) * 100 : 0;
    
    console.log(`   ${serviceName}:`);
    console.log(`     - Service lines: ${serviceLines}`);
    console.log(`     - Test lines: ${testLines}`);
    console.log(`     - Coverage: ${serviceCoverage.toFixed(2)}%`);
    console.log(`     - Status: ${serviceCoverage >= 60 ? '✅' : '❌'}`);
    console.log();
  });
  
  // Summary
  console.log('📋 Test Coverage Summary:');
  console.log(`   Total service files: ${serviceFiles.length}`);
  console.log(`   Services with tests: ${servicesWithTests.size}`);
  console.log(`   Coverage percentage: ${coverageRatio.toFixed(2)}%`);
  
  const coverageStatus = coverageRatio >= 70 ? '✅ EXCELLENT' : 
                        coverageRatio >= 60 ? '⚠️  ACCEPTABLE' : 
                        '❌ INSUFFICIENT';
  
  console.log(`   Overall status: ${coverageStatus}`);
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (coverageRatio < 60) {
    console.log('   - Increase test coverage to meet minimum requirement of 60%');
  }
  
  if (coverageRatio < 70) {
    console.log('   - Increase test coverage to meet target of 70% for critical services');
  }
  
  const servicesWithoutTests = serviceFiles
    .map(file => path.basename(file, '.ts'))
    .filter(service => !servicesWithTests.has(service));
  
  if (servicesWithoutTests.length > 0) {
    console.log('   - Create tests for the following services:');
    servicesWithoutTests.forEach(service => {
      console.log(`     - ${service}`);
    });
  }
  
  console.log('\n📊 Test Coverage Analysis Complete!');
}

// Run the analysis
analyzeTestCoverage();