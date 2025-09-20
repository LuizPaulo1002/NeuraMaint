// Documentation test script
// Run with: node test-documentation.cjs

const fs = require('fs');
const path = require('path');

async function testDocumentation() {
  console.log('📚 Starting Documentation Alignment Tests\n');

  try {
    // Test 1: Check if README files exist
    console.log('1️⃣ Checking README files...');
    
    const readmeFiles = [
      path.join(__dirname, 'README.md'),
      path.join(__dirname, '..', 'README.md'),
      path.join(__dirname, 'docs', 'README.md')
    ];
    
    let readmeFound = false;
    for (const readmePath of readmeFiles) {
      if (fs.existsSync(readmePath)) {
        console.log('✅ README file found:', path.relative(__dirname, readmePath));
        readmeFound = true;
        
        // Check content
        const content = fs.readFileSync(readmePath, 'utf8');
        if (content.length > 100) {
          console.log('   Content length:', content.length, 'characters');
        }
      }
    }
    
    if (!readmeFound) {
      console.log('❌ No README files found');
    }
    console.log();

    // Test 2: Check if API documentation exists
    console.log('2️⃣ Checking API documentation...');
    
    // Check for Swagger/OpenAPI files
    const apiDocFiles = [
      path.join(__dirname, 'docs', 'swagger.json'),
      path.join(__dirname, 'docs', 'openapi.json'),
      path.join(__dirname, 'src', 'docs'),
      path.join(__dirname, 'swagger.json'),
      path.join(__dirname, 'openapi.json')
    ];
    
    let apiDocsFound = false;
    for (const docPath of apiDocFiles) {
      if (fs.existsSync(docPath)) {
        console.log('✅ API documentation found:', path.relative(__dirname, docPath));
        apiDocsFound = true;
        
        if (fs.statSync(docPath).isDirectory()) {
          const files = fs.readdirSync(docPath);
          console.log('   Files in directory:', files.length);
          files.slice(0, 3).forEach(file => {
            console.log(`     - ${file}`);
          });
        }
      }
    }
    
    if (!apiDocsFound) {
      console.log('⚠️  No API documentation files found');
    }
    console.log();

    // Test 3: Check if documentation matches implementation
    console.log('3️⃣ Checking documentation alignment...');
    
    // Check if there are route files that should be documented
    const routesDir = path.join(__dirname, 'src', 'routes');
    if (fs.existsSync(routesDir)) {
      const routeFiles = fs.readdirSync(routesDir);
      console.log('✅ Route files found:', routeFiles.length);
      
      if (routeFiles.length > 0) {
        console.log('   Sample route files:');
        routeFiles.slice(0, 5).forEach(file => {
          console.log(`     - ${file}`);
        });
        
        // Check if documentation mentions these routes
        let docsMentionRoutes = false;
        for (const readmePath of readmeFiles) {
          if (fs.existsSync(readmePath)) {
            const content = fs.readFileSync(readmePath, 'utf8');
            for (const routeFile of routeFiles) {
              const routeName = path.basename(routeFile, '.ts');
              if (content.includes(routeName) || content.includes(routeFile)) {
                docsMentionRoutes = true;
                break;
              }
            }
            if (docsMentionRoutes) break;
          }
        }
        
        if (docsMentionRoutes) {
          console.log('✅ Documentation mentions route files');
        } else {
          console.log('⚠️  Documentation may not mention all route files');
        }
      }
    } else {
      console.log('❌ Routes directory not found');
    }
    console.log();

    // Test 4: Check for testing documentation
    console.log('4️⃣ Checking testing documentation...');
    
    const testDocFiles = [
      path.join(__dirname, 'TESTING.md'),
      path.join(__dirname, '..', 'TESTING.md'),
      path.join(__dirname, 'docs', 'TESTING.md')
    ];
    
    let testDocsFound = false;
    for (const docPath of testDocFiles) {
      if (fs.existsSync(docPath)) {
        console.log('✅ Testing documentation found:', path.relative(__dirname, docPath));
        testDocsFound = true;
      }
    }
    
    if (!testDocsFound) {
      console.log('⚠️  No testing documentation found');
    }
    console.log();

    // Test 5: Check for setup documentation
    console.log('5️⃣ Checking setup documentation...');
    
    const setupFiles = [
      'setup.sh',
      'setup.bat',
      'INSTALL.md',
      'INSTALLATION.md'
    ];
    
    let setupDocsFound = false;
    for (const setupFile of setupFiles) {
      const setupPath = path.join(__dirname, setupFile);
      if (fs.existsSync(setupPath)) {
        console.log('✅ Setup documentation found:', setupFile);
        setupDocsFound = true;
      }
    }
    
    if (!setupDocsFound) {
      console.log('⚠️  No setup documentation found');
    }
    console.log();

    // Test 6: Check for environment documentation
    console.log('6️⃣ Checking environment documentation...');
    
    const envFiles = [
      '.env.example',
      '.env.sample',
      'ENVIRONMENT.md'
    ];
    
    let envDocsFound = false;
    for (const envFile of envFiles) {
      const envPath = path.join(__dirname, envFile);
      if (fs.existsSync(envPath)) {
        console.log('✅ Environment documentation found:', envFile);
        envDocsFound = true;
      }
    }
    
    if (!envDocsFound) {
      console.log('⚠️  No environment documentation found');
    }
    console.log();

    // Test 7: Check for API endpoints documentation
    console.log('7️⃣ Checking API endpoints documentation...');
    
    // Check if there's a health endpoint documented
    let healthEndpointFound = false;
    for (const readmePath of readmeFiles) {
      if (fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf8');
        if (content.includes('/health') || content.includes('health')) {
          healthEndpointFound = true;
          break;
        }
      }
    }
    
    if (healthEndpointFound) {
      console.log('✅ Health endpoint documented');
    } else {
      console.log('⚠️  Health endpoint may not be documented');
    }
    
    // Check for common API endpoints
    const commonEndpoints = ['/api/login', '/api/bombas', '/api/alertas', '/api/leituras'];
    let endpointsDocumented = 0;
    
    for (const endpoint of commonEndpoints) {
      let found = false;
      for (const readmePath of readmeFiles) {
        if (fs.existsSync(readmePath)) {
          const content = fs.readFileSync(readmePath, 'utf8');
          if (content.includes(endpoint)) {
            found = true;
            break;
          }
        }
      }
      if (found) endpointsDocumented++;
    }
    
    console.log(`✅ ${endpointsDocumented}/${commonEndpoints.length} common endpoints documented`);
    console.log();

    console.log('📚 Documentation Alignment tests completed!');

  } catch (error) {
    console.error('❌ Documentation test error:', error.message);
  }
}

// Run documentation tests
testDocumentation();