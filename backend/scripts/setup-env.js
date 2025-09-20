#!/usr/bin/env node

/**
 * NeuraMaint Environment Setup Script
 * Simple script to setup .env file from .env.example
 */

const fs = require('fs');
const crypto = require('crypto');

function setupEnvironment() {
  console.log('🔧 Setting up environment variables...');
  
  const envPath = '.env';
  const envExamplePath = '.env.example';
  
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      // Copy .env.example to .env
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ Created .env file from .env.example');
      
      // Generate JWT secret
      const jwtSecret = crypto.randomBytes(64).toString('hex');
      
      // Update .env with generated values
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET=${jwtSecret}`);
      fs.writeFileSync(envPath, envContent);
      
      console.log('🔑 Generated new JWT secret');
      console.log('ℹ️  Please update DATABASE_URL and other environment variables in .env file');
    } else {
      console.error('❌ .env.example file not found');
      process.exit(1);
    }
  } else {
    console.log('ℹ️  .env file already exists, skipping creation');
  }
}

// Execute if run directly
if (require.main === module) {
  setupEnvironment();
}

module.exports = { setupEnvironment };