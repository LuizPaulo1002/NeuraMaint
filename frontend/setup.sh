#!/bin/bash

# NeuraMaint Frontend Setup Script
# Configures the development environment for the frontend service
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
    echo -e "${BLUE}   NeuraMaint Frontend Setup${NC}"
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
    
    if [ ! -f .env.local ]; then
        if [ -f .env.example ]; then
            cp .env.example .env.local
            print_success "Created .env.local file from .env.example"
        else
            # Create default .env.local for Next.js
            cat > .env.local << EOF
# Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=NeuraMaint
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENVIRONMENT=development

# Optional: Analytics, monitoring, etc.
# NEXT_PUBLIC_GA_ID=
# NEXT_PUBLIC_SENTRY_DSN=
EOF
            print_success "Created default .env.local file"
        fi
        
        print_info "Please update environment variables in .env.local file if needed"
    else
        print_info ".env.local file already exists, skipping creation"
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

# Setup Next.js
setup_nextjs() {
    print_step "Setting up Next.js..."
    
    # Check if Next.js is properly installed
    if npm list next >/dev/null 2>&1; then
        print_success "Next.js is installed"
    else
        print_error "Next.js is not installed properly"
        exit 1
    fi
    
    # Create public directory if it doesn't exist
    mkdir -p public
    
    # Create default favicon if it doesn't exist
    if [ ! -f public/favicon.ico ]; then
        print_info "Creating default favicon placeholder"
        touch public/favicon.ico
    fi
}

# Create necessary directories
create_directories() {
    print_step "Creating necessary directories..."
    
    mkdir -p src/components/ui
    mkdir -p src/components/layout
    mkdir -p src/components/forms
    mkdir -p src/lib
    mkdir -p src/hooks
    mkdir -p src/types
    mkdir -p src/utils
    mkdir -p public/images
    mkdir -p public/icons
    
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
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/.git": true
  },
  "typescript.validate.enable": true,
  "javascript.validate.enable": false
}
EOF
        print_success "VS Code settings created"
    fi
    
    # Create .gitignore additions for Next.js if needed
    if [ -f .gitignore ]; then
        if ! grep -q ".next" .gitignore; then
            echo "" >> .gitignore
            echo "# Next.js" >> .gitignore
            echo ".next/" >> .gitignore
            echo "out/" >> .gitignore
            print_info "Added Next.js entries to .gitignore"
        fi
    fi
}

# Verify setup
verify_setup() {
    print_step "Verifying setup..."
    
    # Check if Next.js build works
    print_info "Testing Next.js build process..."
    npm run build > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "Next.js build successful"
        # Clean up build files
        rm -rf .next
    else
        print_error "Next.js build failed"
        exit 1
    fi
    
    # Check if TypeScript is properly configured
    if [ -f tsconfig.json ]; then
        print_success "TypeScript configuration found"
    else
        print_error "TypeScript configuration not found"
        exit 1
    fi
    
    # Check if Tailwind CSS is configured
    if [ -f tailwind.config.ts ] || [ -f tailwind.config.js ]; then
        print_success "Tailwind CSS configuration found"
    else
        print_info "Tailwind CSS configuration not found (optional)"
    fi
}

# Main setup function
main() {
    print_header
    
    # Change to script directory
    cd "$(dirname "$0")"
    
    print_info "Starting frontend setup process..."
    print_info "Working directory: $(pwd)"
    
    check_node_version
    setup_environment
    install_dependencies
    create_directories
    setup_nextjs
    setup_dev_tools
    verify_setup
    
    echo
    print_success "Frontend setup completed successfully!"
    echo
    print_info "Next steps:"
    print_info "1. Update NEXT_PUBLIC_API_URL in .env.local if backend runs on different port"
    print_info "2. Run 'npm run dev' to start development server"
    print_info "3. Open http://localhost:3000 in your browser"
    echo
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi