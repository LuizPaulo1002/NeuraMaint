#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';

console.log('🧪 Running NeuraMaint Unit Tests\n');

try {
  // Change to backend directory
  process.chdir(path.join(process.cwd(), 'backend'));
  
  console.log('📋 Running Jest tests...\n');
  
  // Run Jest with coverage
  const result = execSync('npx jest --config jest.config.ts --coverage --verbose', { 
    encoding: 'utf8',
    stdio: 'inherit'
  });
  
  console.log('\n✅ All tests completed successfully!');
  console.log('\n📊 Test Coverage Summary:');
  console.log('- User Service: Email/password validation, authentication flows, role-based operations');
  console.log('- Auth Service: JWT operations, login/register flows, token validation');
  console.log('- Pump Service: CRUD operations, validation, role-based access control');
  console.log('\n🎯 Coverage target: >60% for critical services');

} catch (error) {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
}