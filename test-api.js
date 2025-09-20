const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test data
const testCredentials = [
  { email: 'admin@neuramaint.com', password: 'admin123', role: 'admin' },
  { email: 'joao.silva@neuramaint.com', password: 'tech123', role: 'tecnico' },
  { email: 'maria.santos@neuramaint.com', password: 'manager123', role: 'gestor' }
];

async function testAuthentication() {
  console.log('🔐 Testing Authentication...\n');
  
  for (const cred of testCredentials) {
    try {
      console.log(`Testing login for ${cred.role}: ${cred.email}`);
      
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: cred.email,
        password: cred.password
      });
      
      if (response.status === 200) {
        console.log(`✅ ${cred.role} login successful`);
        console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
        console.log(`   User: ${response.data.user.nome}\n`);
      }
    } catch (error) {
      console.log(`❌ ${cred.role} login failed: ${error.response?.data?.message || error.message}\n`);
    }
  }
}

async function testHealthCheck() {
  console.log('🏥 Testing Health Check...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Database: ${response.data.database}`);
    console.log(`   Timestamp: ${response.data.timestamp}\n`);
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}\n`);
  }
}

async function testSwaggerDocs() {
  console.log('📚 Testing Swagger Documentation...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api-docs.json`);
    console.log('✅ Swagger documentation accessible');
    console.log(`   API Title: ${response.data.info?.title}`);
    console.log(`   Version: ${response.data.info?.version}\n`);
  } catch (error) {
    console.log(`❌ Swagger docs failed: ${error.message}\n`);
  }
}

async function runTests() {
  console.log('🧪 Starting NeuraMaint API Tests\n');
  console.log('='.repeat(50));
  
  // Wait for server to be ready
  console.log('⏱️  Waiting for server to be ready...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await testHealthCheck();
  await testSwaggerDocs();
  await testAuthentication();
  
  console.log('='.repeat(50));
  console.log('🏁 API Tests Completed\n');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.log('❌ Unhandled error:', error.message);
});

runTests().catch(console.error);