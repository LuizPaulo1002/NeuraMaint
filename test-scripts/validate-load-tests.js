// Simple validation script for load test configurations
const fs = require('fs');
const path = require('path');

// Function to validate YAML files
function validateYamlFile(filePath) {
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            return false;
        }
        
        // Read file content
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Basic validation - check if file has content
        if (content.trim().length === 0) {
            console.error(`❌ File is empty: ${filePath}`);
            return false;
        }
        
        // Check for basic YAML structure
        if (!content.includes('config:') || !content.includes('scenarios:')) {
            console.error(`❌ Invalid YAML structure in: ${filePath}`);
            return false;
        }
        
        console.log(`✅ Valid: ${path.basename(filePath)}`);
        return true;
    } catch (error) {
        console.error(`❌ Error validating ${filePath}: ${error.message}`);
        return false;
    }
}

// Validate all load test configurations
function validateAllLoadTests() {
    console.log('🔍 Validating Load Test Configurations...\n');
    
    const loadTestDir = path.join(__dirname, 'load-tests');
    const testFiles = [
        'auth-load-test.yml',
        'dashboard-load-test.yml',
        'equipment-load-test.yml',
        'sensor-readings-load-test.yml',
        'alerts-load-test.yml'
    ];
    
    let passed = 0;
    let failed = 0;
    
    // Check if load-tests directory exists
    if (!fs.existsSync(loadTestDir)) {
        console.error(`❌ Load test directory not found: ${loadTestDir}`);
        return;
    }
    
    // Validate each test file
    for (const file of testFiles) {
        const filePath = path.join(loadTestDir, file);
        if (validateYamlFile(filePath)) {
            passed++;
        } else {
            failed++;
        }
    }
    
    // Summary
    console.log('\n📊 Validation Summary:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📁 Total:  ${testFiles.length}`);
    
    if (failed === 0) {
        console.log('\n🎉 All load test configurations are valid!');
    } else {
        console.log('\n⚠️  Some load test configurations have issues.');
        process.exit(1);
    }
}

// Run validation
validateAllLoadTests();