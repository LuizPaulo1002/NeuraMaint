#!/usr/bin/env node

/**
 * NeuraMaint Backend Setup Script
 * Cross-platform setup script for backend development environment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

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
  console.log(`   NeuraMaint Backend Setup`);
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

// Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version.slice(1); // Remove 'v' prefix
  const requiredVersion = '18.0.0';
  
  if (compareVersions(nodeVersion, requiredVersion) >= 0) {
    printSuccess(`Node.js ${nodeVersion} is compatible (>= ${requiredVersion})`);
  } else {
    printError(`Node.js ${nodeVersion} is not compatible. Required >= ${requiredVersion}`);
    process.exit(1);
  }
}

// Compare version strings
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(n => parseInt(n, 10));
  const parts2 = v2.split('.').map(n => parseInt(n, 10));
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  return 0;
}

// Setup environment variables
function setupEnvironment() {
  printStep('Setting up environment variables...');
  
  const envPath = '.env';
  const envExamplePath = '.env.example';
  
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      // Copy .env.example to .env
      fs.copyFileSync(envExamplePath, envPath);
      printSuccess('Created .env file from .env.example');
      
      // Generate JWT secret
      const jwtSecret = crypto.randomBytes(64).toString('hex');
      
      // Update .env with generated values
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/JWT_SECRET=.*/, `JWT_SECRET=${jwtSecret}`);
      fs.writeFileSync(envPath, envContent);
      
      printInfo('Generated new JWT secret');
      printInfo('Please update DATABASE_URL and other environment variables in .env file');
    } else {
      printError('.env.example file not found');
      process.exit(1);
    }
  } else {
    printInfo('.env file already exists, skipping creation');
  }
}

// Install dependencies
function installDependencies() {
  printStep('Installing dependencies...');
  
  try {
    if (fs.existsSync('package-lock.json')) {
      execSync('npm ci', { stdio: 'inherit' });
    } else {
      execSync('npm install', { stdio: 'inherit' });
    }
    printSuccess('Dependencies installed successfully');
  } catch (error) {
    printError('Failed to install dependencies');
    console.error(error.message);
    process.exit(1);
  }
}

// Setup Prisma
function setupPrisma() {
  printStep('Setting up Prisma...');
  
  try {
    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });
    printSuccess('Prisma client generated');
    
    // Check if DATABASE_URL is configured
    const envContent = fs.readFileSync('.env', 'utf8');
    const hasValidDbUrl = /DATABASE_URL=.*postgresql:\/\/.*@.*:.*\/.*/.test(envContent);
    
    if (hasValidDbUrl) {
      printStep('Applying database migrations...');
      execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
      printSuccess('Database migrations applied');
    } else {
      printInfo('DATABASE_URL not configured. Skipping database migration.');
      printInfo('Update DATABASE_URL in .env and run: npm run prisma:migrate');
    }
  } catch (error) {
    printError('Prisma setup failed');
    console.error(error.message);
    process.exit(1);
  }
}

// Create necessary directories
function createDirectories() {
  printStep('Creating necessary directories...');
  
  const directories = ['logs', 'uploads', 'scripts'];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  printSuccess('Directories created');
}

// Setup development tools
function setupDevTools() {
  printStep('Setting up development tools...');
  
  // Create VS Code settings (optional)
  const vscodeDir = '.vscode';
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir, { recursive: true });
    
    const vscodeSettings = {
      "typescript.preferences.importModuleSpecifier": "relative",
      "editor.formatOnSave": true,
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit"
      },
      "files.exclude": {
        "**/node_modules": true,
        "**/dist": true,
        "**/.git": true
      }
    };
    
    fs.writeFileSync(
      path.join(vscodeDir, 'settings.json'), 
      JSON.stringify(vscodeSettings, null, 2)
    );
    printSuccess('VS Code settings created');
  }
}

// Verify setup
function verifySetup() {
  printStep('Verifying setup...');
  
  try {
    // Check if TypeScript compilation works
    execSync('npm run build', { stdio: 'pipe' });
    printSuccess('TypeScript compilation successful');
    
    // Clean up build files
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
  } catch (error) {
    printError('TypeScript compilation failed');
    console.error(error.message);
    process.exit(1);
  }
  
  // Check if Prisma client is generated
  const prismaClientPath = path.join('node_modules', '.prisma', 'client');
  if (fs.existsSync(prismaClientPath)) {
    printSuccess('Prisma client is available');
  } else {
    printError('Prisma client not found');
    process.exit(1);
  }
}

// Main setup function
function main() {
  printHeader();
  
  printInfo('Starting backend setup process...');
  printInfo(`Working directory: ${process.cwd()}`);
  
  checkNodeVersion();
  setupEnvironment();
  installDependencies();
  createDirectories();
  setupPrisma();
  setupDevTools();
  verifySetup();
  
  console.log();
  printSuccess('Backend setup completed successfully!');
  console.log();
  printInfo('Next steps:');
  printInfo('1. Update DATABASE_URL in .env file');
  printInfo('2. Run \'npm run prisma:migrate\' to apply database schema');
  printInfo('3. Run \'npm run seed\' to populate with test data');
  printInfo('4. Run \'npm run start:dev\' to start development server');
  console.log();
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  setupEnvironment,
  installDependencies,
  setupPrisma,
  createDirectories,
  setupDevTools,
  verifySetup
};