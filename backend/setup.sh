#!/bin/bash

# NeuraMaint Backend Setup Script
# Configures the development environment for the backend service
# Compatible with Windows (Git Bash/WSL) and Unix systems

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   NeuraMaint Backend Setup${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_step() {
    echo -e "${YELLOW}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node -v | sed 's/v//')
        REQUIRED_VERSION="18.0.0"
        
        if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
            print_success "Node.js $NODE_VERSION is compatible (>= $REQUIRED_VERSION)"
        else
            print_error "Node.js $NODE_VERSION is not compatible. Required >= $REQUIRED_VERSION"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js >= 18.0.0"
        exit 1
    fi
}

# Setup environment variables
setup_environment() {
    print_step "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
            
            # Generate JWT secret
            JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
            
            # Update .env with generated values
            if command_exists sed; then
                # Unix-style sed
                sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
                rm -f .env.bak
            elif command_exists gsed; then
                # macOS with GNU sed
                gsed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
            else
                # Fallback for Windows
                node -e "
                    const fs = require('fs');
                    let content = fs.readFileSync('.env', 'utf8');
                    content = content.replace(/JWT_SECRET=.*/, 'JWT_SECRET=$JWT_SECRET');
                    fs.writeFileSync('.env', content);
                "
            fi
            
            print_info "Generated new JWT secret"
            print_info "Please update DATABASE_URL and other environment variables in .env file"
        else
            print_error ".env.example file not found"
            exit 1
        fi
    else
        print_info ".env file already exists, skipping creation"
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    if [ -f package-lock.json ]; then
        npm ci
    else
        npm install
    fi
    
    print_success "Dependencies installed successfully"
}

# Setup Prisma
setup_prisma() {
    print_step "Setting up Prisma..."
    
    # Generate Prisma client
    npx prisma generate
    print_success "Prisma client generated"
    
    # Check if DATABASE_URL is set
    if grep -q "postgresql://.*@.*:.*/.* " .env 2>/dev/null; then
        print_step "Applying database migrations..."
        npx prisma migrate dev --name init
        print_success "Database migrations applied"
    else
        print_info "DATABASE_URL not configured. Skipping database migration."
        print_info "Update DATABASE_URL in .env and run: npm run prisma:migrate"
    fi
}

# Create necessary directories
create_directories() {
    print_step "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p scripts
    
    print_success "Directories created"
}

# Setup development tools
setup_dev_tools() {
    print_step "Setting up development tools..."
    
    # Create VS Code settings (optional)
    if [ ! -d .vscode ]; then
        mkdir -p .vscode
        cat > .vscode/settings.json << EOF
{
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
}
EOF
        print_success "VS Code settings created"
    fi
}

# Verify setup
verify_setup() {
    print_step "Verifying setup..."
    
    # Check if TypeScript compilation works
    npm run build > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "TypeScript compilation successful"
        rm -rf dist  # Clean up build files
    else
        print_error "TypeScript compilation failed"
        exit 1
    fi
    
    # Check if Prisma client is generated
    if [ -d node_modules/.prisma/client ]; then
        print_success "Prisma client is available"
    else
        print_error "Prisma client not found"
        exit 1
    fi
}

# Main setup function
main() {
    print_header
    
    # Change to script directory
    cd "$(dirname "$0")"
    
    print_info "Starting backend setup process..."
    print_info "Working directory: $(pwd)"
    
    check_node_version
    setup_environment
    install_dependencies
    create_directories
    setup_prisma
    setup_dev_tools
    verify_setup
    
    echo
    print_success "Backend setup completed successfully!"
    echo
    print_info "Next steps:"
    print_info "1. Update DATABASE_URL in .env file"
    print_info "2. Run 'npm run prisma:migrate' to apply database schema"
    print_info "3. Run 'npm run seed' to populate with test data"
    print_info "4. Run 'npm run start:dev' to start development server"
    echo
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi