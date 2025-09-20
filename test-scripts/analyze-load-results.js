// Load Test Results Analyzer
const fs = require('fs');
const path = require('path');

// Function to analyze a single test result
function analyzeTestResult(filePath) {
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log(`❌ Results file not found: ${filePath}`);
            return null;
        }
        
        // Read and parse the JSON results
        const rawData = fs.readFileSync(filePath, 'utf8');
        const results = JSON.parse(rawData);
        
        // Extract key metrics (handling potential undefined values)
        const scenarios = results.aggregate && results.aggregate.scenariosCreated || 0;
        const requests = results.aggregate && results.aggregate.requestsCompleted || 0;
        const errors = results.aggregate && results.aggregate.errors || 0;
        
        // Calculate success rate
        const successRate = requests > 0 ? ((requests - errors) / requests * 100) : 0;
        
        // Extract latency metrics
        const latency = results.aggregate && results.aggregate.latencies || {};
        const meanLatency = latency.mean ? (latency.mean / 1000).toFixed(2) : 'N/A';
        const maxLatency = latency.max ? (latency.max / 1000).toFixed(2) : 'N/A';
        const minLatency = latency.min ? (latency.min / 1000).toFixed(2) : 'N/A';
        
        return {
            fileName: path.basename(filePath),
            scenarios,
            requests,
            errors,
            successRate: successRate.toFixed(2),
            meanLatency,
            maxLatency,
            minLatency
        };
    } catch (error) {
        console.error(`❌ Error analyzing ${filePath}: ${error.message}`);
        return null;
    }
}

// Function to generate a summary report
function generateSummaryReport() {
    console.log('📊 NeuraMaint Load Test Results Summary');
    console.log('=====================================');
    
    const resultsDir = path.join(__dirname, 'results');
    
    // Check if results directory exists
    if (!fs.existsSync(resultsDir)) {
        console.log('❌ No results directory found. Run load tests first.');
        return;
    }
    
    // Get all JSON result files
    const resultFiles = fs.readdirSync(resultsDir)
        .filter(file => file.endsWith('-report.json'))
        .map(file => path.join(resultsDir, file));
    
    if (resultFiles.length === 0) {
        console.log('❌ No result files found in results directory.');
        return;
    }
    
    // Analyze each result file
    const analyses = [];
    for (const file of resultFiles) {
        const analysis = analyzeTestResult(file);
        if (analysis) {
            analyses.push(analysis);
        }
    }
    
    // Display results in a table format
    console.log('\n📋 Test Results:');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    console.log('Test File              │ Requests │ Errors │ Success Rate │ Mean Latency (s) │ Max Latency (s)');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    
    let totalRequests = 0;
    let totalErrors = 0;
    
    for (const analysis of analyses) {
        const fileName = analysis.fileName.replace('-report.json', '').padEnd(20);
        const requests = analysis.requests.toString().padEnd(8);
        const errors = analysis.errors.toString().padEnd(6);
        const successRate = (analysis.successRate + '%').padEnd(12);
        const meanLatency = analysis.meanLatency.toString().padEnd(16);
        const maxLatency = analysis.maxLatency.toString();
        
        console.log(`${fileName} │ ${requests} │ ${errors} │ ${successRate} │ ${meanLatency} │ ${maxLatency}`);
        
        totalRequests += analysis.requests;
        totalErrors += analysis.errors;
    }
    
    console.log('────────────────────────────────────────────────────────────────────────────────');
    
    // Calculate overall metrics
    const totalSuccessRate = totalRequests > 0 ? 
        ((totalRequests - totalErrors) / totalRequests * 100).toFixed(2) : 0;
    
    console.log(`\n📈 Overall Metrics:`);
    console.log(`   Total Requests: ${totalRequests}`);
    console.log(`   Total Errors: ${totalErrors}`);
    console.log(`   Overall Success Rate: ${totalSuccessRate}%`);
    
    // Performance assessment
    console.log('\n🎯 Performance Assessment:');
    if (totalSuccessRate >= 95) {
        console.log('   ✅ Excellent performance - Success rate above 95%');
    } else if (totalSuccessRate >= 90) {
        console.log('   👍 Good performance - Success rate between 90-95%');
    } else if (totalSuccessRate >= 80) {
        console.log('   ⚠️  Acceptable performance - Success rate between 80-90%');
    } else {
        console.log('   ❌ Poor performance - Success rate below 80%');
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (totalErrors > 0) {
        console.log('   - Investigate and fix error conditions');
    }
    
    console.log('   - Consider running tests with higher load to identify breaking points');
    console.log('   - Monitor resource utilization during load tests');
}

// Run the analysis
generateSummaryReport();